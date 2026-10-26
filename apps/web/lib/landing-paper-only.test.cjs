const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
  path.join(__dirname, "..", "app", "page.tsx"),
  "utf8"
);

test("landing page states the bounded paper-only customer promise", () => {
  assert.match(source, /£10 virtual bankroll/);
  assert.match(source, /PAPER ONLY/);
  assert.match(source, /does not place exchange orders/);
  assert.match(source, /Billing disabled/);
  assert.match(source, /Not for sale/);
});

test("landing page removes fabricated and real-trading claims", () => {
  assert.doesNotMatch(source, /System Healthy/);
  assert.doesNotMatch(source, /Trading Engine Online/);
  assert.doesNotMatch(source, /£10,000/);
  assert.doesNotMatch(source, /Live trading/);
  assert.doesNotMatch(source, /£19\/mo|£49\/mo|£99\/mo/);
});
