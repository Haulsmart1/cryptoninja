const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const tick = () => new Promise(resolve => setTimeout(resolve, 15));
const row = owner => ({ id: owner, symbol: `PRIVATE_${owner}`, side: 'buy', quantity: '1', price: '1', value_gbp: '1', cash_gbp: '2', status: 'paper', reason: `DETAIL_${owner}`, created_at: '2026-10-18T00:00:00Z' });
const portfolio = owner => ({ cash: owner === 'A' ? 11111 : 22222, invested: 0, market_value: 0, portfolio_value: owner === 'A' ? 11111 : 22222, unrealized_pnl: 0, total_pnl: 0, return_percent: 0, btc_price: 1 });

// Actual dashboard and React DOM. Children are synthetic retained-state probes;
// data/identity replies are synthetic and trading actions are never invoked.
async function fixture(options = {}) {
  const dom = new JSDOM('<div id="root"></div>');
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = require('react-dom/client');
  let user = options.initialUser === null ? null : { id: 'A' }, callback, inCallback = false, sdkInsideCallback = false, reads = 0, authCalls = 0, unsubscribed = 0, mounted = 0, unmounted = 0;
  const timers = new Map(); let nextTimer = 0;
  const client = { auth: {
    async getUser() { sdkInsideCallback ||= inCallback; authCalls++; return options.auth ? options.auth(user, authCalls) : { data: { user }, error: null }; },
    onAuthStateChange(fn) { callback = fn; return { data: { subscription: { unsubscribe() { unsubscribed++; } } } }; },
  }, from() {
    sdkInsideCallback ||= inCallback; reads++; const owner = user?.id;
    return { select() { return this; }, order() { return this; }, limit() {
      return options.read ? options.read(owner, reads) : Promise.resolve({ data: [row(owner)], error: null });
    } };
  } };
  const source = readFileSync(`${__dirname}/../app/dashboard/page.tsx`, 'utf8');
  const compiled = ts.transpileModule(options.source ? options.source(source) : source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', 'fetch', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', compiled)(name => {
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    if (name.endsWith('supabase-browser')) return { createClient: () => client };
    if (name.endsWith('auth-fetch')) return { authFetch: async (_url, init) => {
      assert.notEqual(init?.method, 'POST'); sdkInsideCallback ||= inCallback;
      const owner = user?.id; return options.portfolio ? options.portfolio(owner) : Response.json(portfolio(owner));
    } };
    if (name === 'next/link') return { default: ({ children }) => React.createElement('span', null, children) };
    if (name.includes('/components/')) return { default: () => {
      const [cachedOwner] = React.useState(user?.id);
      React.useEffect(() => { mounted++; return () => { unmounted++; }; }, []);
      return React.createElement('span', null, `CHILD_${cachedOwner}`);
    } };
    throw new Error(`Unexpected import ${name}`);
  }, exports, async url => Response.json(url.endsWith('/health') ? { status: 'offline', paper_trading: true } : {}),
  (fn, ms) => { assert.equal(ms, 10000); timers.set(++nextTimer, fn); return nextTimer; }, id => timers.delete(id), () => 1, () => {});
  const root = createRoot(document.getElementById('root'));
  await React.act(async () => { root.render(React.createElement(exports.default)); await tick(); });
  await React.act(async () => { await tick(); });
  return {
    text: () => document.body.textContent,
    get reads() { return reads; }, get mounted() { return mounted; }, get unmounted() { return unmounted; }, get sdkInsideCallback() { return sdkInsideCallback; }, get unsubscribed() { return unsubscribed; },
    async emit(event, next) { await React.act(async () => { user = next; inCallback = true; callback?.(event, user ? { user } : null); inCallback = false; await tick(); }); await React.act(async () => { await tick(); }); },
    async settle(fn) { await React.act(async () => { fn?.(); await tick(); }); },
    async modal() { await React.act(async () => { [...document.querySelectorAll('tr')].filter(node => node.textContent.includes('PRIVATE_')).at(-1)?.click(); }); },
    async expire() { await React.act(async () => { for (const fn of [...timers.values()]) fn(); await tick(); }); },
    async close() { await React.act(async () => root.unmount()); dom.window.close(); delete global.window; delete global.document; delete global.IS_REACT_ACT_ENVIRONMENT; },
  };
}

test('sign-out removes rows, portfolio, selected details and every cached child', async () => {
  const h = await fixture(); try {
    assert.match(h.text(), /PRIVATE_A|CHILD_A/); await h.modal(); assert.match(h.text(), /TRADE DETAILS/);
    const reads = h.reads, mounted = h.mounted;
    await h.emit('SIGNED_OUT', null); assert.doesNotMatch(h.text(), /PRIVATE_A|CHILD_A|11,111|DETAIL_A|TRADE DETAILS/);
    assert.match(h.text(), /Sign in to view/); assert.equal(h.reads, reads); assert.equal(h.unmounted, mounted); assert.equal(h.sdkInsideCallback, false);
  } finally { await h.close(); }
});

test('B mounts fresh children while delayed A reads and portfolio cannot return', async () => {
  let resolveA, resolvePortfolioA;
  const h = await fixture({ read: owner => owner === 'A' ? new Promise(resolve => { resolveA = resolve; }) : Promise.resolve({ data: [row(owner)], error: null }), portfolio: owner => owner === 'A' ? new Promise(resolve => { resolvePortfolioA = resolve; }) : Response.json(portfolio(owner)) }); try {
    await h.emit('SIGNED_IN', { id: 'B' }); assert.match(h.text(), /PRIVATE_B/); assert.match(h.text(), /CHILD_B/);
    await h.settle(() => { resolveA({ data: [row('A')], error: null }); resolvePortfolioA(Response.json(portfolio('A'))); });
    assert.doesNotMatch(h.text(), /PRIVATE_A|CHILD_A|11,111/); assert.match(h.text(), /PRIVATE_B/); assert.equal(h.sdkInsideCallback, false);
  } finally { await h.close(); }
});

test('late initial identity after sign-out cannot mount the dashboard or query', async () => {
  let resolveA;
  const h = await fixture({ auth: () => new Promise(resolve => { resolveA = resolve; }) }); try {
    await h.emit('SIGNED_OUT', null); await h.settle(() => resolveA({ data: { user: { id: 'A' } }, error: null }));
    assert.equal(h.reads, 0); assert.equal(h.mounted, 0); assert.match(h.text(), /Sign in to view/);
  } finally { await h.close(); }
});

test('same-owner refresh and INITIAL_SESSION remain usable, unmount unsubscribes', async () => {
  const h = await fixture();
  await h.emit('INITIAL_SESSION', { id: 'A' }); assert.match(h.text(), /PRIVATE_A/);
  await h.emit('TOKEN_REFRESHED', { id: 'A' }); assert.match(h.text(), /CHILD_A/); assert.equal(h.sdkInsideCallback, false);
  await h.close(); assert.equal(h.unsubscribed, 1); assert.equal(h.mounted, h.unmounted);
});

test('initial signed-out and failed identity never mount account data', async () => {
  for (const options of [{ initialUser: null }, { auth: () => ({ data: { user: null }, error: new Error('private identity failure') }) }]) {
    const h = await fixture(options); try { assert.equal(h.reads, 0); assert.equal(h.mounted, 0); assert.doesNotMatch(h.text(), /private identity failure|PRIVATE_A|CHILD_A/); } finally { await h.close(); }
  }
});

test('identity deadline rejects late success and mismatched verified owner fails closed', async () => {
  let resolve;
  const h = await fixture({ auth: () => new Promise(r => { resolve = r; }) }); try {
    await h.expire(); await h.settle(() => resolve({ data: { user: { id: 'A' } }, error: null }));
    assert.equal(h.mounted, 0); assert.match(h.text(), /verification unavailable/);
  } finally { await h.close(); }
  const mismatch = await fixture({ auth: () => ({ data: { user: { id: 'A' } }, error: null }) }); try {
    await mismatch.emit('SIGNED_IN', { id: 'B' }); assert.doesNotMatch(mismatch.text(), /PRIVATE_A|CHILD_A/); assert.match(mismatch.text(), /verification unavailable/);
  } finally { await mismatch.close(); }
});

test('A to B to A invalidates the first A identity generation', async () => {
  let resolveFirstA;
  const h = await fixture({ auth: (user, count) => count === 1 ? new Promise(resolve => { resolveFirstA = resolve; }) : { data: { user }, error: null } }); try {
    await h.emit('SIGNED_IN', { id: 'B' }); assert.match(h.text(), /PRIVATE_B/);
    await h.emit('SIGNED_IN', { id: 'A' }); assert.match(h.text(), /PRIVATE_A/); const reads = h.reads;
    await h.settle(() => resolveFirstA({ data: { user: { id: 'A' } }, error: null }));
    assert.equal(h.reads, reads); assert.doesNotMatch(h.text(), /PRIVATE_B|CHILD_B/);
  } finally { await h.close(); }
});

test('unmount before identity resolves discards late identity and late auth events', async () => {
  let resolve;
  const h = await fixture({ auth: () => new Promise(r => { resolve = r; }) });
  await h.close(); await h.settle(() => resolve({ data: { user: { id: 'A' } }, error: null }));
  await h.emit('SIGNED_IN', { id: 'B' }); assert.equal(h.reads, 0); assert.equal(h.mounted, 0); assert.equal(h.unsubscribed, 1);
});
