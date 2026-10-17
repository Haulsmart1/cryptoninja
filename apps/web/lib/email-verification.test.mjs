import assert from "node:assert/strict";
import test from "node:test";
import { callbackErrorCode, canonicalAuthUrl, verifyEmailCallback } from "./email-verification.mjs";

test("token-hash email confirmation works without a PKCE code or cookie", async () => {
  let verified;
  const auth = {
    verifyOtp: async (params) => { verified = params; return { error: null }; },
    exchangeCodeForSession: async () => { throw new Error("must not exchange PKCE code"); },
  };
  assert.deepEqual(await verifyEmailCallback(auth, new URLSearchParams("token_hash=one-time-hash&type=email")), { error: null });
  assert.deepEqual(verified, { token_hash: "one-time-hash", type: "email" });
});

test("verification failures remain failures, never creating an authenticated result", async () => {
  const error = { name: "AuthApiError" };
  const result = await verifyEmailCallback({ verifyOtp: async () => ({ error }) }, new URLSearchParams("token_hash=expired&type=email"));
  assert.equal(result.error, error);
});

test("unsupported verification types and missing tokens fail before contacting auth", async () => {
  assert.equal((await verifyEmailCallback({}, new URLSearchParams("token_hash=hash&type=invite"))).error.name, "UnsupportedEmailVerificationType");
  assert.equal((await verifyEmailCallback({}, new URLSearchParams())).error.name, "MissingEmailVerificationToken");
});

test("legacy code links retain PKCE exchange and report missing verifier accurately", async () => {
  let exchanged;
  const error = { name: "AuthPKCECodeVerifierMissingError" };
  const result = await verifyEmailCallback({ exchangeCodeForSession: async code => { exchanged = code; return { error }; } }, new URLSearchParams("code=existing-code"));
  assert.equal(exchanged, "existing-code");
  assert.equal(callbackErrorCode(result.error), "missing_auth_context");
  assert.equal(callbackErrorCode({ name: "AuthApiError" }), "invalid_link");
});

test("canonicalization keeps path/query, does not redirect previews or attacker hosts", () => {
  assert.equal(canonicalAuthUrl("https://crypto-ninja.app/login?next=%2Fdashboard"), "https://www.crypto-ninja.app/login?next=%2Fdashboard");
  for (const url of ["https://www.crypto-ninja.app/login", "https://crypto-ninja.app.attacker.test/login", "https://preview.vercel.app/login", "http://localhost:3000/login"]) assert.equal(canonicalAuthUrl(url), null);
});
