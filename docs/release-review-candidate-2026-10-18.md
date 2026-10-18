# CryptoNinja release-review candidate — 18 October 2026

Status: **DRAFT; NOT RELEASED; hosted acceptance pending. PAPER ONLY.**

## Exact source and scope

This review branch targets actual `main` at
`38903c6bd8c4f9601a8ebfa829b68a11e3e48207`. Its application tree is exactly
PR18 at `20ddcfd7da217efdc96af0526b67c6db8b41a531` (tree
`6672a6967414409fde457701c0c0b74258ab17fd`), plus this review document only.
No merge conflict resolution, runtime code, dependency, lockfile, database
migration, hosted configuration or service implementation is added here.

Fresh GitHub comparison confirms a single ancestry chain, not independent patches
to cherry-pick in an arbitrary order:

| Drafts | Included behavior | Tip commit |
| --- | --- | --- |
| 4–6 | Canonical host, verified token-hash/legacy PKCE callbacks, non-consuming human-confirmation GET and same-origin POST | `bd2bbdded92167f8ed9d3c704b01368e70214fde` |
| 7–9 | Observed auto-trader state, bounded/redacted status proxy and stale AI-analysis invalidation | `368e483faf8b0d03a00f67fedbc151bb67414813` |
| 10–13 | Observed portfolio/chart data, bounded portfolio proxy, truthful dashboard state and poll ordering | `9c414eaa8f03f417f349345ec87e6ffcf13180f0` |
| 14–15 | Trade-history failure/unknown states and ordered journal observations | `a8cb0bbdff3ca388104351d0230340d2d5e90abf` |
| 16–18 | Account-history/dashboard invalidation and guarded current-browser sign-out | `20ddcfd7da217efdc96af0526b67c6db8b41a531` |

The old PR2 status work is already incorporated through merged PR3/main. Do not
merge it again. Existing source branches and draft PRs were not changed or closed.
This branch is a single review surface for the accumulated stack, not another
minor functional repair and not an instruction to merge every ancestor PR.

## Reproducible local validation

From `apps/web` using the committed npm lockfile:

```sh
npm ci --ignore-scripts --prefer-offline
npm run test:auth
npm run test:status
npx tsc --noEmit
NEXT_PUBLIC_SUPABASE_URL=https://crypto-build-only.example.invalid NEXT_PUBLIC_SUPABASE_ANON_KEY=build-only-placeholder npm run build
git diff --check
```

These tests replace network/auth/service boundaries with synthetic fixtures;
they do not call a live engine, Supabase project, mailbox or payment provider.
The build values are inert, not credentials and not deployable configuration.
Fresh execution passed 23 actual callback/helper cases and 84 component/proxy
cases (107 total), TypeScript and the complete Next.js production build.
Existing hook/Edge-runtime warnings remain. Source services and migrations are
unchanged against main. Local/build success is not hosted authentication,
database authorization, trading-service, mobile or commercial acceptance.

## Explicit acceptance and approval gates

| Gate | Required verification | Current evidence |
| --- | --- | --- |
| Canonical host | Initiate on intended apex/www host; confirm origin remains canonical and the verifier is not lost | Local tests; hosted journey pending |
| Human email confirmation | A fresh authorised email opens `/auth/confirm`; repeated scanner GETs do not redeem; explicit human POST verifies, sets session cookies and redirects locally | 23 local auth tests; hosted template and fresh email pending |
| Legacy PKCE/recovery | Legacy code links require their original browser context; missing context is not misreported as a valid session; recovery uses verified recovery flow | Local synthetic routes; hosted lifecycle pending |
| Account isolation | Sign-out/switch removes cached dashboard children, selected trade, portfolio and standalone history; old async callbacks do not repopulate another owner | Actual ReactDOM tests; hosted cross-tab/mobile pending |
| Current-browser logout | Local-scope SDK acknowledgement **and** cleared local session are required before navigation; uncertain completion remains unconfirmed | Ten synthetic dashboard cases; real browser pending |
| PAPER ONLY | No live trading permissions, restart, engine action or signal generation is authorised by this candidate | No engine/service calls or changes performed; operational verification requires separate authorisation |
| Commercial journey | Register → verify → login → pay → entitlement → product → persisted data → logout/login | **NOT ACCEPTED**; billing remains outside this review |

Hosted Magic Link activation is a **separate approval**, not automatic from the
repository template: review the correct Crypto Supabase project and Site URL
`https://www.crypto-ninja.app`, then the included template in
`supabase/templates/magic-link.html`. Code and template changes need coordinated,
explicitly approved rollout and rollback planning. No hosted values were written.
Do not publish tokens, codes, cookies, secrets or authentication traces as evidence.

### Known limitations that remain release decisions

- Supabase auth-js 2.110.0 sign-out is not cancellable. Its late `_removeSession`
  can clear a newly switched browser session in another tab. The UI invalidates
  stale navigation and blocks duplicate mutation but **does not guarantee that
  concurrently switched browser sessions survive**. Timeout does not cancel SDK
  work. Unknown completion requires reload/session verification, not blind retry.
- Local logout is not global logout, does not affect other devices and does not
  revoke previously issued access JWTs immediately.
- Actual email initiation/browser-origin evidence, hosted registration/recovery,
  fresh login/logout/login, phone layouts and cross-tab acceptance are missing.
- Engine recovery remains owner-controlled and outside this candidate. A healthy
  preview or a sampled paper-health result is not proof of engine operation,
  risk-control effectiveness, full history, profitability or a commercial launch.
- Position estimates derived from limited recent history are not an authoritative
  complete ledger. No historical ownership/backfill or accounting-policy changes
  are proposed.

No merge, production deployment, live schema/data/configuration change, email,
billing activation, customer publication, engine restart or trade was performed.
Estimated readiness remains 55% until independently accepted hosted journeys.
