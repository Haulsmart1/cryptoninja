const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { AuthSessionMissingError } = require('@supabase/supabase-js');
const { JSDOM } = require('jsdom');
const tick = () => new Promise(resolve => setTimeout(resolve, 20));
const row = id => ({ id, symbol: `PRIVATE_${id}`, side: 'buy', quantity: '1', price: '1', value_gbp: '1', cash_gbp: '2', status: 'paper', created_at: '2026-10-18T00:00:00Z' });

// Real React DOM, actual page source, synthetic Auth and database replies only.
async function fixture(options = {}) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'https://crypto.example.invalid/trades' });
  global.window = dom.window; global.document = dom.window.document;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = require('react-dom/client');
  const { act } = React;
  let user = { id: 'A' }, inCallback = false, sdkInsideCallback = false, authCalls = 0, readCalls = 0, unsubscribed = 0, nextTimer = 0;
  const listeners = new Set(), timers = new Map(), allCallbacks = [];
  const client = { auth: {
    async getUser() { authCalls++; sdkInsideCallback ||= inCallback; if (options.auth) return options.auth(user, authCalls); return { data: { user }, error: user ? null : new AuthSessionMissingError() }; },
    onAuthStateChange(fn) { listeners.add(fn); allCallbacks.push(fn); return { data: { subscription: { unsubscribe() { listeners.delete(fn); unsubscribed++; } } } }; },
  }, from() {
    readCalls++; const owner = user?.id; sdkInsideCallback ||= inCallback;
    const query = { select() { return this; }, order() { return this; }, abortSignal() { return this; },
      then(resolve, reject) { return Promise.resolve(options.read ? options.read(owner, readCalls) : { data: [row(owner)], error: null }).then(resolve, reject); },
    }; return query;
  } };
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/../app/trades/page.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  new Function('require', 'exports', 'setTimeout', 'clearTimeout', compiled)(name => {
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    if (name === '@supabase/supabase-js') return require(name);
    if (name === 'next/link') return { default: ({ children }) => React.createElement('span', null, children) };
    if (name.endsWith('supabase-browser')) return { createClient: () => client };
    throw new Error(`Unexpected import ${name}`);
  }, exports, (fn, ms) => { assert.equal(ms, 10000); timers.set(++nextTimer, fn); return nextTimer; }, id => timers.delete(id));
  const root = createRoot(document.getElementById('root'));
  await act(async () => { root.render(React.createElement(exports.default)); await tick(); });
  return {
    text: () => document.body.textContent,
    get reads() { return readCalls; }, get authCalls() { return authCalls; }, get unsubscribed() { return unsubscribed; }, get sdkInsideCallback() { return sdkInsideCallback; },
    async emit(event, nextUser) { await act(async () => { user = nextUser; inCallback = true; for (const fn of [...listeners]) fn(event, user ? { user } : null); inCallback = false; await tick(); }); },
    async settle(callback) { await act(async () => { callback?.(); await tick(); }); },
    async expire() { await act(async () => { for (const fn of [...timers.values()]) fn(); await tick(); }); },
    async unmount() { await act(async () => root.unmount()); },
    async lateEvents() { for (const fn of allCallbacks) fn('SIGNED_IN', { user: { id: 'B' } }); await tick(); },
    async close() { await act(async () => root.unmount()); dom.window.close(); delete global.window; delete global.document; delete global.IS_REACT_ACT_ENVIRONMENT; },
  };
}

test('SIGNED_OUT clears cached A records, verifies outside callback, and never queries logged-out history', async () => {
  const h = await fixture(); try {
    assert.match(h.text(), /PRIVATE_A/); const reads = h.reads;
    await h.emit('SIGNED_OUT', null); assert.doesNotMatch(h.text(), /PRIVATE_A/);
    assert.match(h.text(), /Sign in to view/); assert.equal(h.reads, reads); assert.equal(h.sdkInsideCallback, false);
  } finally { await h.close(); }
});

test('a different owner reads B history while delayed A results cannot return', async () => {
  let resolveA;
  const h = await fixture({ read: owner => owner === 'A' ? new Promise(resolve => { resolveA = resolve; }) : { data: [row('B')], error: null } }); try {
    await h.emit('SIGNED_IN', { id: 'B' }); assert.match(h.text(), /PRIVATE_B/);
    await h.settle(() => resolveA({ data: [row('A')], error: null })); assert.doesNotMatch(h.text(), /PRIVATE_A/);
    assert.match(h.text(), /PRIVATE_B/); assert.equal(h.sdkInsideCallback, false);
  } finally { await h.close(); }
});

test('late initial identity cannot revive A or start a query after a later sign-out', async () => {
  let resolveA;
  const h = await fixture({ auth: (_user, call) => call === 1 ? new Promise(resolve => { resolveA = resolve; }) : { data: { user: null }, error: null } }); try {
    await h.emit('SIGNED_OUT', null); await h.settle(() => resolveA({ data: { user: { id: 'A' } }, error: null }));
    assert.doesNotMatch(h.text(), /PRIVATE_A/); assert.equal(h.reads, 0); assert.match(h.text(), /Sign in to view/);
  } finally { await h.close(); }
});

test('INITIAL_SESSION and a legitimate same-owner token refresh remain usable without SDK reentry', async () => {
  const h = await fixture(); try {
    await h.emit('INITIAL_SESSION', { id: 'A' }); assert.match(h.text(), /PRIVATE_A/);
    await h.emit('TOKEN_REFRESHED', { id: 'A' }); assert.match(h.text(), /PRIVATE_A/);
    assert.equal(h.sdkInsideCallback, false);
  } finally { await h.close(); }
});

test('unmount unsubscribes and ignores late auth callbacks and pending history', async () => {
  let resolveA;
  const h = await fixture({ read: () => new Promise(resolve => { resolveA = resolve; }) }); try {
    await h.unmount(); assert.equal(h.unsubscribed, 1); const authCalls = h.authCalls;
    await h.lateEvents(); await h.settle(() => resolveA({ data: [row('A')], error: null }));
    assert.equal(h.authCalls, authCalls); assert.doesNotMatch(h.text(), /PRIVATE_A/);
  } finally { await h.close(); }
});

test('hung identity lookup uses the existing deadline and late identity cannot start a database read', async () => {
  let resolveA;
  const h = await fixture({ auth: () => new Promise(resolve => { resolveA = resolve; }) }); try {
    await h.expire(); assert.match(h.text(), /Trade history unavailable/); assert.equal(h.reads, 0);
    await h.settle(() => resolveA({ data: { user: { id: 'A' } }, error: null }));
    assert.equal(h.reads, 0); assert.doesNotMatch(h.text(), /PRIVATE_A/);
  } finally { await h.close(); }
});

test('non-session auth errors remain unavailable and never expose provider diagnostics or query data', async () => {
  const h = await fixture({ auth: () => ({ data: { user: null }, error: new Error('private identity outage') }) }); try {
    assert.match(h.text(), /Trade history unavailable/); assert.doesNotMatch(h.text(), /private identity outage|Sign in to view|PRIVATE_A/); assert.equal(h.reads, 0);
  } finally { await h.close(); }
});
