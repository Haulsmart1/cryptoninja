export function normalizeEmail(email: string): string;
export function getAuthRedirectUrl(path: string, origin: string): string;
export function getAuthErrorMessage(code: string | null): string | null;
export function safeRedirectPath(value: string | null): string;
