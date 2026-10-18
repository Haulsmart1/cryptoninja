const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const test = require('node:test');
const ts = require('typescript');

const compiled = ts.transpileModule(readFileSync(`${__dirname}/../app/api/autotrader/status/route.ts`, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

// Execute the actual handler; no network, accounts or trading controls are used.
function harness({ configured = true, upstream = () => Response.json({ enabled: false }), deadline } = {}) {
  const calls = [];
  const exports = {};
  new Function('require', 'exports', 'process', 'fetch', 'console', 'AbortSignal', compiled)(
    name => { assert.equal(name, 'next/server'); return { NextResponse: { json: Response.json } }; },
    exports,
    { env: configured ? { TRADING_ENGINE_URL: 'https://engine.example///' } : {} },
    async (...args) => { calls.push(args); return upstream(...args); },
    { error() {} },
    { timeout: deadline || (() => new AbortController().signal) },
  );
  return { calls, get: (authorization = 'Bearer synthetic-test-token') => exports.GET(new Request('https://app.example/api/autotrader/status', { headers: authorization ? { authorization } : {} })) };
}

test('missing auth or engine configuration never reaches the engine', async () => {
  const unauthenticated = harness();
  assert.equal((await unauthenticated.get(null)).status, 401);
  assert.equal(unauthenticated.calls.length, 0);
  const unconfigured = harness({ configured: false });
  assert.equal((await unconfigured.get(null)).status, 401);
  assert.equal((await unconfigured.get()).status, 503);
  assert.equal(unconfigured.calls.length, 0);
});

test('verified JSON status forwards the bearer and remains private and uncached', async () => {
  const h = harness();
  const result = await h.get();
  assert.equal(result.status, 200);
  assert.deepEqual(await result.json(), { enabled: false });
  assert.equal(h.calls[0][0], 'https://engine.example/autotrader/status');
  assert.equal(h.calls[0][1].headers.Authorization, 'Bearer synthetic-test-token');
  assert.equal(h.calls[0][1].cache, 'no-store');
  assert.match(result.headers.get('cache-control'), /no-store/);
});

test('malformed or unknown status replies never become HTTP success', async () => {
  for (const body of ['<html>upstream maintenance</html>', '', 'null', '[]', 'true', '{}', '{"error":"synthetic diagnostic"}', '{"enabled":"yes"}', '{"enabled":false,"emergency_stop":"false"}']) {
    const h = harness({ upstream: () => new Response(body) });
    const result = await h.get();
    assert.equal(result.status, 502, `Unexpected success for ${body}`);
    assert.equal((await result.json()).error, 'Trading engine returned an invalid response.');
  }
});

test('upstream HTTP errors retain status without echoing non-JSON diagnostics', async () => {
  const h = harness({ upstream: () => new Response('synthetic confidential diagnostic', { status: 503 }) });
  const result = await h.get();
  assert.equal(result.status, 503);
  assert.doesNotMatch(await result.text(), /confidential/);
  const denied = harness({ upstream: () => Response.json({ error: 'Unauthorized', diagnostic: 'synthetic confidential diagnostic' }, { status: 401 }) });
  const denial = await denied.get();
  assert.equal(denial.status, 401);
  assert.deepEqual(await denial.json(), { error: 'Trading engine returned an error.' });
});

test('a stalled engine connection is aborted at the configured deadline', async () => {
  const controller = new AbortController();
  const h = harness({
    deadline: ms => { assert.equal(ms, 10000); queueMicrotask(() => controller.abort()); return controller.signal; },
    upstream: async (_url, options) => {
      assert.ok(options.signal, 'The request needs a bounded deadline');
      if (options.signal.aborted) throw new Error('Synthetic timeout');
      await new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Synthetic timeout')), { once: true }));
    },
  });
  const result = await h.get();
  assert.equal(result.status, 503);
  assert.equal(h.calls[0][1].signal, controller.signal);
  assert.doesNotMatch(await result.text(), /Synthetic timeout/);
});

test('the deadline also bounds reading a stalled response body', async () => {
  const controller = new AbortController();
  const h = harness({
    deadline: ms => { assert.equal(ms, 10000); return controller.signal; },
    upstream: async (_url, options) => ({ status: 200, ok: true, text: async () => {
      assert.ok(options.signal, 'Body reads must share the request deadline');
      queueMicrotask(() => controller.abort());
      return new Promise((_resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Synthetic body timeout')), { once: true }));
    } }),
  });
  const result = await h.get();
  assert.equal(result.status, 503);
  assert.equal(controller.signal.aborted, true);
});
