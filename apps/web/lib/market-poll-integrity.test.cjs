const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const settle = () => new Promise(resolve => setImmediate(resolve));
const good = [{ 'BTC-GBP': 60000, 'ETH-GBP': 2000, 'SOL-GBP': 100 }, { portfolio_value: 10500 }, { status: 'healthy', paper_trading: true }];

function harness(replies) {
  const states = [], refs = [], effects = [], calls = [], timers = new Map();
  let cursor = 0, refCursor = 0, nextTimer = 0, poll, cleanup;
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/../components/MarketIntelligence.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const fetchMock = async (url, options) => {
    calls.push({ url, options }); const reply = replies.shift();
    if (reply instanceof Error) throw reply;
    return typeof reply === 'function' ? reply(options) : reply;
  };
  new Function('require', 'exports', 'fetch', 'setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', compiled)(name => {
    if (name === 'react/jsx-runtime') return require(name);
    if (name.endsWith('auth-fetch')) return { authFetch: fetchMock };
    if (name === 'react') return { ...React,
      useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { states[i] = value; }]; },
      useRef(initial) { const i = refCursor++; return refs[i] ?? (refs[i] = { current: initial }); },
      useEffect(callback) { effects.push(callback); },
    };
    throw new Error(`Unexpected import ${name}`);
  }, exports, fetchMock, (callback, ms) => { poll = callback; return 1; }, () => {},
  (callback, ms) => { assert.equal(ms, 10000); const id = ++nextTimer; timers.set(id, callback); return id; }, id => timers.delete(id));
  function render() { cursor = 0; refCursor = 0; return renderToStaticMarkup(exports.default()); }
  return { render, calls,
    async mount() { render(); cleanup = effects[0](); await settle(); },
    async poll() { await poll(); await settle(); },
    unmount() { cleanup(); },
    async expire() { for (const callback of [...timers.values()]) callback(); await settle(); },
  };
}
const success = () => good.map(data => Response.json(data));
const unavailable = () => Array.from({ length: 3 }, () => new Response('', { status: 503 }));

test('an older successful market poll cannot restore ONLINE and balances after a newer failure', async () => {
  const held = [];
  const h = harness([...Array.from({ length: 3 }, () => () => new Promise(resolve => held.push(resolve))), ...unavailable()]);
  await h.mount(); await h.poll(); assert.doesNotMatch(h.render(), /ONLINE|60,000|10,500/);
  held.forEach((resolve, i) => resolve(Response.json(good[i]))); await settle();
  assert.doesNotMatch(h.render(), /ONLINE|60,000|10,500/);
});

test('a failure clears old values while a later valid poll recovers them', async () => {
  const h = harness([...success(), ...unavailable(), ...success()]); await h.mount();
  assert.match(h.render(), /ONLINE/); assert.match(h.render(), /60,000/);
  await h.poll(); assert.doesNotMatch(h.render(), /ONLINE|60,000|10,500/);
  await h.poll(); assert.match(h.render(), /ONLINE/); assert.match(h.render(), /10,500/);
});

test('unmounted market polls cannot update displayed observations', async () => {
  const held = [];
  const h = harness(Array.from({ length: 3 }, () => () => new Promise(resolve => held.push(resolve))));
  await h.mount(); h.unmount(); held.forEach((resolve, i) => resolve(Response.json(good[i]))); await settle();
  assert.doesNotMatch(h.render(), /ONLINE|60,000|10,500/);
});

for (const stage of ['connection', 'body', 'auth']) {
  test(`a stalled ${stage} read is bounded and cannot retain previous observations`, async () => {
    const stall = () => new Promise(() => {});
    const stalled = stage === 'body' ? { ok: true, json: stall } : stall;
    const second = stage === 'auth' ? [Response.json(good[0]), stalled, Response.json(good[2])] : [stalled, stalled, stalled];
    const h = harness([...success(), ...second]); await h.mount();
    const pendingPoll = h.poll(); await settle(); await h.expire();
    await Promise.race([pendingPoll, new Promise((_resolve, reject) => setTimeout(() => reject(new Error('Mock poll never settled')), 100))]);
    assert.doesNotMatch(h.render(), stage === 'auth' ? /10,500/ : /ONLINE|60,000|10,500/);
    assert.ok(h.calls.slice(3).every(call => call.options.signal), 'Every independent read carries cancellation');
  });
}

test('one failed provider does not discard independent confirmed market data', async () => {
  const h = harness([Response.json(good[0]), new Response('', { status: 503 }), Response.json(good[2])]);
  await h.mount(); assert.match(h.render(), /60,000/); assert.match(h.render(), /ONLINE/); assert.doesNotMatch(h.render(), /10,500/);
});

test('null and malformed payloads cannot crash or invent prices; genuine zero portfolio is preserved', async () => {
  for (const value of [null, []]) {
    const h = harness([Response.json(value), Response.json(value), Response.json(value)]); await h.mount();
    assert.doesNotThrow(h.render); assert.doesNotMatch(h.render(), /ONLINE|£0/);
  }
  const nonfinite = harness([{ ok: true, json: async () => ({ 'BTC-GBP': Infinity, 'ETH-GBP': NaN }) }, { ok: true, json: async () => ({ portfolio_value: Infinity }) }, Response.json({})]);
  await nonfinite.mount(); assert.doesNotMatch(nonfinite.render(), /Infinity|NaN|ONLINE/);
  const invalid = harness([Response.json({ 'BTC-GBP': -2, 'ETH-GBP': '2000', 'SOL-GBP': 0 }), Response.json({ portfolio_value: '10500' }), Response.json({ status: 'healthy', paper_trading: false })]);
  await invalid.mount(); assert.doesNotMatch(invalid.render(), /ONLINE|£-2|£0|10,500/);
  const zero = harness([Response.json(good[0]), Response.json({ portfolio_value: 0 }), Response.json(good[2])]);
  await zero.mount(); assert.match(zero.render(), /£0/); assert.match(zero.render(), /60,000/);
});
