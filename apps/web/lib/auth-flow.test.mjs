import assert from "node:assert/strict";
import test from "node:test";
import {
  getAuthErrorMessage,
  getAuthRedirectUrl,
  normalizeEmail,
  safeRedirectPath,
} from "./auth-flow.mjs";

test("normalizes email before sending auth requests", () => {
  assert.equal(normalizeEmail("  StuArt@Example.COM  "), "stuart@example.com");
});

test("builds callback URLs on the current deployment origin", () => {
  assert.equal(
    getAuthRedirectUrl("/auth/callback?next=/dashboard", "https://preview.example"),
    "https://preview.example/auth/callback?next=/dashboard",
  );
});

test("rejects protocol-relative callback destinations", () => {
  assert.equal(safeRedirectPath("//attacker.example"), "/dashboard");
  assert.equal(safeRedirectPath("https://attacker.example"), "/dashboard");
  assert.equal(safeRedirectPath("/reset-password"), "/reset-password");
});

test("maps callback failures to safe user-facing messages", () => {
  assert.match(getAuthErrorMessage("missing_code") ?? "", /incomplete/i);
  assert.match(getAuthErrorMessage("expired_link") ?? "", /expired/i);
  assert.match(getAuthErrorMessage("provider-internal-detail") ?? "", /fresh link/i);
  assert.equal(getAuthErrorMessage(null), null);
});

test("rejects browser-normalized external redirects in both helpers", () => {
  const origin = "https://preview.example";
  for (const value of ["/\\attacker.example", "/\t/attacker.example", "/\n/attacker.example", "/\r/attacker.example", "//attacker.example", null, undefined, 42]) {
    assert.equal(safeRedirectPath(value), "/dashboard");
    assert.equal(getAuthRedirectUrl(value, origin), `${origin}/dashboard`);
  }
  const local = "/reset-password?tab=account&next=%2Fdashboard";
  assert.equal(safeRedirectPath(local), local);
  assert.equal(new URL(getAuthRedirectUrl(local, origin)).origin, origin);
});
