"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Analysis = {
  symbol: string;
  action: string;
  confidence: number;
  trend: string;
  momentum: string;
  rsi: number;
  reason: string;
};

function isAnalysis(value: unknown): value is Analysis {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const data = value as Record<string, unknown>;
  return ["symbol", "action", "trend", "momentum", "reason"].every(
    (key) => typeof data[key] === "string" && (data[key] as string).trim().length > 0
  ) && typeof data.confidence === "number" && Number.isFinite(data.confidence) &&
    data.confidence >= 0 && data.confidence <= 100 &&
    typeof data.rsi === "number" && Number.isFinite(data.rsi) && data.rsi >= 0 && data.rsi <= 100;
}

export default function AIReasoningPanel() {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(true);
  const requestSequence = useRef(0);

  const loadAnalysis = useCallback(async () => {
    const requestNumber = ++requestSequence.current;
    try {
      const response = await fetch("/api/trading/analysis/BTC-GBP", {
        cache: "no-store",
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) throw new Error("Analysis unavailable");
      const data: unknown = await response.json();
      if (!isAnalysis(data)) throw new Error("Invalid analysis");
      if (requestNumber !== requestSequence.current) return;
      setAnalysis(data);
    } catch {
      if (requestNumber !== requestSequence.current) return;
      // Previous advice does not establish the engine's current decision.
      setAnalysis(null);
    } finally {
      if (requestNumber === requestSequence.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalysis();

    // Poll less often than the request deadline so a stalled service can
    // resolve to unavailable before the next scheduled request begins.
    const timer = setInterval(loadAnalysis, 15000);

    return () => {
      clearInterval(timer);
      requestSequence.current += 1;
    };
  }, [loadAnalysis]);

  if (!analysis) {
    return (
      <div role="status" className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-6">
        {loading ? "Loading AI Analysis..." : "AI analysis unavailable. Retrying automatically."}
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-cyan-500/5 p-6">
      <h2 className="text-2xl font-black text-cyan-300">
        🧠 AI Market Analysis
      </h2>
      <p className="mt-2 text-sm text-amber-300">Paper trading analysis only.</p>

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
