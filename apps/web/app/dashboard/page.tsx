"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase-browser";

type EngineHealth = {
  status: string;
  paper_trading: boolean;
  cash_gbp: number;
  trades: number;
};

type PaperTrade = {
  id: string;
  symbol: string;
  side: string;
  quantity: string;
  price: string;
  value_gbp: string;
  status: string;
  reason: string | null;
  cash_gbp: string | null;
  created_at: string;
};

export default function DashboardPage() {
  const [health, setHealth] = useState<EngineHealth | null>(null);
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<Record<string, number | null>>({});
  const [runningTrade, setRunningTrade] = useState(false);
  const [message, setMessage] = useState("");

  async function loadHealth() {
    try {
      const response = await fetch("/api/trading/health", { cache: "no-store" });
      const data = await response.json();
      setHealth(data);
    } catch {
      setHealth({
        status: "offline",
        paper_trading: true,
        cash_gbp: 0,
        trades: 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadTrades() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("paper_trade_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setTrades(data as PaperTrade[]);
    }
  }

  async function loadPrices() {
    try {
      const response = await fetch("/api/market/prices", { cache: "no-store" });
      const data = await response.json();
      setPrices(data);
    } catch {
      setPrices({});
    }
  }

  async function refreshAll() {
    await Promise.all([loadHealth(), loadTrades(), loadPrices()]);
  }

  async function runPaperTrade() {
    setRunningTrade(true);
    setMessage("");

    try {
      const response = await fetch("/api/trading/run-paper", {
        method: "POST",
      });

      const data = await response.json();

      if (!data.executed) {
        setMessage(data.reason || "Trade blocked.");
      } else {
        setMessage("Paper trade executed successfully.");
      }

      await refreshAll();
    } catch {
      setMessage("Trading engine unavailable.");
    } finally {
      setRunningTrade(false);
    }
  }

  useEffect(() => {
    refreshAll();
    const interval = setInterval(refreshAll, 5000);
    return () => clearInterval(interval);
  }, []);

  const latestCash =
    trades[0]?.cash_gbp !== null && trades[0]?.cash_gbp !== undefined
      ? Number(trades[0].cash_gbp)
      : health?.cash_gbp ?? 0;

  const investedCapital = trades.reduce(
    (total, trade) => total + Number(trade.value_gbp || 0),
    0
  );

  const holdings = trades.reduce<Record<string, { symbol: string; quantity: number; cost: number }>>(
    (acc, trade) => {
      if (!acc[trade.symbol]) {
        acc[trade.symbol] = { symbol: trade.symbol, quantity: 0, cost: 0 };
      }

      const quantity = Number(trade.quantity || 0);
      const value = Number(trade.value_gbp || 0);

      if (trade.side.toLowerCase() === "buy") {
        acc[trade.symbol].quantity += quantity;
        acc[trade.symbol].cost += value;
      }

      if (trade.side.toLowerCase() === "sell") {
        acc[trade.symbol].quantity -= quantity;
        acc[trade.symbol].cost -= value;
      }

      return acc;
    },
    {}
  );

  const holdingRows = Object.values(holdings).filter((holding) => holding.quantity > 0);
  const openPositions = holdingRows.length;
  const startingBalance = 10000;
  const liveHoldingsValue = holdingRows.reduce((total, holding) => {
    const livePrice = prices[holding.symbol] ?? holding.cost / holding.quantity;
    return total + holding.quantity * livePrice;
  }, 0);

  const estimatedPortfolioValue = latestCash + liveHoldingsValue;
  const totalPnl = estimatedPortfolioValue - startingBalance;
  const totalReturn = (totalPnl / startingBalance) * 100;

  const online = health?.status === "healthy";

  return (
    <main className="min-h-screen bg-[#020617] text-white">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <nav className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            CryptoNinja <span className="text-cyan-300">AI</span>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/account" className="rounded-xl border border-white/10 px-5 py-3 text-sm font-bold hover:bg-white/10">
              Account
            </Link>

            <button className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm font-black text-red-300">
              Emergency Stop
            </button>
          </div>
        </nav>

        <section className="mt-10">
          <p className="text-sm font-bold tracking-[0.35em] text-cyan-300">
            COMMAND CENTER
          </p>

          <div className="mt-4 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="text-5xl font-black">CryptoNinja AI Dashboard</h1>
              <p className="mt-3 text-slate-400">
                Live paper trades, Supabase history, risk controls and bot activity.
              </p>
            </div>

            <div className={`rounded-full border px-5 py-3 text-sm font-black ${
              online
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-red-400/30 bg-red-400/10 text-red-300"
            }`}>
              {online ? "● Engine Online" : "● Engine Offline"}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-4">
          <Card label="Portfolio Value" value={loading ? "Loading..." : `£${estimatedPortfolioValue.toLocaleString()}`} />
          <Card label="Cash" value={`£${latestCash.toLocaleString()}`} />
          <Card label="Invested" value={`£${investedCapital.toLocaleString()}`} />
          <Card label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}£${totalPnl.toFixed(2)}`} />
          <Card label="Return" value={`${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`} />
          <Card label="Open Positions" value={String(openPositions)} />
          <Card label="Saved Trades" value={String(trades.length)} />
          <Card label="Risk" value="Protected" />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black">Trading Engine</h2>

              <button
                onClick={runPaperTrade}
                disabled={runningTrade || !online}
                className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
              >
                {runningTrade ? "Running..." : "Run Paper Trade"}
              </button>
            </div>

            {message && (
              <p className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                {message}
              </p>
            )}

            <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/[0.04] text-slate-400">
                  <tr>
                    <th className="p-4">System</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Details</th>
                  </tr>
                </thead>
                <tbody>
                  <Row name="Trading Engine" status={online ? "Online" : "Offline"} detail="FastAPI service" />
                  <Row name="Paper Broker" status="Active" detail="Simulated execution only" />
                  <Row name="Risk Engine" status="Protected" detail="Trade limits active" />
                  <Row name="Supabase" status="Connected" detail="Trade logs active" />
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-6">
            <Panel title="AI Market Brief">
              BTC is holding above support. ETH momentum is improving. Risk remains low.
              Paper engine is waiting for confirmation.
            </Panel>

            <Panel title="Risk Rules">
              Max trade size active. Daily loss limit active. Live trading remains locked.
            </Panel>

            <Panel title="Next Build">
              Connect Coinbase market data, then convert paper logs into portfolio analytics.
            </Panel>
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-black">Portfolio Allocation</h2>

            <div className="mt-6 space-y-4">
              <AllocationRow label="Cash" value={latestCash} total={estimatedPortfolioValue} />
              {holdingRows.map((holding) => {
                const livePrice = Number(prices[holding.symbol] ?? holding.cost / holding.quantity);
                const value = holding.quantity * livePrice;

                return (
                  <AllocationRow
                    key={holding.symbol}
                    label={holding.symbol}
                    value={value}
                    total={estimatedPortfolioValue}
                  />
                );
              })}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
            <h2 className="text-2xl font-black">Performance</h2>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Card label="Starting Balance" value="£10,000" />
              <Card label="Current Value" value={`£${estimatedPortfolioValue.toLocaleString()}`} />
              <Card label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}£${totalPnl.toFixed(2)}`} />
              <Card label="Return" value={`${totalReturn >= 0 ? "+" : ""}${totalReturn.toFixed(2)}%`} />
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black">Open Positions</h2>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-slate-400">
                <tr>
                  <th className="p-4">Asset</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Cost Basis</th>
                  <th className="p-4">Avg Entry</th>
                  <th className="p-4">Live Price</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">P&L</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {holdingRows.length === 0 ? (
                  <tr>
                    <td className="p-4 text-slate-400" colSpan={8}>
                      No open positions yet.
                    </td>
                  </tr>
                ) : (
                  holdingRows.map((holding) => (
                    <tr key={holding.symbol} className="border-t border-white/10">
                      <td className="p-4 font-bold">{holding.symbol}</td>
                      <td className="p-4">{holding.quantity}</td>
                      <td className="p-4">£{holding.cost.toFixed(2)}</td>
                      <td className="p-4">
                        £{(holding.cost / holding.quantity).toLocaleString()}
                      </td>
                      <td className="p-4">
                        £{Number(prices[holding.symbol] ?? holding.cost / holding.quantity).toLocaleString()}
                      </td>
                      <td className="p-4">
                        £{(holding.quantity * Number(prices[holding.symbol] ?? holding.cost / holding.quantity)).toFixed(2)}
                      </td>
                      <td className="p-4 text-emerald-300">
                        £{((holding.quantity * Number(prices[holding.symbol] ?? holding.cost / holding.quantity)) - holding.cost).toFixed(2)}
                      </td>
                      <td className="p-4 text-emerald-300">Open</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <h2 className="text-2xl font-black">Recent Paper Trades</h2>

          <div className="mt-6 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-slate-400">
                <tr>
                  <th className="p-4">Time</th>
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Side</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Cash</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {trades.length === 0 ? (
                  <tr>
                    <td className="p-4 text-slate-400" colSpan={6}>
                      No paper trades logged yet.
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.id} className="border-t border-white/10">
                      <td className="p-4 text-slate-400">
                        {new Date(trade.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 font-bold">{trade.symbol}</td>
                      <td className="p-4 text-cyan-300">{trade.side.toUpperCase()}</td>
                      <td className="p-4">£{Number(trade.value_gbp).toFixed(2)}</td>
                      <td className="p-4">£{Number(trade.cash_gbp ?? 0).toLocaleString()}</td>
                      <td className="p-4 text-emerald-300">{trade.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}

function Row({ name, status, detail }: { name: string; status: string; detail: string }) {
  return (
    <tr className="border-t border-white/10">
      <td className="p-4 font-bold">{name}</td>
      <td className="p-4 text-cyan-300">{status}</td>
      <td className="p-4 text-slate-400">{detail}</td>
    </tr>
  );
}

function AllocationRow({
  label,
  value,
  total,
}: {
  label: string;
  value: number;
  total: number;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="font-bold text-white">{label}</span>
        <span className="text-slate-400">
          £{value.toFixed(2)} · {percentage.toFixed(1)}%
        </span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-cyan-300"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="text-xl font-black">{title}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-400">{children}</p>
    </div>
  );
}




