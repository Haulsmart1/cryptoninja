const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const compiled = ts.transpileModule(readFileSync(`${__dirname}/../components/AutoTraderPanel.tsx`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function harness(initialStatus, response) {
  const state = [initialStatus, false, '', ''];
  const callbacks = [];
  const calls = [];
  let cursor = 0;
  let refCursor = 0;
  const refs = [];
  const modules = {
    react: { ...React, useEffect() {}, useRef(initial) {
      const index = refCursor++;
      return refs[index] ?? (refs[index] = { current: initial });
    }, useState(initial) {
      const index = cursor++;
      if (!(index in state)) state[index] = initial;
      return [state[index], value => { state[index] = value; }];
    }, useCallback(callback) { callbacks.push(callback); return callback; } },
    'react/jsx-runtime': require('react/jsx-runtime'),
    '../lib/auth-fetch': { authFetch: async (...args) => {
      calls.push(args);
      if (response instanceof Error) throw response;
      if (typeof response === 'function') return response(...args);
      return response;
    } },
  };
  const result = {};
  new Function('require', 'exports', compiled)(name => {
    assert.ok(modules[name], `Unexpected dependency: ${name}`);
    return modules[name];
  }, result);
  return {
    calls,
    render() { cursor = 0; refCursor = 0; return result.default(); },
    async load() { await callbacks[0](); },
    state,
  };
}

function buttons(tree) {
  const found = [];
  function visit(node) {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'button') found.push(node.props);
    for (const value of React.Children.toArray(node.props?.children)) visit(value);
  }
  visit(tree);
  return found;
}

const running = { enabled: true, emergency_stop: false, interval_seconds: 300, min_confidence: 85, max_risk_score: 50, trades_today: 9, last_run_at: null, last_decision: null };

test('a failed engine poll removes stale RUNNING and stale numeric metrics', async () => {
  const h = harness(running, new Response(JSON.stringify({ error: 'Engine unavailable' }), { status: 503 }));
  assert.match(renderToStaticMarkup(h.render()), /RUNNING/);
  await h.load();
  const tree = h.render();
  const html = renderToStaticMarkup(tree);
  assert.doesNotMatch(html, /● RUNNING|85%|50\/100|>9<|5 min/);
  assert.match(html, /UNAVAILABLE/);
  assert.match(html, /paper trading/);
  const [start, stop] = buttons(tree);
  assert.equal(start.disabled, true);
  assert.equal(stop.disabled, false, 'A safety stop remains available while actual engine state is unknown');
  assert.deepEqual(h.calls.map(call => call[0]), ['/api/autotrader/status']);
});

test('initial unknown status never claims stopped or defaults metrics and cannot start', () => {
  const h = harness(null, null);
  const tree = h.render();
  const html = renderToStaticMarkup(tree);
  assert.match(html, /UNAVAILABLE/);
  assert.doesNotMatch(html, /● STOPPED|85%|50\/100|5 min/);
  assert.equal(buttons(tree)[0].disabled, true);
  assert.deepEqual(h.calls, []);
});

test('network failure and malformed success payload both clear cached status', async () => {
  for (const response of [new Error('Synthetic connection refused'), new Response('{}'), new Response('not-json'), Response.json({ ...running, emergency_stop: 'true' })]) {
    const h = harness(running, response);
    h.render();
    await h.load();
    assert.equal(h.state[0], null);
    assert.match(renderToStaticMarkup(h.render()), /UNAVAILABLE/);
  }
});

test('an older successful poll cannot resurrect RUNNING after a newer failure', async () => {
  let resolveOlder;
  let count = 0;
  const h = harness(running, () => ++count === 1
    ? new Promise(resolve => { resolveOlder = resolve; })
    : Response.json({ error: 'Engine unavailable' }, { status: 503 }));
  h.render();
  const older = h.load();
  await h.load();
  assert.equal(h.state[0], null);
  resolveOlder(Response.json(running));
  await older;
  assert.equal(h.state[0], null);
  assert.match(renderToStaticMarkup(h.render()), /UNAVAILABLE/);
});

test('verified stopped/running/safety-locked status preserves paper controls', async () => {
  for (const status of [running, { ...running, enabled: false }, { ...running, emergency_stop: true }]) {
    const h = harness(null, Response.json(status));
    h.render();
    await h.load();
    const tree = h.render();
    const html = renderToStaticMarkup(tree);
    assert.match(html, status.emergency_stop ? /SAFETY LOCKED/ : status.enabled ? /RUNNING/ : /STOPPED/);
    const [start, stop] = buttons(tree);
    assert.equal(start.disabled, status.enabled || status.emergency_stop);
    assert.equal(stop.disabled, !status.enabled || status.emergency_stop);
  }
});
