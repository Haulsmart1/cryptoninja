import Link from "next/link";

const features = [
  "AI market analysis",
  "Paper trading mode",
  "Risk engine",
  "Live P&L dashboard",
  "Strategy automation",
  "Subscription access",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            CryptoNinja <span className="text-cyan-300">AI</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold text-slate-200 hover:bg-white/10"
            >
              Demo Dashboard
            </Link>

            <Link
              href="/login"
              className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200"
            >
              Log in
            </Link>
          </div>
        </nav>

        <div className="grid flex-1 items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <p className="mb-5 text-sm font-bold tracking-[0.35em] text-cyan-300">
              AUTONOMOUS CRYPTO COMMAND CENTER
            </p>

            <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">
              AI-powered crypto trading, built like a serious SaaS platform.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              CryptoNinja AI combines market data, risk controls, strategy
              automation, paper trading, alerts, and AI analysis into one
              premium dashboard.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/login"
                className="rounded-2xl bg-cyan-300 px-7 py-4 font-black text-slate-950 hover:bg-cyan-200"
              >
                Start with Magic Link
              </Link>

              <Link
                href="/dashboard"
                className="rounded-2xl border border-white/10 px-7 py-4 font-black text-white hover:bg-white/10"
              >
                View live demo
              </Link>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Paper trading first. Live trading stays locked until risk systems
              are complete.
            </p>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
            <div className="rounded-[1.5rem] bg-[#050b1f] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs tracking-[0.3em] text-cyan-300">
                    COMMAND CENTER
                  </p>
                  <h2 className="mt-2 text-2xl font-black">Paper Mode</h2>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                  Safe
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Card label="Portfolio" value="£10,000" />
                <Card label="Today P&L" value="+£10.52" />
                <Card label="Risk" value="Protected" />
                <Card label="Mode" value="Paper" />
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="font-black">AI Summary</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Market is mixed. Trend strength is moderate. Bot remains
                  conservative until volatility settles.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 pb-10 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 font-bold text-slate-200"
            >
              {feature}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
