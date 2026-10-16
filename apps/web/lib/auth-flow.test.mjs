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
