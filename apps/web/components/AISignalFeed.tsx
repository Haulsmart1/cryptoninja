"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase-browser";

type Signal = {
  id: string;
  symbol: string;
  action: string;
  confidence: number;
  reason: string | null;
  executed: boolean;
  created_at: string;
};

export default function AISignalFeed() {
  const [signals, setSignals] = useState<Signal[]>([]);

  useEffect(() => {
    const supabase = createClient();

    async function loadSignals() {
      const { data } = await supabase
        .from("ai_signals")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        setSignals(data as Signal[]);
      }
    }

    loadSignals();

    const channel = supabase
      .channel("ai-signals")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ai_signals",
        },
        (payload) => {
          setSignals((current) => [
            payload.new as Signal,
            ...current,
          ].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const stats = useMemo(() => {
    const total = signals.length;
    const executed = signals.filter((signal) => signal.executed).length;
    const holds = signals.filter(
      (signal) => signal.action.toUpperCase() === "HOLD"
    ).length;

    return {
      total,
      executed,
      holds,
    };
  }, [signals]);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-black">AI Trade Journal</h2>
          <p className="mt-1 text-sm text-slate-400">
            Live record of BUY, SELL, and HOLD decisions.
          </p>
        </div>

        <span className="w-fit rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-bold text-emerald-300">
          ● LIVE
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Recent Signals" value={stats.total} />
        <StatCard label="Executed" value={stats.executed} />
        <StatCard label="HOLD Decisions" value={stats.holds} />
      </div>

      <div className="mt-6 space-y-3">
        {signals.length === 0 ? (
          <p className="text-slate-400">
            Waiting for AI decisions...
          </p>
        ) : (
          signals.map((signal) => {
            const action = signal.action.toUpperCase();
            const status = signal.executed
              ? "Executed"
              : action === "BUY"
              ? "Blocked"
              : "Observed";

            return (
              <div
                key={signal.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-bold">{signal.symbol}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(signal.created_at).toLocaleString()}
                    </p>
                  </div>

                  <span
                    className={
                      action === "BUY"
                        ? "font-bold text-emerald-300"
                        : action === "SELL"
                        ? "font-bold text-red-300"
                        : "font-bold text-amber-300"
                    }
                  >
                    {action}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-xs text-slate-500">
                      Confidence
                    </p>
                    <p className="mt-1 font-bold">
                      {signal.confidence}%
                    </p>
                  </div>

                  <div className="rounded-xl bg-white/[0.03] p-3">
                    <p className="text-xs text-slate-500">
                      Outcome
                    </p>
                    <p
                      className={
                        signal.executed
                          ? "mt-1 font-bold text-emerald-300"
                          : action === "BUY"
                          ? "mt-1 font-bold text-red-300"
                          : "mt-1 font-bold text-slate-300"
                      }
                    >
                      {status}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-xl bg-white/[0.03] p-3">
                  <p className="text-xs text-slate-500">
                    Reasoning
                  </p>
                  <p className="mt-2 text-sm text-slate-300">
                    {signal.reason || "No reasoning recorded."}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
