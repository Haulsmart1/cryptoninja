const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
const settle = () => new Promise(resolve => setImmediate(resolve));
const trade = { id: 'synthetic', symbol: 'TEST-GBP', side: 'buy', quantity: '1', price: '2', value_gbp: '2', cash_gbp: null, status: 'paper', created_at: '2026-10-18T00:00:00Z' };

// Execute the actual page with synthetic database replies; no services or trades.
function harness(reply, constructorError = false) {
  const states = [], effects = [], timers = new Map();
  let cursor = 0, cleanup, signal, writes = 0, timerId = 0;
  const compiled = ts.transpileModule(readFileSync(`${__dirname}/../app/trades/page.tsx`, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const exports = {};
  const query = { select() { return this; }, order() { return this; }, abortSignal(value) { signal = value; return this; },
    then(resolve, reject) { return Promise.resolve().then(() => typeof reply === 'function' ? reply() : reply).then(resolve, reject); } };
  new Function('require', 'exports', 'setTimeout', 'clearTimeout', compiled)(name => {
    if (name === 'react/jsx-runtime') return require(name);
    if (name === 'react') return { ...React,
      useState(initial) { const i = cursor++; if (!(i in states)) states[i] = initial; return [states[i], value => { writes++; states[i] = typeof value === 'function' ? value(states[i]) : value; }]; },
      useEffect(callback) { effects.push(callback); },
    };
    if (name.endsWith('supabase-browser')) return { createClient: () => { if (constructorError) throw new Error('private configuration'); return { from: () => query }; } };
    if (name === 'next/link') return { default: ({ children }) => React.createElement('span', null, children) };
    throw new Error(`Unexpected import ${name}`);
  }, exports, (fn, ms) => { assert.equal(ms, 10000); timers.set(++timerId, fn); return timerId; }, id => timers.delete(id));
  function render() { cursor = 0; return renderToStaticMarkup(exports.default()); }
  return { render, get writes() { return writes; }, get signal() { return signal; },
    async mount() { render(); cleanup = effects[0](); await settle(); },
    async expire() { for (const fn of [...timers.values()]) fn(); await settle(); },
    unmount() { if (cleanup) cleanup(); },
  };
}

test('history distinguishes loading, successful empty records and a database denial', async () => {
  const h = harness({ data: [], error: null });
  assert.match(h.render(), /Loading paper trade history/);
  await h.mount(); assert.match(h.render(), /No paper trades returned/);
  const denied = harness({ data: [trade], error: { message: 'sensitive internal detail' } });
  await denied.mount(); assert.match(denied.render(), /Trade history unavailable/);
  assert.doesNotMatch(denied.render(), /TEST-GBP|sensitive internal detail|No paper trades returned/);
});

test('unknown cash and invalid financial values are not fabricated as zero', async () => {
  const h = harness({ data: [trade, { ...trade, id: 'other', symbol: 'OTHER', price: '', value_gbp: 'bad' }], error: null });
  await h.mount(); const html = h.render();
  assert.match(html, /TEST-GBP/); assert.match(html, /Unavailable/);
  assert.doesNotMatch(html, /£0|£NaN/);
  const zero = harness({ data: [{ ...trade, cash_gbp: '0', value_gbp: '0', price: '0' }], error: null });
  await zero.mount(); assert.match(zero.render(), /£0/);
  const fractional = harness({ data: [{ ...trade, quantity: '0.00000001', price: '0.00001', value_gbp: '0.000001' }], error: null });
  await fractional.mount(); assert.match(fractional.render(), />0\.00000001</);
  assert.match(fractional.render(), /£0\.00001/);
});

test('rejected reads and missing client configuration settle without disclosing diagnostics', async () => {
  for (const h of [harness(() => { throw new Error('private database rejection'); }), harness(null, true)]) {
    await h.mount(); assert.match(h.render(), /Trade history unavailable/);
    assert.doesNotMatch(h.render(), /private|No paper trades returned/);
  }
});

test('malformed response or rows never crash or masquerade as an empty successful history', async () => {
  for (const data of [null, {}, [null], [{ ...trade, side: null }], [{ ...trade, created_at: 'invalid' }]]) {
    const h = harness({ data, error: null }); await h.mount();
    assert.match(h.render(), /Trade history unavailable/);
    assert.doesNotMatch(h.render(), /No paper trades returned|Invalid Date/);
  }
});

test('a hung read is bounded and late success cannot restore the history', async () => {
  let resolve;
  const h = harness(() => new Promise(r => { resolve = r; })); await h.mount();
  await h.expire(); assert.match(h.render(), /Trade history unavailable/);
  resolve({ data: [trade], error: null }); await settle();
  assert.doesNotMatch(h.render(), /TEST-GBP/);
  assert.equal(h.signal.aborted, true);
});

test('unmount aborts the read and ignores a late success', async () => {
  let resolve;
  const h = harness(() => new Promise(r => { resolve = r; })); await h.mount();
  h.unmount(); const writes = h.writes;
  resolve({ data: [trade], error: null }); await settle();
  assert.equal(h.writes, writes); assert.equal(h.signal.aborted, true);
});
