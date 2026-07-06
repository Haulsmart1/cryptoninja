"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-browser";

type UserProfile = {
  id: string;
  email: string | null;
};

export default function AccountPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAccount() {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        window.location.href = "/login";
        return;
      }

      setProfile({
        id: data.user.id,
        email: data.user.email ?? null,
      });

      setLoading(false);
    }

    loadAccount();
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#020617] p-8 text-white">
        Loading account...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#020617] p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            CryptoNinja <span className="text-cyan-300">AI</span>
          </Link>

          <button
            onClick={logout}
            className="rounded-xl border border-white/10 px-5 py-3 font-bold hover:bg-white/10"
          >
            Log out
          </button>
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm font-bold tracking-[0.35em] text-cyan-300">
            ACCOUNT
          </p>

          <h1 className="mt-4 text-4xl font-black">Your CryptoNinja account</h1>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card label="Email" value={profile?.email ?? "Unknown"} />
            <Card label="User ID" value={profile?.id ?? "Unknown"} />
            <Card label="Plan" value="Starter / Pending Stripe" />
            <Card label="Mode" value="Paper Trading" />
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 break-all font-black">{value}</p>
    </div>
  );
}
