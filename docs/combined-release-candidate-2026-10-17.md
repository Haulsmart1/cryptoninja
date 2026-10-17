# CryptoNinja combined review candidate — 17 October 2026

This branch combines auth PR #1 at `c494201` and engine-status PR #2 at
`a95dfce` without changing either source branch. The merge is conflict-free and
retains Next.js 15.5.28 from the auth repair. It is a review candidate, not a
production release.

Validation uses the declared lockfile and inert public Supabase build values;
no live account, email, database or trading operation is part of these checks.
Auth helper tests pass (5 cases), lint passes with the two existing hook warnings,
and the Python engine compiles. See the PR for the completed build result.

The engine source is unchanged relative to main. PAPER ONLY remains required.
The separately reported Render suspension still needs owner investigation;
this combined branch does not restart or reconfigure that service.

Before release, verify email receipt and the callback/session, recovery and
logout/login journeys on the intended deployment origin. Build success does not
prove those hosted journeys. After an authorised engine recovery, verify health,
authenticated portfolio reads and paper-only enforcement before any separate
decision to run a simulated trade.
