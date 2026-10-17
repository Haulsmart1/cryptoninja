# Unknown engine state must remain unknown

An auto-trader poll failure previously left the last successful `enabled: true`
status in memory. The panel continued to show RUNNING and old trade/risk metrics
while the engine was unavailable. Initial unknown state also claimed STOPPED,
zero trades and default confidence/risk limits, with Start enabled.

Clear cached status on rejected, unreachable, invalid JSON or malformed status
responses. Show UNAVAILABLE and unknown metrics, and disable Start until a valid
status arrives. Keep the safety Stop action available while state is unknown;
do not claim the engine has stopped. Verified stopped, running and safety-locked
states retain their existing control behavior. Ignore out-of-order polling
responses so an older success cannot revive RUNNING after a newer failure.
Malformed safety-stop flags are rejected. PAPER ONLY remains unchanged.

Validation: five regressions exercise the actual component with synthetic hook
state and mocked `authFetch`, rendered through React DOM. Three failed before the
fix; all five pass after it, including overlapping polls. The tests never invoke a control button or contact
an engine, Auth service or database. Run `npm run test:status`; the existing
23 auth regressions and TypeScript noEmit also pass. No full build is claimed.

Stacked above PR6 at bd2bbdded92167f8ed9d3c704b01368e70214fde. This does not prove
hosted email/mobile acceptance, engine availability or complete portfolio
reconciliation. No production/configuration/schema/data/email/trading changes.
