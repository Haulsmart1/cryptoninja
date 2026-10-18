const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const compiled = ts.transpileModule(readFileSync(`${__dirname}/../components/AIReasoningPanel.tsx`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

const decision = { symbol: 'BTC-GBP', action: 'BUY', confidence: 92, trend: 'Bullish', momentum: 'Positive', rsi: 52, reason: 'Synthetic paper analysis' };
const settle = () => new Promise(resolve => setImmediate(resolve));

// Exercise the real component and render its output; all requests stay mocked.
function harness(responses, timeout = AbortSignal.timeout.bind(AbortSignal)) {
  const state = [], refs = [], effects = [], calls = [];
  let cursor = 0, refCursor = 0, poll, cleanup;
  const exports = {};
  new Function('require', 'exports', 'fetch', 'setInterval', 'clearInterval', 'AbortSignal', compiled)(name => {
    if (name === 'react/jsx-runtime') return require(name);
    assert.equal(name, 'react');
    return { ...React,
      useState(initial) {
        const index = cursor++;
        if (!(index in state)) state[index] = initial;
        return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }];
      },
      useRef(initial) { const index = refCursor++; return refs[index] ?? (refs[index] = { current: initial }); },
      useCallback(callback) { return callback; },
      useEffect(callback) { effects.push(callback); },
    };
  }, exports, async (...args) => {
    calls.push(args);
    const response = responses.shift();
    if (response instanceof Error) throw response;
    return typeof response === 'function' ? response(...args) : response;
  }, (callback, ms) => { assert.equal(ms, 15000); poll = callback; return 1; }, () => {}, { timeout });
  function render() { cursor = 0; refCursor = 0; return renderToStaticMarkup(exports.default()); }
  return {
    calls, render,
    async mount() { render(); cleanup = effects[0](); await settle(); },
    async poll() { await poll(); await settle(); },
    unmount() { cleanup(); },
  };
}

test('an HTTP outage clears previously displayed AI advice and scores', async () => {
  const h = harness([Response.json(decision), Response.json({ error: 'Synthetic outage' }, { status: 503 })]);
  await h.mount();
  assert.match(h.render(), /BUY BTC-GBP/);
  await h.poll();
  assert.doesNotMatch(h.render(), /BUY BTC-GBP|92%|Bullish|Synthetic outage/);
  assert.match(h.render(), /AI analysis unavailable/);
});

test('first-request failure becomes unavailable instead of loading forever', async () => {
  const h = harness([new Error('Synthetic confidential diagnostic')]);
  assert.match(h.render(), /Loading AI Analysis/);
  await h.mount();
  assert.match(h.render(), /AI analysis unavailable/);
  assert.doesNotMatch(h.render(), /Loading AI Analysis|confidential/);
});

test('invalid successful payloads cannot become displayed analysis', async () => {
  for (const body of ['not-json', 'null', '[]', '{}', JSON.stringify({ ...decision, confidence: '92' }), JSON.stringify({ ...decision, confidence: 101 }), JSON.stringify({ ...decision, rsi: null }), JSON.stringify({ ...decision, reason: { detail: 'invalid' } })]) {
    const h = harness([Response.json(decision), new Response(body)]);
    await h.mount();
    await h.poll();
    assert.doesNotThrow(() => h.render());
    assert.match(h.render(), /AI analysis unavailable/);
    assert.doesNotMatch(h.render(), /BUY BTC-GBP|92%/);
  }
});

test('a delayed older success cannot restore advice after a newer outage', async () => {
  let resolveOlder;
  const h = harness([() => new Promise(resolve => { resolveOlder = resolve; }), new Response('', { status: 503 })]);
  await h.mount();
  await h.poll();
  resolveOlder(Response.json(decision));
  await settle();
  assert.match(h.render(), /AI analysis unavailable/);
  assert.doesNotMatch(h.render(), /BUY BTC-GBP|92%/);
});

test('a later valid response recovers analysis without fabricated defaults', async () => {
  const h = harness([new Response('', { status: 503 }), Response.json(decision)]);
  await h.mount();
  await h.poll();
  assert.match(h.render(), /BUY BTC-GBP/);
  assert.match(h.render(), /92%/);
  assert.match(h.render(), /Paper trading/);
  assert.deepEqual(h.calls.map(call => call[0]), ['/api/trading/analysis/BTC-GBP', '/api/trading/analysis/BTC-GBP']);
});

test('a stalled read reaches unavailable at its bounded deadline', async () => {
  const controller = new AbortController();
  const h = harness([async (_url, options) => ({ ok: true, json: async () => {
    assert.equal(options.signal, controller.signal);
    queueMicrotask(() => controller.abort());
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Synthetic timeout')), { once: true }));
  } })], ms => { assert.equal(ms, 10000); return controller.signal; });
  await h.mount();
  assert.match(h.render(), /AI analysis unavailable/);
  assert.doesNotMatch(h.render(), /Loading AI Analysis|Synthetic timeout/);
});

test('an unmounted request cannot apply a late result', async () => {
  let resolveOlder;
  const h = harness([() => new Promise(resolve => { resolveOlder = resolve; })]);
  await h.mount();
  h.unmount();
  resolveOlder(Response.json(decision));
  await settle();
  assert.doesNotMatch(h.render(), /BUY BTC-GBP|92%/);
});
