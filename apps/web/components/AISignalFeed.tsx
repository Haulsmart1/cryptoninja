"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "../lib/supabase-browser";

type Signal = {
  id: string;
  symbol: string;
  action: string;
  confidence: number | null;
  reason: string | null;
  executed: boolean | null;
  created_at: string;
};

function readSignal(value: unknown): Signal | null {
  if (!value || typeof value !== "object") return null;
  const row = value as Record<string, unknown>;
  if (typeof row.id !== "string" || !row.id || typeof row.symbol !== "string" || !row.symbol.trim() ||
      typeof row.action !== "string" || !row.action.trim() || typeof row.created_at !== "string" ||
      !Number.isFinite(Date.parse(row.created_at))) return null;
  return {
    id: row.id, symbol: row.symbol, action: row.action, created_at: row.created_at,
    confidence: typeof row.confidence === "number" && Number.isFinite(row.confidence) && row.confidence >= 0 && row.confidence <= 100 ? row.confidence : null,
    executed: typeof row.executed === "boolean" ? row.executed : null,
    reason: typeof row.reason === "string" ? row.reason : null,
  };
}

// Existing (possibly newer Realtime) rows win over a delayed initial snapshot.
function mergeSignals(current: Signal[], incoming: Signal[]): Signal[] {
  const byId = new Map(incoming.map(row => [row.id, row]));
  for (const row of current) byId.set(row.id, row);
  return [...byId.values()].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at) || a.id.localeCompare(b.id)).slice(0, 20);
}

export default function AISignalFeed() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [history, setHistory] = useState<"loading" | "ready" | "unavailable">("loading");
  const [updates, setUpdates] = useState<"connecting" | "connected" | "unavailable">("connecting");

  useEffect(() => {
    let active = true;
    let readPending = true;
    const controller = new AbortController();
    let channel: ReturnType<ReturnType<typeof createClient>["channel"]> | undefined;
    let supabase: ReturnType<typeof createClient> | undefined;
    const timer = setTimeout(() => {
      if (!active || !readPending) return;
      readPending = false;
      controller.abort();
      setHistory("unavailable");
    }, 10000);

    async function loadSignals() {
      try {
        const { data, error } = await supabase!
          .from("ai_signals")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(20)
          .abortSignal(controller.signal);
        if (!active || !readPending) return;
        if (error || !Array.isArray(data)) throw new Error("unavailable");
        const rows = data.map(readSignal);
        if (rows.some(row => row === null)) throw new Error("unavailable");
        setSignals(current => mergeSignals(current, rows as Signal[]));
        setHistory("ready");
      } catch {
        if (active && readPending) setHistory("unavailable");
      } finally {
        readPending = false;
        clearTimeout(timer);
      }
    }

    try {
      supabase = createClient();
      void loadSignals();
      channel = supabase
        .channel("ai-signals")
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_signals" }, payload => {
          if (!active) return;
          const row = readSignal(payload.new);
          if (!row) { setUpdates("unavailable"); return; }
          setSignals(current => mergeSignals([row], current));
        })
        .subscribe(status => {
          if (!active) return;
          setUpdates(status === "SUBSCRIBED" ? "connected" : status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED" ? "unavailable" : "connecting");
        });
    } catch {
      setHistory("unavailable");
      setUpdates("unavailable");
      readPending = false;
      controller.abort();
      clearTimeout(timer);
    }

    return () => {
      active = false;
      readPending = false;
      controller.abort();
      clearTimeout(timer);
      if (channel && supabase) void supabase.removeChannel(channel);
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
            Paper-only journal of recently returned decisions. Connection status does not confirm engine health or a complete history.
          </p>
        </div>

        <span className="w-fit rounded-full border border-white/20 px-3 py-1 text-xs font-bold text-slate-300">
          {updates === "connected" ? "Updates connected" : updates === "unavailable" ? "Updates unavailable" : "Connecting updates"}
        </span>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Signals shown" value={history === "ready" || signals.length ? stats.total : "Unavailable"} />
        <StatCard label="Recorded paper executions shown" value={history === "ready" || signals.length ? stats.executed : "Unavailable"} />
        <StatCard label="HOLD decisions shown" value={history === "ready" || signals.length ? stats.holds : "Unavailable"} />
      </div>

      <div className="mt-6 space-y-3">
        {history !== "ready" && <p role="status" className="text-slate-400">{history === "loading" ? "Loading recent signals..." : "Recent history unavailable. Any rows shown are received observations only; reload to retry."}</p>}
        {signals.length === 0 && history === "ready" ? (
          <p className="text-slate-400">
            No recent signals returned. This does not confirm engine activity.
          </p>
        ) : (
          signals.map((signal) => {
            const action = signal.action.toUpperCase();
            const status = signal.executed === true ? "Recorded paper execution" : signal.executed === false ? "Not recorded as executed" : "Execution unavailable";

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
                      {signal.confidence === null ? "Unavailable" : `${signal.confidence}%`}
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
  value: number | string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-black">{value}</p>
    </div>
  );
}
