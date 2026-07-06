"use client";

import { useEffect, useState } from "react";
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

  async function loadSignals() {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("ai_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setSignals(data as Signal[]);
    }
  }

  useEffect(() => {
    loadSignals();

    const timer = setInterval(loadSignals, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black">AI Signal Feed</h2>

        <span className="rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-bold text-cyan-300">
          LIVE
        </span>
      </div>

      <div className="mt-6 space-y-3">
        {signals.length === 0 ? (
          <p className="text-slate-400">Waiting for AI signals...</p>
        ) : (
          signals.map((signal) => (
            <div
              key={signal.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold">{signal.symbol}</span>

                <span
                  className={
                    signal.action === "BUY"
                      ? "text-emerald-300"
                      : signal.action === "SELL"
                      ? "text-red-300"
                      : "text-amber-300"
                  }
                >
                  {signal.action}
                </span>
              </div>

              <p className="mt-2 text-sm text-slate-300">
                Confidence: <strong>{signal.confidence}%</strong>
              </p>

              <p className="mt-1 text-sm text-slate-400">
                {signal.reason}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={
                    signal.executed
                      ? "text-emerald-300"
                      : "text-red-300"
                  }
                >
                  {signal.executed ? "Executed" : "Blocked"}
                </span>

                <span className="text-xs text-slate-500">
                  {new Date(signal.created_at).toLocaleString()}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
