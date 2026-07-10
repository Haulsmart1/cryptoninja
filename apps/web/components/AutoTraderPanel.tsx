"use client";

import { useCallback, useEffect, useState } from "react";
import { authFetch } from "../lib/auth-fetch";

type AutoTraderDecision = {
  symbol?: string;
  action?: string;
  confidence?: number;
  trend?: string;
  momentum?: string;
  market_regime?: string;
  risk_score?: number;
  position_size_gbp?: number;
  reason?: string;
  reasons?: string[];
};

type AutoTraderStatus = {
  enabled: boolean;
  emergency_stop?: boolean;
  interval_seconds: number;
  min_confidence: number;
  max_risk_score?: number;
  last_run_at: string | null;
  last_decision: AutoTraderDecision | null;
  last_result?: {
    executed?: boolean;
    reason?: string;
    error?: string;
  } | null;
  last_error?: string | null;
  trades_today: number;
};

export default function AutoTraderPanel() {
  const [status, setStatus] = useState<AutoTraderStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStatus = useCallback(async () => {
    try {
      const response = await authFetch("/api/autotrader/status", {
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            `Unable to load auto-trader status (${response.status}).`
        );
      }

      setStatus(data as AutoTraderStatus);
      setError("");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to load auto-trader status."
      );
    }
  }, []);

  async function control(action: "start" | "stop") {
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await authFetch(`/api/autotrader/${action}`, {
        method: "POST",
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.detail ||
            data.message ||
            `Auto-trader ${action} failed (${response.status}).`
        );
      }

      setMessage(
        data.message ||
          (action === "start"
            ? "Auto-trader started."
            : "Auto-trader stopped.")
      );

      await loadStatus();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : `Unable to ${action} auto-trader.`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadStatus();

    const timer = window.setInterval(() => {
      void loadStatus();
    }, 30000);

    return () => window.clearInterval(timer);
  }, [loadStatus]);

  const decision = status?.last_decision;
  const emergencyStop = status?.emergency_stop === true;
  const running = status?.enabled === true && !emergencyStop;

  const reasons =
    decision?.reasons ??
    (decision?.reason ? [decision.reason] : []);

  return (
    <section className="rounded-3xl border border-cyan-400/20 bg-white/[0.04] p-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-black text-cyan-300">
            🤖 Auto-Trader Control
          </h2>
          <p className="mt-1 text-sm text-slate-400">
            Authenticated, user-isolated paper trading automation.
          </p>
        </div>

        <span
          className={`rounded-full border px-4 py-2 text-sm font-black ${
            emergencyStop
              ? "border-red-400/30 bg-red-400/10 text-red-300"
              : running
                ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-300"
                : "border-slate-400/20 bg-slate-400/10 text-slate-300"
          }`}
        >
          {emergencyStop
            ? "● SAFETY LOCKED"
            : running
              ? "● RUNNING"
              : "● STOPPED"}
        </span>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Card
          title="Trades Today"
          value={String(status?.trades_today ?? 0)}
        />
        <Card
          title="Min Confidence"
          value={`${status?.min_confidence ?? 85}%`}
        />
        <Card
          title="Max Risk"
          value={`${status?.max_risk_score ?? 50}/100`}
        />
        <Card
          title="Interval"
          value={`${Math.round((status?.interval_seconds ?? 300) / 60)} min`}
        />
        <Card
          title="Last Action"
          value={decision?.action ?? "None"}
        />
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Metric
          title="Symbol"
          value={decision?.symbol ?? "Waiting"}
        />
        <Metric
          title="Confidence"
          value={
            typeof decision?.confidence === "number"
              ? `${decision.confidence}%`
              : "—"
          }
        />
        <Metric
          title="Market Regime"
          value={decision?.market_regime ?? decision?.trend ?? "—"}
        />
        <Metric
          title="Risk Score"
          value={
            typeof decision?.risk_score === "number"
              ? `${decision.risk_score}/100`
              : "—"
          }
        />
      </div>

      <div className="mt-5 rounded-2xl border border-white/10 bg-black/20 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Latest AI Decision
        </p>

        <p className="mt-2 text-lg font-black">
          {decision
            ? `${decision.action ?? "HOLD"} ${decision.symbol ?? ""}`
            : "Waiting for the first decision cycle"}
        </p>

        {reasons.length > 0 ? (
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {reasons.map((reason, index) => (
              <li key={`${reason}-${index}`}>✓ {reason}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-slate-400">
            No decision explanation is available yet.
          </p>
        )}

        {status?.last_run_at && (
          <p className="mt-4 text-xs text-slate-500">
            Last cycle: {new Date(status.last_run_at).toLocaleString()}
          </p>
        )}
      </div>

      {message && (
        <p className="mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-200">
          {message}
        </p>
      )}

      {(error || status?.last_error) && (
        <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-200">
          {error || status?.last_error}
        </p>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void control("start")}
          disabled={loading || running || emergencyStop}
          className="rounded-xl bg-cyan-300 px-5 py-3 font-black text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Working..." : "Start Auto-Trader"}
        </button>

        <button
          type="button"
          onClick={() => void control("stop")}
          disabled={loading || !running}
          className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 font-black text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Stop Auto-Trader
        </button>

        <button
          type="button"
          onClick={() => void loadStatus()}
          disabled={loading}
          className="rounded-xl border border-white/10 px-5 py-3 font-black text-slate-200 disabled:opacity-40"
        >
          Refresh Status
        </button>
      </div>
    </section>
  );
}

function Card({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">
        {title}
      </p>
      <p className="mt-2 text-xl font-black text-cyan-300">
        {value}
      </p>
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
