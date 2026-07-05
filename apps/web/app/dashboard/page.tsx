import { Bot, Lock, Radio, ShieldCheck } from "lucide-react";
import { MetricCard } from "@/components/metric-card";

const trades = [
  { pair: "BTC-GBP", side: "Paper Buy", size: "0.002", status: "Simulated", pnl: "+£8.42" },
  { pair: "ETH-GBP", side: "Paper Sell", size: "0.03", status: "Simulated", pnl: "+£2.10" },
  { pair: "SOL-GBP", side: "Paper Buy", size: "1.4", status: "Watched", pnl: "£0.00" }
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen px-6 py-6">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">Command Center</p>
            <h1 className="mt-2 text-4xl font-black text-white">CryptoNinja AI</h1>
          </div>
          <button className="rounded-2xl border border-red-400/30 bg-red-400/10 px-5 py-3 font-bold text-red-200">
            Emergency Stop
          </button>
        </header>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <MetricCard label="Mode" value="Paper" note="Live trading locked" />
          <MetricCard label="Portfolio" value="£10,000" note="Simulated balance" />
          <MetricCard label="Today P&L" value="+£10.52" note="Paper result" />
          <MetricCard label="Risk" value="Safe" note="Limits active" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.7fr_0.3fr]">
          <div className="glass rounded-3xl p-6">
            <div className="flex items-center gap-3">
              <Radio className="text-cyan-300" />
              <h2 className="text-2xl font-black text-white">Live activity</h2>
            </div>
            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-slate-300">
                  <tr>
                    <th className="p-4">Pair</th>
                    <th className="p-4">Side</th>
                    <th className="p-4">Size</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade) => (
                    <tr key={`${trade.pair}-${trade.side}`} className="border-t border-white/10">
                      <td className="p-4 font-bold text-white">{trade.pair}</td>
                      <td className="p-4 text-slate-300">{trade.side}</td>
                      <td className="p-4 text-slate-300">{trade.size}</td>
                      <td className="p-4 text-cyan-200">{trade.status}</td>
                      <td className="p-4 text-emerald-300">{trade.pnl}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="space-y-6">
            <div className="glass rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-cyan-300" />
                <h2 className="text-xl font-black text-white">Risk rules</h2>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-slate-300">
                <li>✓ Max trade size: 2%</li>
                <li>✓ Max daily loss: 3%</li>
                <li>✓ Cooldown after loss</li>
                <li>✓ Live trading requires admin unlock</li>
              </ul>
            </div>

            <div className="glass rounded-3xl p-6">
              <div className="flex items-center gap-3">
                <Bot className="text-cyan-300" />
                <h2 className="text-xl font-black text-white">AI summary</h2>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300">
                Market is mixed. Trend strength is moderate. Bot remains conservative until volatility settles.
              </p>
            </div>

            <div className="rounded-3xl border border-amber-300/20 bg-amber-300/10 p-6">
              <div className="flex items-center gap-3">
                <Lock className="text-amber-200" />
                <h2 className="text-xl font-black text-amber-100">Live mode locked</h2>
              </div>
              <p className="mt-4 text-sm text-amber-100/80">
                Add real risk reviews, audit logs, and exchange key encryption before unlocking live trading.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
