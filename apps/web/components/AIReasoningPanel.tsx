"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase-browser";

type Signal = {
  symbol: string;
  action: string;
  confidence: number;
  reason: string;
  created_at: string;
};

export default function AIReasoningPanel() {
  const [signal, setSignal] = useState<Signal | null>(null);

  async function loadSignal() {
    const supabase = createClient();

    const { data } = await supabase
      .from("ai_signals")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (data) {
      setSignal(data as Signal);
    }
  }

  useEffect(() => {
    loadSignal();

    const timer = setInterval(loadSignal, 5000);

    return () => clearInterval(timer);
  }, []);

  if (!signal) {
    return (
      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-6">
        Loading AI Analysis...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-6">

      <h2 className="text-2xl font-black text-cyan-300">
        🧠 AI Market Analysis
      </h2>

      <div className="mt-6 space-y-5">

        <div className="flex justify-between">
          <span>Decision</span>

          <span className="font-black text-emerald-300">
            {signal.action} {signal.symbol}
          </span>
        </div>

        <div>

          <div className="mb-2 flex justify-between text-sm">
            <span>Confidence</span>
            <span>{signal.confidence}%</span>
          </div>

          <div className="h-3 rounded-full bg-slate-800">

            <div
              className="h-full rounded-full bg-cyan-300"
              style={{
                width: `${signal.confidence}%`,
              }}
            />

          </div>

        </div>

        <div>

          <p className="font-bold">
            AI Reason
          </p>

          <p className="mt-2 text-sm text-slate-300">
            {signal.reason}
          </p>

        </div>

        <div className="grid grid-cols-2 gap-4">

          <Metric
            title="Risk"
            value="LOW"
          />

          <Metric
            title="Market"
            value="Bullish"
          />

          <Metric
            title="Confidence"
            value={`${signal.confidence}%`}
          />

          <Metric
            title="Last Signal"
            value={new Date(signal.created_at).toLocaleTimeString()}
          />

        </div>

      </div>

    </div>
  );
}

function Metric({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-black/20 p-4">
      <p className="text-xs text-slate-400">
        {title}
      </p>

      <p className="mt-1 font-black">
        {value}
      </p>
    </div>
  );
}
