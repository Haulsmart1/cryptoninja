import Link from "next/link";
import { Activity, Bot, ShieldCheck, Sparkles } from "lucide-react";
import { PricingCard } from "@/components/pricing-card";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="text-xl font-black tracking-tight text-white">
          CryptoNinja<span className="text-cyan-300">AI</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link className="text-sm text-slate-300 hover:text-white" href="/dashboard">Dashboard</Link>
          <Link className="rounded-full bg-white px-4 py-2 text-sm font-bold text-slate-950" href="/dashboard">
            Launch App
          </Link>
        </div>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.08fr_0.92fr]">
        <div>
          <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm text-cyan-200">
            Paper trading first. Risk-first always.
          </div>
          <h1 className="mt-8 max-w-4xl text-5xl font-black tracking-tight text-white md:text-7xl">
            A premium AI crypto trading SaaS.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Build, test, monitor, and automate crypto strategies with a polished dashboard,
            subscriptions, risk controls, and a modular trading engine.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link className="rounded-2xl bg-cyan-300 px-6 py-4 font-black text-slate-950" href="/dashboard">
              Open dashboard
            </Link>
            <a className="rounded-2xl border border-white/10 px-6 py-4 font-bold text-white" href="#pricing">
              View pricing
            </a>
          </div>
        </div>

        <div className="glass rounded-[2rem] p-6 shadow-glow">
          <div className="grid gap-4">
            {[
              ["AI Signal", "BTC momentum improving, volatility elevated", Sparkles],
              ["Risk Engine", "Daily drawdown guard active", ShieldCheck],
              ["Trading Engine", "Paper mode running", Bot],
              ["Market Feed", "Coinbase connector ready", Activity]
            ].map(([title, text, Icon]) => (
              <div key={title as string} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  {/* @ts-expect-error dynamic icon */}
                  <Icon className="h-5 w-5 text-cyan-300" />
                  <p className="font-bold text-white">{title as string}</p>
                </div>
                <p className="mt-3 text-sm text-slate-400">{text as string}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="mx-auto max-w-7xl px-6 py-20">
        <h2 className="text-3xl font-black text-white md:text-5xl">Subscription plans</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <PricingCard name="Starter" price="£19/mo" description="Learn and paper trade." features={["Paper trading", "AI insights", "1 strategy", "Email alerts"]} />
          <PricingCard highlighted name="Pro" price="£59/mo" description="For serious testing." features={["Live trading toggle", "Backtesting", "Risk engine", "Telegram alerts"]} />
          <PricingCard name="Elite" price="£149/mo" description="Scale across accounts." features={["Multi-account", "Advanced analytics", "API access", "Priority support"]} />
        </div>
      </section>
    </main>
  );
}
