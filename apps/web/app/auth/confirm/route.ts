import { NextResponse } from "next/server";
import { safeRedirectPath } from "../../../lib/auth-flow.mjs";
import { GET as verifyCallback } from "../callback/route";

const headers = {
  "Cache-Control": "private, no-store, max-age=0",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
  "X-Content-Type-Options": "nosniff",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[character]!);
}

function validToken(token: string | null, type: string | null) {
  return Boolean(token && token.length <= 4096 && (type === "email" || type === "recovery"));
}

// Email scanners may follow GET links. Only an explicit form POST redeems them.
export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  if (!validToken(token, type)) {
    return new Response("This sign-in link is incomplete or unsupported. Request a fresh link.", { status: 400, headers });
  }
  const next = safeRedirectPath(url.searchParams.get("next"));
  return new Response(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Confirm CryptoNinja sign-in</title><body><main><h1>Continue to CryptoNinja</h1><p>Press the button to securely confirm your email link.</p><form method="post" action="/auth/confirm"><input type="hidden" name="token_hash" value="${escapeHtml(token!)}"><input type="hidden" name="type" value="${escapeHtml(type!)}"><input type="hidden" name="next" value="${escapeHtml(next)}"><button type="submit">Confirm and continue</button></form><p>If you did not request this link, close this page.</p></main></body></html>`, {
    headers: { ...headers, "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  if (request.headers.get("origin") !== url.origin ||
      request.headers.get("content-type")?.split(";")[0].trim() !== "application/x-www-form-urlencoded") {
    return new Response("Invalid confirmation request.", { status: 403, headers });
  }
  const form = await request.formData();
  const token = form.get("token_hash");
  const type = form.get("type");
  if (typeof token !== "string" || typeof type !== "string" || !validToken(token, type)) {
    return new Response("Invalid confirmation link.", { status: 400, headers });
  }
  const next = form.get("next");
  const callback = new URL("/auth/callback", url.origin);
  callback.searchParams.set("token_hash", token);
  callback.searchParams.set("type", type);
  callback.searchParams.set("next", safeRedirectPath(typeof next === "string" ? next : null));
  const verified = await verifyCallback(new Request(callback));
  const response = new NextResponse(null, { status: 303, headers: verified.headers });
  Object.entries(headers).forEach(([name, value]) => response.headers.set(name, value));
  return response;
}
