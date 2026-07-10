"use client";

import { useEffect, useState } from "react";
import { authFetch } from "../lib/auth-fetch";

type AutoTraderStatus = {
  enabled: boolean;
  interval_seconds: number;
  min_confidence: number;
  last_run_at: string | null;
  last_decision: {
    symbol?: string;
    action?: string;
    confidence?: number;
    trend?: string;
    momentum?: string;
    reason?: string;
  } | null;
  trades_today: number;
};

export default function AutoTraderPanel() {
  const [status, setStatus] = useState<AutoTraderStatus | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStatus() {
    const response = await authFetch("/api/autotrader/status", { cache: "no-store" });
    setStatus(await response.json());
  }

  async function control(action: "start" | "stop") {
    setLoading(true);

    await fetch(`/api/autotrader/${action}`, {
      method: "POST",
    });

    await loadStatus();
    setLoading(false);
  }

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-cyan-300">🤖 Auto-Trader</h2>

        <span className={status?.enabled ? "text-emerald-300" : "text-red-300"}>
          {status?.enabled ? "● RUNNING" : "● STOPPED"}
        </span>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <Card title="Trades Today" value={String(status?.trades_today ?? 0)} />
        <Card title="Min Confidence" value={`${status?.min_confidence ?? 85}%`} />
        <Card title="Interval" value={`${status?.interval_seconds ?? 300}s`} />
        <Card title="Last Action" value={status?.last_decision?.action ?? "None"} />
      </div>

      <p className="mt-4 text-sm text-slate-300">
        {status?.last_decision?.reason ?? "Waiting for next AI decision."}
      </p>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => control("start")}
          disabled={loading}
          className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:opacity-50"
        >
          Start
        </button>

        <button
          onClick={() => control("stop")}
          disabled={loading}
          className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 font-black text-red-300 disabled:opacity-50"
        >
          Stop
        </button>
      </div>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl bg-black/20 p-4">
      <p className="text-xs text-slate-400">{title}</p>
      <p className="mt-1 font-black">{value}</p>
    </div>
  );
}



