import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as flow from "./auth-flow.mjs";

const compiled = ts.transpileModule(readFileSync(new URL("../app/auth/confirm/route.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
function harness({ rejected = false } = {}) {
  const calls = [];
  const modules = {
    "next/server": { NextResponse: Response },
    "../../../lib/auth-flow.mjs": flow,
    "../callback/route": { GET: async request => {
      calls.push(new URL(request.url));
      return new Response(null, { status: 307, headers: rejected
        ? { location: "/login?auth_error=invalid_link" }
        : { location: "/dashboard", "set-cookie": "session=synthetic; HttpOnly; Secure" } });
    } },
  };
  const exports = {};
  new Function("require", "exports", compiled)(name => modules[name], exports);
  return { ...exports, calls };
}
const origin = "https://www.crypto-ninja.app";
function post(data, requestOrigin = origin) {
  return new Request(`${origin}/auth/confirm`, {
    method: "POST", headers: { origin: requestOrigin, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(data),
  });
}
test("GET and repeated scanner prefetches never redeem a token", async () => {
  const h = harness();
  for (let i = 0; i < 2; i++) {
    const response = await h.GET(new Request(`${origin}/auth/confirm?token_hash=synthetic&type=email`));
    assert.equal(response.status, 200);
    assert.match(await response.text(), /method="post"/);
    assert.match(response.headers.get("cache-control"), /no-store/);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer");
  }
  assert.deepEqual(h.calls, []);
});
test("human POST delegates verification and preserves resulting session cookies with GET redirect", async () => {
  const h = harness();
  const response = await h.POST(post({ token_hash: "synthetic", type: "recovery", next: "/reset-password" }));
  assert.equal(h.calls.length, 1);
  assert.equal(h.calls[0].searchParams.get("type"), "recovery");
  assert.equal(h.calls[0].searchParams.get("next"), "/reset-password");
  assert.equal(response.status, 303);
  assert.match(response.headers.get("set-cookie"), /session=synthetic/);
});
test("cross-origin or missing origin POST fails without token redemption", async () => {
  const h = harness();
  for (const value of ["https://attacker.example", "null", ""]) {
    assert.equal((await h.POST(post({ token_hash: "synthetic", type: "email" }, value))).status, 403);
  }
  assert.deepEqual(h.calls, []);
});
test("invalid types fail before verification; unsafe next stays local; HTML values are escaped", async () => {
  const h = harness();
  assert.equal((await h.POST(post({ token_hash: "synthetic", type: "invite" }))).status, 400);
  assert.deepEqual(h.calls, []);
  await h.POST(post({ token_hash: "synthetic", type: "email", next: "//attacker.example" }));
  assert.equal(h.calls[0].searchParams.get("next"), "/dashboard");
  const page = await h.GET(new Request(`${origin}/auth/confirm?token_hash=${encodeURIComponent('\"><script>alert(1)</script>')}&type=email`));
  assert.doesNotMatch(await page.text(), /<script>/);
});
test("failed verification returns login destination without session cookie", async () => {
  const h = harness({ rejected: true });
  const response = await h.POST(post({ token_hash: "synthetic", type: "email" }));
  assert.equal(response.headers.get("location"), "/login?auth_error=invalid_link");
  assert.equal(response.headers.get("set-cookie"), null);
});
