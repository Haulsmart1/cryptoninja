"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "../../lib/supabase-browser";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);

  async function updatePassword() {
    if (password.length < 8) {
      setMessage("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("The passwords do not match.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        throw error;
      }

      setUpdated(true);
      setMessage("Password updated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update your password. Open the latest reset link and try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#020617] px-6 text-white">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8">
        <p className="text-xs font-bold tracking-[0.35em] text-cyan-300">
          SECURE RESET
        </p>

        <h1 className="mt-4 text-4xl font-black">Choose new password</h1>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            void updatePassword();
          }}
        >
        <label className="sr-only" htmlFor="new-password">New password</label>
        <input
          id="new-password"
          className="mt-8 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          placeholder="New password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />

        <label className="sr-only" htmlFor="confirm-password">Confirm new password</label>
        <input
          id="confirm-password"
          className="mt-3 w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none focus:border-cyan-300"
          type="password"
          autoComplete="new-password"
          required
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
        />

        <button
          type="submit"
          disabled={loading || password.length < 8 || !confirmPassword}
          className="mt-4 w-full rounded-xl bg-cyan-300 px-4 py-3 font-black text-slate-950 disabled:opacity-50"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
        </form>

        {message && (
          <p role="status" aria-live="polite" className="mt-4 rounded-xl border border-white/10 bg-white/[0.04] p-3 text-sm text-slate-300">
            {message}
          </p>
        )}

        {updated && (
          <Link
            href="/dashboard"
            className="mt-4 block w-full rounded-xl bg-cyan-300 px-4 py-3 text-center font-black text-slate-950"
          >
            Continue to dashboard
          </Link>
        )}
      </div>
    </main>
  );
}
