import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import ts from "typescript";
import * as flow from "./auth-flow.mjs";
import * as verification from "./email-verification.mjs";

// Execute the actual route with only framework/network boundaries replaced.
// No hosted auth calls, email, accounts or trading actions occur in this suite.
const source = readFileSync(new URL("../app/auth/callback/route.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;

function routeHarness({ error = null, configured = true } = {}) {
  const calls = [];
  const cookies = [];
  const auth = {
    verifyOtp: async value => { calls.push(["otp", value]); return { error }; },
    exchangeCodeForSession: async value => { calls.push(["code", value]); return { error }; },
  };
  const modules = {
    "@supabase/ssr": { createServerClient: (url, key, options) => {
      calls.push(["client", url, key]);
      const wrap = method => async value => {
        const result = await auth[method](value);
        if (!result.error) options.cookies.setAll([{ name: "session", value: "test-session", options: { httpOnly: true } }]);
        return result;
      };
      return { auth: { verifyOtp: wrap("verifyOtp"), exchangeCodeForSession: wrap("exchangeCodeForSession") } };
    } },
    "next/headers": { cookies: async () => ({ getAll: () => [], set: (...args) => cookies.push(args) }) },
    "next/server": { NextResponse: { redirect: url => ({ location: url.toString() }) } },
    "../../../lib/auth-flow.mjs": flow,
    "../../../lib/email-verification.mjs": verification,
  };
  const exports = {};
  new Function("require", "exports", "process", "console", compiled)(
    name => { assert.ok(modules[name], `Unexpected import ${name}`); return modules[name]; },
    exports,
    { env: configured ? { NEXT_PUBLIC_SUPABASE_URL: "https://test.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "test-public-key" } : {} },
    { error: () => {} },
  );
  return { get: url => exports.GET(new Request(url)), calls, cookies };
}

test("actual callback writes verified session cookies and redirects locally", async () => {
  const h = routeHarness();
  const response = await h.get("https://www.crypto-ninja.app/auth/confirm?token_hash=test-hash&type=email&next=%2Fdashboard");
  assert.equal(response.location, "https://www.crypto-ninja.app/dashboard");
  assert.deepEqual(h.calls[1], ["otp", { token_hash: "test-hash", type: "email" }]);
  assert.equal(h.cookies[0][0], "session");
  assert.equal(h.cookies[0][2].httpOnly, true);
});

test("rejected token hash never redirects to dashboard or writes a session", async () => {
  const h = routeHarness({ error: { name: "AuthApiError" } });
  assert.equal((await h.get("https://www.crypto-ninja.app/auth/confirm?token_hash=expired&type=email")).location, "https://www.crypto-ninja.app/login?auth_error=invalid_link");
  assert.deepEqual(h.cookies, []);
});

test("unsupported token types fail closed without an auth request", async () => {
  for (const type of ["invite", "signup", "magiclink", "", "email_change"]) {
    const h = routeHarness();
    const response = await h.get(`https://www.crypto-ninja.app/auth/confirm?token_hash=test&type=${type}`);
    assert.match(response.location, /auth_error=invalid_link$/);
    assert.equal(h.calls.length, 1);
    assert.deepEqual(h.cookies, []);
  }
});

test("missing token and missing configuration never contact auth", async () => {
  const missing = routeHarness();
  assert.match((await missing.get("https://www.crypto-ninja.app/auth/confirm")).location, /auth_error=missing_code$/);
  assert.deepEqual(missing.calls, []);
  const unconfigured = routeHarness({ configured: false });
  assert.match((await unconfigured.get("https://www.crypto-ninja.app/auth/confirm?token_hash=test&type=email")).location, /auth_error=missing_configuration$/);
  assert.deepEqual(unconfigured.calls, []);
});

test("actual callback blocks external and browser-normalized next destinations", async () => {
  for (const next of ["https://attacker.example", "//attacker.example", "/\\attacker.example", "/\n/attacker.example"]) {
    const h = routeHarness();
    const result = await h.get(`https://www.crypto-ninja.app/auth/confirm?token_hash=test&type=email&next=${encodeURIComponent(next)}`);
    assert.equal(result.location, "https://www.crypto-ninja.app/dashboard");
  }
});

test("recovery uses verified recovery hash and retains reset destination", async () => {
  const h = routeHarness();
  assert.equal((await h.get("https://www.crypto-ninja.app/auth/confirm?token_hash=test&type=recovery&next=%2Freset-password")).location, "https://www.crypto-ninja.app/reset-password");
  assert.deepEqual(h.calls[1], ["otp", { token_hash: "test", type: "recovery" }]);
});

test("legacy PKCE failure stays unauthenticated and identifies missing cookie", async () => {
  const h = routeHarness({ error: { name: "AuthPKCECodeVerifierMissingError" } });
  assert.match((await h.get("https://www.crypto-ninja.app/auth/callback?code=test")).location, /auth_error=missing_auth_context$/);
  assert.deepEqual(h.calls[1], ["code", "test"]);
  assert.deepEqual(h.cookies, []);
});

test("canonical host normalization preserves path and strips custom port", () => {
  assert.equal(verification.canonicalAuthUrl("http://crypto-ninja.app:8080/auth/confirm?token_hash=test&type=email"), "https://www.crypto-ninja.app/auth/confirm?token_hash=test&type=email");
  assert.equal(verification.canonicalAuthUrl("https://www.crypto-ninja.app/login"), null);
});
