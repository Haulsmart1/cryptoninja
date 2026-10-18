const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

const compiled = ts.transpileModule(readFileSync(`${__dirname}/../app/api/portfolio/route.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const portfolio = { cash: 9000, invested: 1000, market_value: 1100, portfolio_value: 10100, unrealized_pnl: 100, total_pnl: 100, return_percent: 1, btc_price: 60000, open_positions: [], open_position_count: 0 };

// Execute the actual route with synthetic responses; never call an external engine.
function harness({ configured = true, upstream = () => Response.json(portfolio), timeout } = {}) {
  const calls = [], logs = [], exports = {};
  new Function('require', 'exports', 'process', 'fetch', 'console', 'AbortSignal', compiled)(
    name => { assert.equal(name, 'next/server'); return { NextResponse: { json: Response.json } }; },
    exports, { env: configured ? { TRADING_ENGINE_URL: 'https://engine.example///' } : {} },
    async (...args) => { calls.push(args); return upstream(...args); },
    { error: (...args) => logs.push(args) },
    { timeout: timeout || (() => new AbortController().signal) },
  );
  return { calls, logs, get: (authorization = 'Bearer synthetic-token') => exports.GET(new Request('https://app.example/api/portfolio', { headers: authorization ? { authorization } : {} })) };
}

test('authentication and configuration failures remain private and never reach upstream', async () => {
  for (const configured of [false, true]) {
    const h = harness({ configured });
    const response = await h.get(null);
    assert.equal(response.status, 401);
    assert.match(response.headers.get('cache-control'), /private.*no-store/);
    assert.equal(h.calls.length, 0);
  }
  const h = harness({ configured: false });
  assert.equal((await h.get()).status, 503);
  assert.equal(h.calls.length, 0);
});

test('valid portfolio retains genuine zero and authenticated response contract', async () => {
  const body = { ...portfolio, cash: 0, invested: 0, portfolio_value: 0, total_pnl: 0, return_percent: 0 };
  const h = harness({ upstream: () => Response.json(body) });
  const response = await h.get();
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), body);
  assert.match(response.headers.get('cache-control'), /private.*no-store/);
  assert.equal(h.calls[0][0], 'https://engine.example/portfolio');
  assert.equal(h.calls[0][1].headers.Authorization, 'Bearer synthetic-token');
  assert.equal(h.calls[0][1].cache, 'no-store');
});

test('malformed successful portfolio replies never become HTTP success', async () => {
  for (const body of ['<html>Synthetic private maintenance diagnostic</html>', '', 'null', '[]', 'true', '{}', '{"error":"Synthetic diagnostic"}', JSON.stringify({ ...portfolio, cash: null }), JSON.stringify({ ...portfolio, portfolio_value: '10100' })]) {
    const h = harness({ upstream: () => new Response(body) });
    const response = await h.get();
    assert.equal(response.status, 502, `Unexpected success for ${body}`);
    assert.doesNotMatch(await response.text(), /Synthetic private|Synthetic diagnostic/);
    assert.match(response.headers.get('cache-control'), /private.*no-store/);
  }
});

test('upstream errors preserve denial/service status without reflecting diagnostics', async () => {
  for (const status of [401, 403, 429, 500, 503]) {
    const h = harness({ upstream: () => Response.json({ error: 'Synthetic confidential engine diagnostic' }, { status }) });
    const response = await h.get();
    assert.equal(response.status, status);
    assert.doesNotMatch(await response.text(), /confidential/);
    assert.equal(h.logs.length, 0);
  }
});

test('connection failures expose no engine address or caught diagnostics', async () => {
  const h = harness({ upstream: () => { throw new Error('Synthetic secret engine diagnostic'); } });
  const response = await h.get();
  assert.equal(response.status, 503);
  assert.doesNotMatch(await response.text(), /secret|engine\.example/);
  assert.doesNotMatch(JSON.stringify(h.logs), /secret|engine\.example/);
});

test('the upstream connection is bounded by a deadline', async () => {
  const controller = new AbortController();
  const h = harness({ timeout: ms => { assert.equal(ms, 10000); return controller.signal; }, upstream: async (_url, options) => {
    if (!options.signal) return Response.json(portfolio);
    queueMicrotask(() => controller.abort());
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Synthetic timeout')), { once: true }));
  } });
  assert.equal((await h.get()).status, 503);
  assert.equal(h.calls[0][1].signal, controller.signal);
  assert.equal(controller.signal.aborted, true);
});

test('the same deadline bounds consumption of a stalled upstream body', async () => {
  const controller = new AbortController();
  const h = harness({ timeout: ms => { assert.equal(ms, 10000); return controller.signal; }, upstream: async (_url, options) => ({ ok: true, status: 200, text: async () => {
    if (!options.signal) return JSON.stringify(portfolio);
    queueMicrotask(() => controller.abort());
    return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Synthetic body timeout')), { once: true }));
  } }) });
  assert.equal((await h.get()).status, 503);
  assert.equal(h.calls[0][1].signal, controller.signal);
  assert.equal(controller.signal.aborted, true);
});
