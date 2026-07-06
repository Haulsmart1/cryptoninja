import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "CryptoNinja AI | AI Crypto Trading Platform",
  description:
    "CryptoNinja AI is an AI-powered crypto trading platform with paper trading, risk controls, portfolio analytics, exchange integrations and subscription access.",
  keywords: [
    "AI crypto trading bot",
    "crypto trading platform",
    "paper trading bot",
    "crypto risk management",
    "automated crypto trading",
    "crypto portfolio dashboard",
  ],
  openGraph: {
    title: "CryptoNinja AI | AI Crypto Trading Platform",
    description:
      "AI-powered crypto trading with paper trading, risk controls, exchange integrations and portfolio analytics.",
    url: "https://crypto-ninja.app",
    siteName: "CryptoNinja AI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CryptoNinja AI",
    description:
      "AI-powered crypto trading with paper trading, risk controls and portfolio analytics.",
  },
};

const statuses = [
  "Trading Engine Online",
  "AI Monitoring Markets",
  "Risk Engine Active",
  "Paper Trading Ready",
];

const connections = [
  ["Coinbase Advanced", "Available first for market data and execution"],
  ["Supabase", "Authentication, database and realtime platform"],
  ["Stripe", "Subscription billing and customer portal"],
  ["OpenAI", "AI market briefs and trading analysis"],
  ["Telegram", "Trade alerts and risk warnings"],
  ["TradingView", "Charts and market visuals"],
  ["Binance", "Planned exchange connector"],
  ["Kraken", "Planned exchange connector"],
  ["Bybit", "Planned exchange connector"],
];

const features = [
  ["AI Market Brief", "Clear market summaries with confidence, trend and volatility insight."],
  ["Risk Engine", "Capital protection with limits, drawdown controls and safe position sizing."],
  ["Paper Trading", "Test strategies safely before live execution."],
  ["Portfolio Intelligence", "Track balances, exposure, performance and open positions."],
  ["Strategy Automation", "Run trading strategies through a modular engine."],
  ["Alerts", "Telegram, email and dashboard notifications for important events."],
];

const roadmap = [
  ["Live", "Landing page, dashboard shell, Supabase setup"],
  ["Next", "Magic Link login, protected dashboard, user profiles"],
  ["Soon", "Stripe subscriptions, Coinbase paper trading, risk rules"],
  ["Later", "AI analysis engine, backtesting, multi-exchange support"],
];

const plans = [
  ["Starter", "£19/mo", "Paper trading, AI insights and basic dashboard"],
  ["Pro", "£49/mo", "Live trading, alerts, backtesting and advanced analytics"],
  ["Elite", "£99/mo", "Multi-exchange support, portfolio optimisation and priority features"],
];

export default function HomePage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "CryptoNinja AI",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description:
      "AI-powered crypto trading platform with paper trading, risk controls, subscriptions and portfolio analytics.",
    offers: {
      "@type": "Offer",
      price: "19",
      priceCurrency: "GBP",
    },
  };

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

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
              Trade smarter. Protect capital. Let AI do the heavy lifting.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              CryptoNinja AI combines market intelligence, paper trading, risk
              controls, subscription access and portfolio analytics in one
              professional trading platform.
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
                <Card label="Portfolio" value="£10,000" />
                <Card label="Today P&L" value="+£10.52" />
                <Card label="AI Confidence" value="78%" />
                <Card label="Mode" value="Paper" />
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

        <div className="grid gap-3 pb-16 md:grid-cols-4">
          {statuses.map((status) => (
            <div key={status} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm font-bold text-emerald-300">
              ● {status}
            </div>
          ))}
        </div>

        <SectionTitle eyebrow="Connected Platform" title="Connect exchanges, AI, billing and alerts." />
        <div className="grid gap-4 pb-16 md:grid-cols-3">
          {connections.map(([name, description]) => (
            <Card key={name} label={name} value={description} />
          ))}
        </div>

        <SectionTitle eyebrow="Features" title="Built for serious automated trading." />
        <div className="grid gap-4 pb-16 md:grid-cols-3">
          {features.map(([name, description]) => (
            <Card key={name} label={name} value={description} />
          ))}
        </div>

        <SectionTitle eyebrow="Pricing" title="Subscription plans for every trader." />
        <div className="grid gap-4 pb-16 md:grid-cols-3">
          {plans.map(([name, price, description]) => (
            <div key={name} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <p className="text-2xl font-black">{name}</p>
              <p className="mt-3 text-4xl font-black text-cyan-300">{price}</p>
              <p className="mt-4 text-sm leading-6 text-slate-400">{description}</p>
              <p className="mt-6 rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-bold text-slate-300">
                Coming Soon
              </p>
            </div>
          ))}
        </div>

        <SectionTitle eyebrow="Roadmap" title="Transparent build progress." />
        <div className="grid gap-4 pb-16 md:grid-cols-4">
          {roadmap.map(([stage, text]) => (
            <Card key={stage} label={stage} value={text} />
          ))}
        </div>

        <footer className="border-t border-white/10 py-10 text-sm text-slate-500">
          <div className="flex flex-col justify-between gap-4 md:flex-row">
            <p>© 2026 CryptoNinja AI. Built for disciplined crypto automation.</p>
            <div className="flex gap-5">
              <Link href="/login">Login</Link>
              <Link href="/dashboard">Demo</Link>
              <Link href="/">Roadmap</Link>
            </div>
          </div>
        </footer>
      </section>
    </main>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-sm font-bold tracking-[0.35em] text-cyan-300">{eyebrow}</p>
      <h2 className="mt-3 max-w-3xl text-3xl font-black md:text-5xl">{title}</h2>
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
