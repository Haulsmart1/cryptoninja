"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "../../lib/supabase-browser";
import { getAuthRedirectUrl, normalizeEmail } from "../../lib/auth-flow.mjs";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendReset() {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) {
      setMessage("Enter your email address.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
        redirectTo: getAuthRedirectUrl(
          "/auth/callback?next=/reset-password",
          window.location.origin,
        ),
      });

      if (error) {
        throw error;
      }

      setMessage("If an account exists for that address, a reset link is on its way. Check your email.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Unable to send a password reset link.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="text-xs font-bold tracking-[0.35em] text-cyan-300">
          ACCOUNT RECOVERY
        </p>

        <h1 className="mt-4 text-4xl font-black">Reset password</h1>

        <p className="mt-3 text-slate-400">
          Enter your email and we will send you a secure reset link.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void sendReset();
          }}
        >
        <label className="sr-only" htmlFor="reset-email">Email address</label>
        <input
          id="reset-email"
          className="mt-8 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300"
          type="email"
          autoComplete="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <button
          type="submit"
          disabled={loading || !email.trim()}
          className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950 disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send reset link"}
        </button>
        </form>

        {message && (
          <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
            {message}
          </p>
        )}

        <p className="mt-6 text-center text-sm text-slate-400">
          Remembered it?{" "}
          <Link href="/login" className="font-bold text-cyan-300">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
