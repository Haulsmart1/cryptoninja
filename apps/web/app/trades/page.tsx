"use client";

import Link from "next/link";
import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";
import { createClient } from "../../lib/supabase-browser";

type PaperTrade = {
  id: string;
  symbol: string;
  side: string;
  quantity: string | number | null | undefined;
  price: string | number | null | undefined;
  value_gbp: string | number | null | undefined;
  status: string;
  cash_gbp: string | number | null | undefined;
  created_at: string;
};

function isPaperTrade(value: unknown): value is PaperTrade {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const row = value as Record<string, unknown>;
  return ["id", "symbol", "side", "status", "created_at"].every(key => typeof row[key] === "string" && row[key] !== "")
    && Number.isFinite(Date.parse(row.created_at as string))
    && ["quantity", "price", "value_gbp", "cash_gbp"].every(key => row[key] == null || typeof row[key] === "string" || typeof row[key] === "number");
}

function amount(value: string | number | null | undefined, currency = false) {
  if (value == null || (typeof value === "string" && value.trim() === "") || !Number.isFinite(Number(value))) return "Unavailable";
  // Do not round fractional coins down to zero in a history record.
  return currency ? `£${Number(value).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 20 })}` : String(value);
}

export default function TradesPage() {
  const [trades, setTrades] = useState<PaperTrade[]>([]);
  const [readState, setReadState] = useState<"loading" | "confirmed" | "unavailable" | "signed-out">("loading");
  const [authRevision, setAuthRevision] = useState(0);
  const identityVersion = useRef(0);

  useEffect(() => {
    let active = true;
    try {
      const { data: { subscription } } = createClient().auth.onAuthStateChange(() => {
        if (!active) return;
        // The event invalidates cached UI only. The next effect verifies the
        // current user before reading; event/session metadata is not authority.
        identityVersion.current += 1;
        setTrades([]);
        setReadState("loading");
        setAuthRevision(revision => revision + 1);
      });
      return () => { active = false; identityVersion.current += 1; subscription.unsubscribe(); };
    } catch {
      return () => { active = false; identityVersion.current += 1; };
    }
  }, []);

  useEffect(() => {
    let active = true;
    const version = identityVersion.current;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    async function loadTrades() {
      try {
        const deadline = new Promise<never>((_, reject) => {
          timer = setTimeout(() => {
            controller.abort();
            reject(new Error("History read timed out"));
          }, 10000);
        });
        const result = await Promise.race([
          (async () => {
            const supabase = createClient();
            const { data: { user }, error: authError } = await supabase.auth.getUser();
            if (!active || controller.signal.aborted || version !== identityVersion.current) return null;
            if (authError && !isAuthSessionMissingError(authError)) throw new Error("Identity unavailable");
            if (!user || isAuthSessionMissingError(authError)) return null;
            return supabase.from("paper_trade_logs").select("*")
              .order("created_at", { ascending: false }).abortSignal(controller.signal);
          })(),
          deadline,
        ]);
        if (!active || version !== identityVersion.current) return;
        if (result === null) { setTrades([]); setReadState("signed-out"); return; }
        const { data, error } = result;
        if (error || !Array.isArray(data) || !data.every(isPaperTrade)) throw new Error("History unavailable");
        setTrades(data);
        setReadState("confirmed");
      } catch {
        if (!active || version !== identityVersion.current) return;
        setTrades([]);
        setReadState("unavailable");
      } finally {
        clearTimeout(timer);
      }
    }

    void loadTrades();
    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [authRevision]);

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
          <p className="mt-3 text-sm text-slate-400">Saved paper records returned for this account. Server row limits may apply.</p>
          {readState === "loading" && <p className="mt-6 text-slate-300" role="status">Loading paper trade history…</p>}
          {readState === "unavailable" && <p className="mt-6 text-amber-300" role="alert">Trade history unavailable. Your saved records have not been changed. Reload to try again.</p>}
          {readState === "signed-out" && <p className="mt-6 text-slate-300" role="status"><Link href="/login">Sign in to view your paper trade history.</Link></p>}
          {readState === "confirmed" && trades.length === 0 && <p className="mt-6 text-slate-300" role="status">No paper trades returned.</p>}

          <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
            <table className="w-full min-w-[640px] text-left text-sm" aria-label="Saved paper trade records" aria-busy={readState === "loading"}>
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
                    <td className="p-4">{amount(trade.quantity)}</td>
                    <td className="p-4">{amount(trade.price, true)}</td>
                    <td className="p-4">{amount(trade.value_gbp, true)}</td>
                    <td className="p-4">{amount(trade.cash_gbp, true)}</td>
                    <td className="p-4 text-slate-300">{trade.status}</td>
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
