const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const settle = () => new Promise(resolve => setImmediate(resolve));
const signal = { id: 'one', symbol: 'SYNTHETIC', action: 'BUY', confidence: 70, reason: null, executed: false, created_at: '2026-10-18T04:00:00Z' };

// Execute the actual component with synthetic query/channel callbacks only.
function harness(reply, constructorError = false) {
  const states = [], effects = [], timers = new Map();
  let cursor = 0, cleanup, insert, channelStatus, abort, removed = 0, writes = 0, timerId = 0;
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/../components/AISignalFeed.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const query = { select() { return this; }, order() { return this; }, limit() { return this; }, abortSignal(value) { abort = value; return this; },
    then(resolve, reject) { return Promise.resolve().then(() => typeof reply === 'function' ? reply() : reply).then(resolve, reject); } };
  const channel = { on(_event, _options, callback) { insert = callback; return this; }, subscribe(callback) { channelStatus = callback; return this; } };
  new Function('require', 'exports', 'setTimeout', 'clearTimeout', compiled)(name => {
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'react') return { ...React,
      useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { writes++; states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
      useEffect(callback) { effects.push(callback); }, useMemo(callback) { return callback(); },
    };
    if (name.endsWith('supabase-browser')) return { createClient: () => { if (constructorError) throw new Error('private configuration'); return { from: () => query, channel: () => channel, removeChannel() { removed++; return Promise.resolve('ok'); } }; } };
    throw new Error(`Unexpected import ${name}`);
  }, exports, (fn, ms) => { assert.equal(ms, 10000); timers.set(++timerId, fn); return timerId; }, id => timers.delete(id));
  function render() { cursor = 0; return renderToStaticMarkup(exports.default()); }
  return { render, get writes() { return writes; }, get aborted() { return abort?.aborted; }, get removed() { return removed; },
    async mount() { render(); cleanup = effects[0](); await settle(); },
    async insert(value) { insert({ new: value }); await settle(); },
    async status(value) { channelStatus?.(value); await settle(); },
    async expire() { for (const fn of [...timers.values()]) fn(); await settle(); },
    unmount() { cleanup?.(); },
  };
}

test('journal distinguishes pending, confirmed empty and failed reads without unconditional LIVE', async () => {
  const ok = harness({ data: [], error: null });
  assert.match(ok.render(), /Loading recent signals/); assert.doesNotMatch(ok.render(), /LIVE/);
  await ok.mount(); assert.match(ok.render(), /No recent signals returned/);
  const failed = harness({ data: [signal], error: { message: 'private diagnostic' } });
  await failed.mount(); assert.match(failed.render(), /Recent history unavailable/);
  assert.doesNotMatch(failed.render(), /private diagnostic|SYNTHETIC|No recent signals returned|LIVE/);
});

test('initial snapshot merges newer inserts and duplicate IDs rather than overwriting or double-counting', async () => {
  let resolve;
  const h = harness(() => new Promise(r => { resolve = r; })); await h.mount();
  await h.insert({ ...signal, id: 'new', symbol: 'NEWER', created_at: '2026-10-18T04:02:00Z' });
  await h.insert({ ...signal, id: 'new', symbol: 'NEWER', created_at: '2026-10-18T04:02:00Z' });
  resolve({ data: [signal], error: null }); await settle();
  const html = h.render(); assert.match(html, /NEWER/); assert.match(html, /SYNTHETIC/);
  assert.equal((html.match(/>NEWER</g) ?? []).length, 1); assert.ok(html.indexOf('NEWER') < html.indexOf('SYNTHETIC'));
});

test('subscription status never claims connection before observed subscribe or after failure', async () => {
  const h = harness({ data: [signal], error: null }); await h.mount();
  assert.doesNotMatch(h.render(), /Updates connected|LIVE/);
  await h.status('SUBSCRIBED'); assert.match(h.render(), /Updates connected/);
  for (const status of ['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED']) {
    await h.status(status); assert.match(h.render(), /Updates unavailable/);
    assert.doesNotMatch(h.render(), /Updates connected|LIVE/); assert.match(h.render(), /SYNTHETIC/);
  }
});

test('a false execution flag is not an invented block and unknown confidence is not zero', async () => {
  const h = harness({ data: [{ ...signal, confidence: null }, { ...signal, id: 'executed', symbol: 'PAPER', executed: true }, { ...signal, id: 'unknown', executed: null }], error: null });
  await h.mount(); const html = h.render();
  assert.match(html, /Not recorded as executed/); assert.match(html, /Recorded paper execution/);
  assert.match(html, /Execution unavailable/); assert.match(html, /Confidence[\s\S]*Unavailable/);
  assert.doesNotMatch(html, /Blocked|null%|>0%</);
});

test('hung read times out and ignores late success; unmount also removes channel and ignores callbacks', async () => {
  let resolve;
  const h = harness(() => new Promise(r => { resolve = r; })); await h.mount(); await h.expire();
  assert.match(h.render(), /Recent history unavailable/); assert.equal(h.aborted, true);
  resolve({ data: [signal], error: null }); await settle(); assert.doesNotMatch(h.render(), /SYNTHETIC/);
  h.unmount(); const writes = h.writes;
  await h.insert(signal); await h.status('SUBSCRIBED'); assert.equal(h.writes, writes); assert.equal(h.removed, 1);
});

test('malformed rows and missing configuration settle to redacted unavailability', async () => {
  for (const h of [harness({ data: [null], error: null }), harness({ data: [{ ...signal, created_at: 'bad' }], error: null }), harness(null, true)]) {
    await h.mount(); assert.match(h.render(), /Recent history unavailable/);
    assert.doesNotMatch(h.render(), /private configuration|Invalid Date|LIVE/);
  }
});
