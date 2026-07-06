import Link from "next/link";

const stats = [
  ["Trading Engine", "Online"],
  ["AI Engine", "Monitoring"],
  ["Risk Engine", "Protected"],
  ["Mode", "Paper Trading"],
];

const features = [
  "AI market analysis",
  "Paper trading",
  "Risk controls",
  "Strategy automation",
  "Live P&L",
  "Subscription access",
];

const connections = [
  ["Coinbase Advanced", "Market data, paper trading, live execution"],
  ["Binance", "Planned exchange connector"],
  ["Kraken", "Planned exchange connector"],
  ["Stripe", "Subscription billing"],
  ["Supabase", "Auth, database, realtime"],
  ["Telegram", "Trade alerts and risk warnings"],
  ["Email", "Daily reports and login links"],
  ["OpenAI", "AI market brief and analysis"],
  ["TradingView", "Charts and market visuals"],
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            CryptoNinja <span className="text-cyan-300">AI</span>
          </Link>

          <div className="flex gap-3">
            <Link href="/dashboard" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10">
              Demo
            </Link>
            <Link href="/login" className="rounded-xl bg-cyan-300 px-5 py-3 text-sm font-black text-slate-950 hover:bg-cyan-200">
              Log in
            </Link>
          </div>
        </nav>

        <div className="grid min-h-[78vh] items-center gap-12 py-20 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold tracking-[0.35em] text-cyan-300">
              AUTONOMOUS CRYPTO COMMAND CENTER
            </p>

            <h1 className="mt-5 text-5xl font-black leading-tight md:text-7xl">
              AI crypto trading built like a premium SaaS platform.
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              CryptoNinja AI brings market analysis, paper trading, risk management,
              strategy automation and subscription access into one command center.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link href="/login" className="rounded-2xl bg-cyan-300 px-7 py-4 font-black text-slate-950 hover:bg-cyan-200">
                Start with Magic Link
              </Link>
              <Link href="/dashboard" className="rounded-2xl border border-white/10 px-7 py-4 font-black hover:bg-white/10">
                View Dashboard
              </Link>
            </div>
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl">
            <div className="rounded-[1.5rem] bg-[#050b1f] p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-5">
                <div>
                  <p className="text-xs tracking-[0.3em] text-cyan-300">COMMAND CENTER</p>
                  <h2 className="mt-2 text-2xl font-black">System Healthy</h2>
                </div>
                <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-300">
                  Online
                </span>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {stats.map(([label, value]) => (
                  <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                    <p className="text-sm text-slate-400">{label}</p>
                    <p className="mt-2 text-xl font-black">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="font-black">AI Market Brief</p>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  BTC is holding above support. ETH momentum is improving.
                  Risk remains low. Paper engine is waiting for confirmation.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 pb-12 md:grid-cols-3">
          {features.map((feature) => (
            <div key={feature} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 font-bold text-slate-200">
              {feature}
            </div>
          ))}
        </div>
                <div className="pb-16">
            <div className="mb-6">
              <p className="text-sm font-bold tracking-[0.35em] text-cyan-300">
                CONNECTED PLATFORM
              </p>
              <h2 className="mt-3 text-3xl font-black md:text-5xl">
                Connect your exchanges, alerts, billing and AI.
              </h2>
              <p className="mt-4 max-w-3xl text-slate-400">
                CryptoNinja AI is designed as a modular trading platform. Start
                with Coinbase and paper trading, then expand to more exchanges,
                notifications and automated workflows.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {connections.map(([name, description]) => (
                <div
                  key={name}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <p className="text-lg font-black text-white">{name}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-400">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
  );
}

