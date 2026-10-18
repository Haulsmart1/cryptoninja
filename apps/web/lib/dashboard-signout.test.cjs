const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { JSDOM } = require('jsdom');
const tick = () => new Promise(resolve => setTimeout(resolve, 15));

// Actual exported dashboard, entirely synthetic Auth/data; no engine requests.
async function fixture(options = {}) {
  const dom = new JSDOM('<div id="root"></div>');
  global.window = dom.window; global.document = dom.window.document; global.IS_REACT_ACT_ENVIRONMENT = true;
  const { createRoot } = require('react-dom/client');
  let owner = 'A', callback, calls = 0, sessionReads = 0, identityReads = 0, insideCallback = false, reentered = false;
  const navigations = [], timers = new Map(); let timerId = 0;
  const emit = (event, next) => { owner = next; insideCallback = true; callback(event, next ? { user: { id: next } } : null); insideCallback = false; };
  const auth = {
    async getUser() { reentered ||= insideCallback; identityReads++; return options.identity ? options.identity(owner, identityReads) : { data: { user: owner ? { id: owner } : null }, error: null }; },
    onAuthStateChange(fn) { callback = fn; return { data: { subscription: { unsubscribe() {} } } }; },
    async signOut(scope) { calls++; reentered ||= insideCallback; assert.deepEqual(scope, { scope: 'local' }); if (options.signOut) return options.signOut(emit); emit('SIGNED_OUT', null); return { error: null }; },
    async getSession() { sessionReads++; reentered ||= insideCallback; return options.session ? options.session() : { data: { session: owner ? { user: { id: owner } } : null }, error: null }; },
  };
  const client = { auth, from() { return { select() { return this; }, order() { return this; }, limit() { return Promise.resolve({ data: [], error: null }); } }; } };
  const source = readFileSync(`${__dirname}/../app/dashboard/page.tsx`, 'utf8');
  const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const exports = {};
  new Function('require', 'exports', 'fetch', 'window', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', compiled)(name => {
    if (name === 'react' || name === 'react/jsx-runtime') return require(name);
    if (name.endsWith('supabase-browser')) return { createClient: () => client };
    if (name.endsWith('auth-fetch')) return { authFetch: async (_url, init) => { assert.notEqual(init?.method, 'POST'); return Response.json({}); } };
    if (name === 'next/link') return { default: ({ children }) => React.createElement('span', null, children) };
    if (name.includes('/components/')) return { default: () => React.createElement('span', null, 'ACCOUNT_CONTENT') };
    throw new Error(`Unexpected import ${name}`);
  }, exports, async () => Response.json({}), { location: { assign: path => navigations.push(path) } },
  (fn, ms) => { assert.equal(ms, 10000); timers.set(++timerId, fn); return timerId; }, id => timers.delete(id), () => 1, () => {});
  const root = createRoot(document.getElementById('root'));
  await React.act(async () => { root.render(React.createElement(exports.default)); await tick(); });
  await React.act(async () => { await tick(); });
  return {
    text: () => document.body.textContent, navigations,
    get calls() { return calls; }, get sessionReads() { return sessionReads; }, get reentered() { return reentered; },
    async click(count = 1) { await React.act(async () => { const button = [...document.querySelectorAll('button')].find(node => /Sign out of this browser|Signing out|Sign-out unavailable/.test(node.textContent)); assert.ok(button, 'Explicit current-browser sign-out control exists'); for (let i = 0; i < count; i++) button.click(); await tick(); }); },
    async emit(event, next) { await React.act(async () => { emit(event, next); await tick(); }); },
    async settle(fn) { await React.act(async () => { fn?.(); await tick(); }); },
    async expire() { await React.act(async () => { for (const fn of [...timers.values()]) fn(); await tick(); }); },
    async close() { await React.act(async () => root.unmount()); dom.window.close(); delete global.window; delete global.document; delete global.IS_REACT_ACT_ENVIRONMENT; },
  };
}

test('current-browser sign-out verifies cleared session, removes account view, then navigates', async () => {
  const h = await fixture(); try { await h.click(); assert.equal(h.calls, 1); assert.equal(h.sessionReads, 1); assert.deepEqual(h.navigations, ['/login']); assert.doesNotMatch(h.text(), /ACCOUNT_CONTENT/); assert.equal(h.reentered, false); } finally { await h.close(); }
});

test('duplicate clicks while pending create exactly one sign-out mutation', async () => {
  let resolve;
  const h = await fixture({ signOut: emit => new Promise(done => { resolve = () => { emit('SIGNED_OUT', null); done({ error: null }); }; }) });
  try { await h.click(2); assert.equal(h.calls, 1); assert.deepEqual(h.navigations, []); await h.settle(resolve); assert.deepEqual(h.navigations, ['/login']); } finally { await h.close(); }
});

test('explicit failure and missing session-clear acknowledgement never claim success or navigate', async () => {
  for (const signOut of [() => ({ error: new Error('private upstream detail') }), () => ({ error: null })]) {
    const h = await fixture({ signOut }); try { await h.click(); assert.deepEqual(h.navigations, []); assert.match(h.text(), /could not be confirmed/); assert.doesNotMatch(h.text(), /private upstream detail/); assert.match(h.text(), /ACCOUNT_CONTENT/); } finally { await h.close(); }
  }
});

test('unknown pending result expires without retry and late completion cannot navigate', async () => {
  let resolve;
  const h = await fixture({ signOut: () => new Promise(done => { resolve = done; }) });
  try { await h.click(); await h.expire(); assert.match(h.text(), /could not be confirmed/); await h.settle(() => resolve({ error: null })); assert.deepEqual(h.navigations, []); assert.equal(h.calls, 1); assert.equal(h.sessionReads, 0); } finally { await h.close(); }
});

test('owner switch invalidates pending old-owner completion, including A to B to A', async () => {
  for (const aba of [false, true]) {
    let resolve;
    const h = await fixture({ signOut: () => new Promise(done => { resolve = done; }) });
    try { await h.click(); await h.emit('SIGNED_IN', 'B'); if (aba) await h.emit('SIGNED_IN', 'A'); await h.settle(() => resolve({ error: null })); assert.deepEqual(h.navigations, []); assert.equal(h.sessionReads, 0); assert.match(h.text(), /ACCOUNT_CONTENT/); } finally { await h.close(); }
  }
});

test('unmount invalidates an outstanding logout result', async () => {
  let resolve;
  const h = await fixture({ signOut: () => new Promise(done => { resolve = done; }) });
  await h.click(); await h.close(); resolve({ error: null }); await tick(); assert.deepEqual(h.navigations, []); assert.equal(h.sessionReads, 0);
});

test('same-owner refresh and a new owner never unlock a still-pending SDK mutation', async () => {
  for (const next of ['A', 'B']) {
    let resolve;
    const h = await fixture({ signOut: () => new Promise(done => { resolve = done; }) });
    try {
      await h.click(); await h.emit(next === 'A' ? 'TOKEN_REFRESHED' : 'SIGNED_IN', next);
      await h.click(); assert.equal(h.calls, 1); assert.match(h.text(), /session changed during sign-out/);
      await h.settle(() => resolve({ error: null })); await h.click();
      assert.equal(h.calls, 1); assert.deepEqual(h.navigations, []); assert.equal(h.sessionReads, 0);
    } finally { await h.close(); }
  }
});

test('a mismatched verified owner prevents any logout mutation', async () => {
  const h = await fixture({ identity: (_owner, call) => ({ data: { user: { id: call === 1 ? 'A' : 'B' } }, error: null }) });
  try { await h.click(); assert.equal(h.calls, 0); assert.equal(h.sessionReads, 0); assert.deepEqual(h.navigations, []); assert.match(h.text(), /could not be confirmed/); } finally { await h.close(); }
});

test('session verification failure or a hung verification never navigates after SDK acknowledgement', async () => {
  for (const session of [() => ({ data: { session: null }, error: new Error('private storage failure') }), () => new Promise(() => {})]) {
    const h = await fixture({ session });
    try { await h.click(); await h.expire(); assert.equal(h.calls, 1); assert.deepEqual(h.navigations, []); assert.match(h.text(), /could not be confirmed/); assert.doesNotMatch(h.text(), /private storage failure/); } finally { await h.close(); }
  }
});

test('a sign-out event while SDK mutation is pending never offers overlapping sign-in navigation', async () => {
  let resolve;
  const h = await fixture({ signOut: emit => { emit('SIGNED_OUT', null); return new Promise(done => { resolve = done; }); } });
  try {
    await h.click(); assert.match(h.text(), /pending or unconfirmed/); assert.doesNotMatch(h.text(), /Sign in/);
    await h.expire(); assert.doesNotMatch(h.text(), /Sign in/); assert.deepEqual(h.navigations, []);
    await h.settle(() => resolve({ error: null })); assert.deepEqual(h.navigations, []);
  } finally { await h.close(); }
});
