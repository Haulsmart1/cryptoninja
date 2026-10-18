const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const settle = () => new Promise(resolve => setImmediate(resolve));

// Execute the real dashboard with synthetic reads only; never run a trade or call services.
function harness(healthReplies, tradeReplies = [{ data: [], error: null }]) {
  const states = [], refs = [], effects = [];
  let cursor = 0, refCursor = 0, poll, cleanup;
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/../app/dashboard/page.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  // These existing unit cases exercise the unchanged inner data view; the
  // separate real-DOM boundary suite covers the exported composition.
  }).outputText + '\nexports.default = DashboardContent;';
  const exports = {};
  const query = { select() { return this; }, order() { return this; }, async limit() {
    const reply = tradeReplies.shift() ?? { data: [], error: null };
    if (reply instanceof Error) throw reply;
    return typeof reply === 'function' ? reply() : reply;
  } };
  new Function('require', 'exports', 'fetch', 'setInterval', 'clearInterval', compiled)(name => {
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'react') return { ...React,
      useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
      useRef(initial) { const i = refCursor++; return refs[i] ?? (refs[i] = { current: initial }); },
      useEffect(callback) { effects.push(callback); },
    };
    if (name.endsWith('supabase-browser')) return { createClient: () => ({ from: () => query }) };
    if (name.endsWith('auth-fetch')) return { authFetch: async () => new Response('', { status: 503 }) };
    if (name === 'next/link') return { default: ({ children }) => React.createElement('span', null, children) };
    if (name.includes('/components/')) return { default: () => null };
    throw new Error(`Unexpected import ${name}`);
  }, exports, async url => {
    if (!url.endsWith('/health')) return Response.json({});
    const reply = healthReplies.shift() ?? Response.json({ status: 'offline', paper_trading: true });
    if (reply instanceof Error) throw reply;
    return typeof reply === 'function' ? reply() : reply;
  }, callback => { poll = callback; return 1; }, () => {});
  function render() { cursor = 0; refCursor = 0; return renderToStaticMarkup(exports.default()); }
  return { render,
    async mount() { render(); cleanup = effects[0](); await settle(); },
    async poll() { await poll(); await settle(); },
    unmount() { cleanup(); },
  };
}

test('offline dashboard never claims unobserved broker, risk or database success', async () => {
  const h = harness([new Error('local outage')], [{ data: null, error: { message: 'local database outage' } }]);
  await h.mount();
  const html = h.render();
  assert.doesNotMatch(html, />Active<|>Protected<|>Connected<|BTC is holding above support|Risk remains low/);
  assert.match(html, /Trade history unavailable/);
  assert.doesNotMatch(html, /No paper trades logged yet/);
});

test('HTTP denial and malformed health replies cannot enable paper execution', async () => {
  for (const reply of [Response.json({ status: 'healthy', paper_trading: true }, { status: 503 }), Response.json(null), Response.json({ status: 'healthy' }), Response.json({ status: 'healthy', paper_trading: false })]) {
    const h = harness([reply]); await h.mount();
    assert.match(h.render(), /disabled=""[^>]*>Run Paper Trade/);
    assert.doesNotMatch(h.render(), /Engine Online/);
  }
});

test('confirmed paper health and an empty successful history remain usable', async () => {
  const h = harness([Response.json({ status: 'healthy', paper_trading: true })]);
  await h.mount(); const html = h.render();
  assert.match(html, /Engine Online/);
  assert.match(html, /Read confirmed/);
  assert.match(html, /No paper trades logged yet/);
  assert.doesNotMatch(html, />Protected</);
});

test('older health success cannot override a newer offline observation', async () => {
  let resolveOlder;
  const h = harness([() => new Promise(resolve => { resolveOlder = resolve; }), new Response('', { status: 503 })]);
  await h.mount(); await h.poll();
  resolveOlder(Response.json({ status: 'healthy', paper_trading: true })); await settle();
  assert.doesNotMatch(h.render(), /Engine Online/);
});

test('failed history refresh clears confirmed state and stale rows', async () => {
  const trade = { id: 'synthetic', symbol: 'TEST-GBP', side: 'buy', quantity: '1', price: '2', value_gbp: '2', cash_gbp: '8', status: 'paper', created_at: '2026-10-18T00:00:00Z' };
  const h = harness([], [{ data: [trade], error: null }, { data: null, error: { message: 'local denied' } }]);
  await h.mount(); assert.match(h.render(), /TEST-GBP/);
  await h.poll(); assert.doesNotMatch(h.render(), /TEST-GBP|Read confirmed/);
  assert.match(h.render(), /Trade history unavailable/);
});

test('thrown history reads settle safely and older history cannot override a later failure', async () => {
  const failure = harness([], [new Error('local rejection')]); await failure.mount();
  assert.match(failure.render(), /Trade history unavailable/);
  let resolveOlder;
  const h = harness([], [() => new Promise(resolve => { resolveOlder = resolve; }), { data: null, error: { message: 'local denied' } }]);
  await h.mount(); await h.poll(); resolveOlder({ data: [], error: null }); await settle();
  assert.match(h.render(), /Trade history unavailable/);
});
