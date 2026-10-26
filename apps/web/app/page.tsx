import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "CryptoNinja | £10 Paper-Trading Review",
  description:
    "A review-only crypto paper-trading simulator with a £10 virtual bankroll. No real funds or exchange orders.",
  openGraph: {
    title: "CryptoNinja | £10 Paper-Trading Review",
    description:
      "Review-only paper trading with a £10 virtual bankroll and no real-money execution.",
    url: "https://crypto-ninja.app",
    siteName: "CryptoNinja",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "CryptoNinja £10 Paper-Trading Review",
    description:
      "Simulated trading only. No real funds, exchange credentials or live orders.",
  },
};

const boundaries = [
  ["Bankroll", "£10 virtual cash"],
  ["Order cap", "£1 simulated value"],
  ["Execution", "Paper fills only"],
  ["Real money", "Never used"],
];

const reviewScope = [
  ["Paper ledger", "Records simulated fills as filled_paper."],
  ["Risk limits", "Rejects a bankroll above £10 and a paper order above £1."],
  ["Fail-closed mode", "The engine refuses to start if PAPER_TRADING is false."],
  ["Observed results", "Portfolio values come from recorded paper activity, not promised returns."],
];

const roadmap = [
  ["Now", "Review the £10 paper-only journey."],
  ["Next", "Verify hosted login, account isolation and paper-ledger persistence."],
  ["Later", "Decide whether a paid paper-simulation service is commercially viable."],
];

export default async function HomePage({
  searchParams,
}: {
  searchParams?: Promise<{ code?: string }>;
}) {
  const query = await searchParams;

  if (query?.code) {
    redirect(
      `/auth/callback?code=${encodeURIComponent(query.code)}&next=/dashboard`
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CryptoNinja",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description:
      "Review-only paper-trading simulator with a £10 virtual bankroll. No real-money execution.",
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="mx-auto max-w-6xl px-6 py-8">
        <nav className="flex items-center justify-between gap-4">
          <Link href="/" className="text-2xl font-black">
            CryptoNinja <span className="text-cyan-300">Paper</span>
          </Link>
          <div className="flex gap-3">
            <Link
              href="/login"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10"
            >
              Review login
            </Link>
            <Link
              href="/dashboard"
              className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
            >
              Open paper dashboard
            </Link>
          </div>
        </nav>

        <div className="grid min-h-[68vh] items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold tracking-[0.35em] text-cyan-300">
              REVIEW BUILD · PAPER ONLY
            </p>
            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
              Test the decisions. Never risk real money.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              CryptoNinja is currently a limited paper-trading review with a
              £10 virtual bankroll. It does not place exchange orders, accept
              deposits or promise returns.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/dashboard"
                className="rounded-2xl bg-cyan-300 px-7 py-4 font-black text-slate-950 hover:bg-cyan-200"
              >
                View paper dashboard
              </Link>
              <span className="rounded-2xl border border-white/10 px-7 py-4 font-bold text-slate-300">
                Billing disabled
              </span>
            </div>
          </div>

          <div className="rounded-[2rem] border border-cyan-300/20 bg-white/[0.04] p-5 shadow-2xl">
            <div className="rounded-[1.5rem] bg-[#050b1f] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs tracking-[0.3em] text-cyan-300">
                    SAFETY BOUNDARY
                  </p>
                  <h2 className="mt-2 text-2xl font-black">
                    £10 review candidate
                  </h2>
                </div>
                <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200">
                  Paper only
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {boundaries.map(([label, value]) => (
                  <Card key={label} label={label} value={value} />
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="font-black">No performance claim</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Market analysis and paper outcomes may be unavailable or
                  wrong. Nothing here is financial advice or evidence of
                  profitability.
                </p>
              </div>
            </div>
          </div>
        </div>

        <SectionTitle
          eyebrow="Verified scope"
          title="A tiny simulation with explicit limits."
        />
        <div className="grid gap-4 pb-16 md:grid-cols-2">
          {reviewScope.map(([name, description]) => (
            <Card key={name} label={name} value={description} />
          ))}
        </div>

        <SectionTitle
          eyebrow="Commercial status"
          title="Not for sale and not connected to real trading."
        />
        <div className="mb-16 rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
          <p className="text-xl font-black text-amber-200">Review access only</p>
          <p className="mt-3 max-w-3xl leading-7 text-slate-300">
            Registration, payment and subscription offers are not accepted in
            this candidate. A paid paper-simulation service requires separate
            approval after hosted authentication, ledger isolation and the
            complete £10 paper journey pass.
          </p>
        </div>

        <SectionTitle eyebrow="Roadmap" title="Evidence before expansion." />
        <div className="grid gap-4 pb-16 md:grid-cols-3">
          {roadmap.map(([stage, text]) => (
            <Card key={stage} label={stage} value={text} />
          ))}
        </div>

        <footer className="border-t border-white/10 py-10 text-sm text-slate-500">
          © 2026 CryptoNinja. Review-only paper simulation.
        </footer>
      </section>
    </main>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-bold tracking-[0.35em] text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="mt-3 max-w-3xl text-3xl font-black md:text-5xl">
        {title}
      </h2>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-lg font-black text-white">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{value}</p>
    </div>
  );
}
