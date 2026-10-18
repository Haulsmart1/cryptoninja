const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const settle = () => new Promise(resolve => setImmediate(resolve));
const summary = { cash: 9000, invested: 1234, market_value: 1400, portfolio_value: 10400, unrealized_pnl: 166, total_pnl: 400, return_percent: 4, btc_price: 60000, open_position_count: 3 };

// Render actual components with synthetic local responses; never contact engines or databases.
function harness(path, responses, props = {}) {
  const state = [], refs = [], effects = [], chartRows = [];
  let cursor = 0, refCursor = 0, poll, cleanup;
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/../${path}`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const query = { select() { return this; }, order() { return this; }, limit: async () => ({ data: path.includes('dashboard') ? [] : responses.shift(), error: null }) };
  const timers = { setInterval(callback) { poll = callback; return 1; }, clearInterval() {} };
  new Function('require', 'exports', 'fetch', 'setInterval', 'clearInterval', 'window', compiled)(name => {
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'react') return { ...React,
      useState(initial) { const index = cursor++; if (!(index in state)) state[index] = initial; return [state[index], value => { state[index] = typeof value === 'function' ? value(state[index]) : value; }]; },
      useRef(initial) { const index = refCursor++; return refs[index] ?? (refs[index] = { current: initial }); },
      useCallback(callback) { return callback; }, useMemo(callback) { return callback(); },
      useEffect(callback) { effects.push(callback); },
    };
    if (name.endsWith('supabase-browser')) return { createClient: () => ({ from: () => query }) };
    if (name.endsWith('auth-fetch')) return { authFetch: async () => {
      const response = responses.shift();
      if (response instanceof Error) throw response;
      return typeof response === 'function' ? response() : response;
    } };
    if (name === 'next/link') return { default: ({ children }) => React.createElement('span', null, children) };
    if (name === 'recharts') return new Proxy({}, { get: (_target, name) => ({ children, data }) => {
      if (name === 'LineChart' || name === 'AreaChart') chartRows.push(data);
      return React.createElement('div', null, children);
    } });
    if (name.includes('/components/')) return { default: () => null };
    throw new Error(`Unexpected import ${name}`);
  }, exports, async url => Response.json(url.endsWith('/health') ? { status: 'offline', paper_trading: true } : {}), timers.setInterval, timers.clearInterval, timers);
  function render() { cursor = 0; refCursor = 0; return renderToStaticMarkup(exports.default(props)); }
  return { render, chartRows,
    async mount() { render(); cleanup = effects[0](); await settle(); },
    async poll() { await poll(); await settle(); },
    unmount() { cleanup(); },
    card(label) { const html = render(); const index = html.indexOf(`>${label}</p>`); assert.ok(index >= 0); return html.slice(index).match(/<p[^>]*>(.*?)<\/p>/)[1]; },
  };
}

test('HTTP 503 clears previously displayed dashboard portfolio totals', async () => {
  const h = harness('app/dashboard/page.tsx', [Response.json(summary), Response.json({ error: 'Synthetic outage' }, { status: 503 })]);
  await h.mount(); assert.match(h.card('Portfolio Value'), /10,400/);
  assert.equal(h.card('Open Positions'), '3', 'The count comes from the complete upstream summary, not recent trades');
  await h.poll();
  for (const label of ['Portfolio Value', 'Cash', 'Invested', 'Current Value']) assert.match(h.card(label), /Unavailable/);
});

test('an initial outage never invents an empty balance or a total loss', async () => {
  const h = harness('app/dashboard/page.tsx', [new Error('Synthetic network failure')]);
  await h.mount();
  assert.match(h.card('Portfolio Value'), /Unavailable/);
  assert.match(h.card('Starting Balance'), /Not supplied/);
  assert.doesNotMatch(h.render(), /-.*10,000\.00|-100\.00%/);
});

test('malformed successful portfolio payloads fail closed and genuine zero remains zero', async () => {
  for (const data of [{}, null, [], { ...summary, cash: null }, { ...summary, portfolio_value: '10400' }]) {
    const h = harness('app/dashboard/page.tsx', [Response.json(data)]);
    await h.mount(); assert.doesNotThrow(h.render); assert.match(h.card('Portfolio Value'), /Unavailable/);
  }
  const h = harness('app/dashboard/page.tsx', [Response.json({ ...summary, cash: 0, invested: 0, portfolio_value: 0, total_pnl: 0, return_percent: 0 })]);
  await h.mount(); assert.match(h.card('Portfolio Value'), /£0/); assert.doesNotMatch(h.card('Portfolio Value'), /Unavailable/);
});

test('an older portfolio success cannot overwrite a newer failure', async () => {
  let resolveOlder;
  const h = harness('app/dashboard/page.tsx', [() => new Promise(resolve => { resolveOlder = resolve; }), new Response('', { status: 503 })]);
  await h.mount(); await h.poll(); resolveOlder(Response.json(summary)); await settle();
  assert.match(h.card('Portfolio Value'), /Unavailable/);
});

for (const component of ['PortfolioChart', 'EquityCurve']) {
  test(`${component} uses one actual snapshot without invented timestamps`, async () => {
    const row = { portfolio_value: '123.45', created_at: '2026-10-17T12:00:00Z' };
    const h = harness(`components/${component}.tsx`, [[row]], { portfolioValue: 99999 });
    await h.mount(); h.render();
    assert.deepEqual(h.chartRows.at(-1), [{ portfolio_value: 123.45, created_at: row.created_at }]);
    if (component === 'EquityCurve') assert.match(h.card('Saved Interval Change'), /Unavailable/);
  });
  test(`${component} rejects missing amounts and shows no synthetic fallback history`, async () => {
    const h = harness(`components/${component}.tsx`, [[{ portfolio_value: null, created_at: '2026-10-17T12:00:00Z' }, { portfolio_value: '', created_at: '2026-10-17T13:00:00Z' }]], { portfolioValue: 99999 });
    await h.mount(); const html = h.render();
    assert.equal(h.chartRows.length, 0);
    assert.match(html, /No .*history yet/i);
    assert.doesNotMatch(html, /99,999|£10,000|£0\.00/);
  });
}
