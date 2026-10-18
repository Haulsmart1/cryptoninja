// Email links can be opened in a different browser from the one that requested
// them. Token hashes are verified by Supabase and do not depend on a PKCE cookie.
export async function verifyEmailCallback(auth, params) {
  const tokenHash = params.get("token_hash");
  const type = params.get("type");
  if (tokenHash) {
    if (type !== "email" && type !== "recovery") {
      return { error: { name: "UnsupportedEmailVerificationType" } };
    }
    return auth.verifyOtp({ token_hash: tokenHash, type });
  }
  const code = params.get("code");
  if (!code) return { error: { name: "MissingEmailVerificationToken" } };
  return auth.exchangeCodeForSession(code);
}

export function callbackErrorCode(error) {
  return error?.name === "AuthPKCECodeVerifierMissingError"
    ? "missing_auth_context"
    : "invalid_link";
}

export function canonicalAuthUrl(value) {
  const url = new URL(value);
  if (url.hostname !== "crypto-ninja.app") return null;
  url.hostname = "www.crypto-ninja.app";
  url.protocol = "https:";
  url.port = "";
  return url.toString();
}
