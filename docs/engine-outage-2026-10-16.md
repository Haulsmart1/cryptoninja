# Engine outage — 16 October 2026

Read-only production check: `GET https://www.crypto-ninja.app/api/trading/health`
returns `status: offline`, `paper_trading: true`, `upstream_status: 503`.
The configured upstream is `https://cryptoninja-o0cg.onrender.com/health`.
Its response is a Render page titled **Service Suspended**, saying
**This service has been suspended**. The reason for suspension is not exposed.

Vercel has a `TRADING_ENGINE_URL` variable scoped to production and preview.
Do not replace it with localhost or assume this is a missing variable.

Recovery requires the owner of that Render service to inspect the service status,
events and suspension reason. No service restart, paid infrastructure provisioning,
environment changes, production deployment or trade execution was performed.
After an authorised recovery, verify `/health`, authenticated portfolio reads,
and PAPER ONLY enforcement before separately approving any simulated trading run.

The dashboard previously hardcoded AI ONLINE, LIVE, Bullish, Low and 82% even
while the engine was offline. This repair removes those unsupported claims,
labels fixed watchlist examples, and uses the dashboard's existing health result
for the command centre's engine connectivity badge. It does not claim an AI model
is running when an engine health check succeeds.
