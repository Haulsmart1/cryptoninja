"use client";

import { useEffect, useState } from "react";

type Signal = {
  id: number;
  time: string;
  symbol: string;
  action: "BUY" | "SELL" | "HOLD";
  confidence: number;
};

export default function AISignalFeed() {
  const [signals, setSignals] = useState<Signal[]>([
    {
      id: 1,
      time: new Date().toLocaleTimeString(),
      symbol: "BTC-GBP",
      action: "BUY",
      confidence: 82,
    },
    {
      id: 2,
      time: new Date().toLocaleTimeString(),
      symbol: "ETH-GBP",
      action: "HOLD",
      confidence: 67,
    },
    {
      id: 3,
      time: new Date().toLocaleTimeString(),
      symbol: "SOL-GBP",
      action: "SELL",
      confidence: 74,
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setSignals((current) =>
        current.map((signal) => ({
          ...signal,
          time: new Date().toLocaleTimeString(),
        }))
      );
    }, 10000);

    return () => clearInterval(interval);
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
        {signals.map((signal) => (
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

            <p className="mt-2 text-sm text-slate-400">
              Confidence: {signal.confidence}%
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {signal.time}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
