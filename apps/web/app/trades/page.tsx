"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "../../lib/supabase-browser";

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

export default function TradesPage() {
  const [trades, setTrades] = useState<PaperTrade[]>([]);

  useEffect(() => {
    async function loadTrades() {
      const supabase = createClient();

      const { data } = await supabase
        .from("paper_trade_logs")
        .select("*")
        .order("created_at", { ascending: false });

      setTrades((data || []) as PaperTrade[]);
    }

    loadTrades();
  }, []);

  return (
    <main className="min-h-screen bg-[#020617] p-8 text-white">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-2xl font-black">
            CryptoNinja <span className="text-cyan-300">AI</span>
          </Link>

          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-5 py-3 font-bold hover:bg-white/10"
          >
            Dashboard
          </Link>
        </div>

        <section className="mt-10 rounded-3xl border border-white/10 bg-white/[0.04] p-6">
          <p className="text-sm font-bold tracking-[0.35em] text-cyan-300">
            TRADE HISTORY
          </p>

          <h1 className="mt-4 text-4xl font-black">Paper Trades</h1>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.04] text-slate-400">
                <tr>
                  <th className="p-4">Time</th>
                  <th className="p-4">Symbol</th>
                  <th className="p-4">Side</th>
                  <th className="p-4">Qty</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Value</th>
                  <th className="p-4">Cash</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>

              <tbody>
                {trades.map((trade) => (
                  <tr key={trade.id} className="border-t border-white/10">
                    <td className="p-4 text-slate-400">
                      {new Date(trade.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 font-bold">{trade.symbol}</td>
                    <td className="p-4 text-cyan-300">{trade.side.toUpperCase()}</td>
                    <td className="p-4">{trade.quantity}</td>
                    <td className="p-4">£{Number(trade.price).toLocaleString()}</td>
                    <td className="p-4">£{Number(trade.value_gbp).toFixed(2)}</td>
                    <td className="p-4">£{Number(trade.cash_gbp || 0).toLocaleString()}</td>
                    <td className="p-4 text-emerald-300">{trade.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
