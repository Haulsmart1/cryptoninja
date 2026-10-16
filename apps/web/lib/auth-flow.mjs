const authErrorMessages = {
  callback_failed:
    "We couldn't verify that sign-in link. Request a fresh link and try again.",
  expired_link:
    "That sign-in link has expired. Request a fresh link and try again.",
  invalid_link:
    "That sign-in link is invalid or has already been used. Request a fresh link and try again.",
  missing_code:
    "This sign-in link is incomplete. Request a fresh link and try again.",
  missing_configuration:
    "Sign-in is temporarily unavailable. Please try again later.",
};

export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}

export function getAuthRedirectUrl(path, origin) {
  return new URL(safeRedirectPath(path), origin).toString();
}

export function getAuthErrorMessage(code) {
  if (!code) {
    return null;
  }

  return authErrorMessages[code] ?? authErrorMessages.callback_failed;
}

export function safeRedirectPath(value) {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    /[\\\u0000-\u0020\u007f]/.test(value)
  ) {
    return "/dashboard";
  }

  return value;
}
