import Link from "next/link";

export default function AccountPage() {
  return (
    <main className="min-h-screen bg-[#020617] p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-2xl font-black">
          CryptoNinja <span className="text-cyan-300">AI</span>
        </Link>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-8">
          <p className="text-sm font-bold tracking-[0.35em] text-cyan-300">
            ACCOUNT CENTER
          </p>

          <h1 className="mt-4 text-4xl font-black">Account</h1>

          <p className="mt-3 text-slate-400">
            User profiles, subscriptions and exchange connections will appear here.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <Card label="Plan" value="Starter / Pending Stripe" />
            <Card label="Trading Mode" value="Paper Trading" />
            <Card label="Exchange" value="Coinbase coming soon" />
            <Card label="Security" value="Magic Link enabled" />
          </div>

          <div className="mt-8 flex gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950"
            >
              Back to Dashboard
            </Link>

            <Link
              href="/login"
              className="rounded-xl border border-white/10 px-5 py-3 font-bold hover:bg-white/10"
            >
              Log in
            </Link>
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
      <p className="mt-2 font-black">{value}</p>
    </div>
  );
}
