"use client";

import { useEffect, useState } from "react";

type Analysis = {
  symbol: string;
  action: string;
  confidence: number;
  trend: string;
  momentum: string;
  rsi: number;
  reason: string;
};

export default function AIReasoningPanel() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  async function loadAnalysis() {
    try {
      const response = await fetch("/api/trading/analysis/BTC-GBP", {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      setAnalysis(await response.json());
    } catch {
      // Ignore network errors; we'll retry on the next refresh.
    }
  }

  useEffect(() => {
    loadAnalysis();

    const timer = setInterval(loadAnalysis, 5000);

    return () => clearInterval(timer);
  }, []);

  if (!analysis) {
    return (
      <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-6">
        Loading AI Analysis...
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-6">
      <h2 className="text-2xl font-black text-cyan-300">
        ?? AI Market Analysis
      </h2>

      <div className="mt-6 space-y-4">

        <Metric title="Decision" value={`${analysis.action} ${analysis.symbol}`} />
        <Metric title="Confidence" value={`${analysis.confidence}%`} />
        <Metric title="Trend" value={analysis.trend} />
        <Metric title="Momentum" value={analysis.momentum} />
        <Metric
          title="RSI"
          value={
            typeof analysis.rsi === "number"
              ? analysis.rsi.toFixed(1)
              : "—"
          }
        />

        <div className="rounded-xl bg-black/20 p-4">
          <p className="text-xs text-slate-400">Reason</p>
          <p className="mt-2 text-sm">{analysis.reason}</p>
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
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}

