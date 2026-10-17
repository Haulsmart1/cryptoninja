export function verifyEmailCallback(auth: {
  verifyOtp(params: { token_hash: string; type: "email" | "recovery" }): Promise<{ error: { name: string } | null }>;
  exchangeCodeForSession(code: string): Promise<{ error: { name: string } | null }>;
}, params: URLSearchParams): Promise<{ error: { name: string } | null }>;
export function callbackErrorCode(error: { name: string }): string;
export function canonicalAuthUrl(value: string): string | null;
