# Email authentication handshake repair

Production reported `AuthPKCECodeVerifierMissingError` on `/auth/callback`.
The app sends a browser PKCE request and previously accepted only `code` callbacks.
Its default host-only verifier cookie cannot follow an apex/www change or an email
opened in a separate browser. The former `invalid_link` message wrongly conflated
missing browser state with an invalid email token. Exact initiating browser/origin
of the failing request remains unverified.

This patch canonicalizes the known production apex to www before auth begins,
keeps legacy PKCE callbacks, and adds server-side token-hash verification at
`/auth/confirm`. It never grants access unless Supabase verifies the token.

## Required hosted configuration after code release

This repository file does NOT change hosted Supabase settings automatically.
Check the Crypto project's Site URL is `https://www.crypto-ninja.app`. In its Magic
Link email template, use `supabase/templates/magic-link.html`. Without this template
activation new emails continue using the browser-bound legacy code flow. Do not
claim cross-browser login repaired solely because this build passes.

Registration confirmation and recovery templates should be reviewed separately;
recovery hashes must use `type=recovery&next=/reset-password`. No live templates,
account records, billing, trading or production data were changed by this patch.

Acceptance: a new email sign-in on production, opening in the email client's browser,
must reach an authenticated dashboard; logout and fresh login must both succeed.
No tokens or codes should be pasted into logs or chat. PAPER ONLY is unchanged.

The `/auth/confirm` landing GET must not redeem tokens: email security scanners
may prefetch it. The user explicitly submits its same-origin confirmation form;
only POST calls the existing Supabase verification handler. Check this additional
button step during acceptance. Direct legacy `/auth/callback` links remain supported;
the hosted Magic Link template must point to `/auth/confirm` for this protection.

Reference: https://supabase.com/docs/guides/auth/auth-email-templates#email-prefetching

Reference: https://supabase.com/docs/guides/auth/auth-email-passwordless
