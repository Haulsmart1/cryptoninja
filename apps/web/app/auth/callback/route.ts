import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { safeRedirectPath } from "../../../lib/auth-flow.mjs";
import { callbackErrorCode, verifyEmailCallback } from "../../../lib/email-verification.mjs";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const providerError = requestUrl.searchParams.get("error_code")
    ?? requestUrl.searchParams.get("error");
  const next = safeRedirectPath(
    requestUrl.searchParams.get("next")
  );

  if (!code && !tokenHash && providerError) {
    const expired = /expired|otp_expired|link_invalid/i.test(providerError);
    return NextResponse.redirect(
      new URL(
        `/login?auth_error=${expired ? "expired_link" : "callback_failed"}`,
        requestUrl.origin,
      ),
    );
  }

  if (!code && !tokenHash) {
    return NextResponse.redirect(
      new URL("/login?auth_error=missing_code", requestUrl.origin),
    );
  }

  const cookieStore = await cookies();

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.redirect(
      new URL(
        "/login?auth_error=missing_configuration",
        requestUrl.origin
      )
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              cookieStore.set(name, value, options);
            }
          );
        },
      },
    }
  );

  const { error } = await verifyEmailCallback(supabase.auth, requestUrl.searchParams);

  if (error) {
    console.error("Supabase callback exchange failed:", error.name);

    return NextResponse.redirect(
      new URL(
        `/login?auth_error=${callbackErrorCode(error)}`,
        requestUrl.origin
      )
    );
  }

  return NextResponse.redirect(
    new URL(next, requestUrl.origin)
  );
}
