"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { createClient } from "../lib/supabase-browser";

type EquityCurveProps = {
  portfolioValue: number;
};

type EquityPoint = {
  portfolio_value: number;
  created_at: string;
};

type RawEquityPoint = {
  portfolio_value: unknown;
  created_at: unknown;
};

function formatCurrency(value: unknown): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "£0.00";
  }

  return amount.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatAxisCurrency(value: unknown): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "£0";
  }

  return amount.toLocaleString("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  });
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeRows(
  rows: RawEquityPoint[]
): EquityPoint[] {
  return rows
    .map((row) => ({
      portfolio_value: Number(row.portfolio_value),
      created_at: String(row.created_at ?? ""),
    }))
    .filter(
      (row) =>
        Number.isFinite(row.portfolio_value) &&
        row.created_at.length > 0 &&
        !Number.isNaN(
          new Date(row.created_at).getTime()
        )
    )
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime()
    );
}

export default function EquityCurve({
  portfolioValue,
}: EquityCurveProps) {
  const [history, setHistory] = useState<EquityPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    try {
      const supabase = createClient();

      const {
        data,
        error: queryError,
      } = await supabase
        .from("portfolio_history")
        .select("portfolio_value, created_at")
        .order("created_at", { ascending: true })
        .limit(100);

      if (queryError) {
        throw new Error(queryError.message);
      }

      setHistory(
        normalizeRows(
          (data ?? []) as RawEquityPoint[]
        )
      );

      setError(null);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load portfolio history."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadHistory();

    const timer = window.setInterval(() => {
      void loadHistory();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [loadHistory]);

  const chartData = useMemo(() => {
    if (history.length > 0) {
      return history;
    }

    const safeValue =
      Number.isFinite(portfolioValue) &&
      portfolioValue > 0
        ? portfolioValue
        : 10000;

    const now = Date.now();

    return [
      {
        portfolio_value: safeValue,
        created_at: new Date(
          now - 60_000
        ).toISOString(),
      },
      {
        portfolio_value: safeValue,
        created_at: new Date(now).toISOString(),
      },
    ];
  }, [history, portfolioValue]);

  const firstValue =
    chartData[0]?.portfolio_value ?? 0;

  const currentValue =
    chartData[chartData.length - 1]
      ?.portfolio_value ?? 0;

  const change = currentValue - firstValue;

  const changePercent =
    firstValue !== 0
      ? (change / firstValue) * 100
      : 0;

  const values = chartData.map(
    (point) => point.portfolio_value
  );

  const minimum = Math.min(...values);
  const maximum = Math.max(...values);

  const padding = Math.max(
    (maximum - minimum) * 0.25,
    2
  );

  const positive = change >= 0;

  return (
    <section className="relative overflow-hidden rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-400/[0.08] via-white/[0.04] to-fuchsia-500/[0.08] p-6 shadow-2xl shadow-cyan-950/20">
      <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-60 w-60 rounded-full bg-fuchsia-500/10 blur-3xl" />

      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-300">
            Live Equity Curve
          </p>

          <h2 className="mt-2 text-2xl font-black text-white">
            Portfolio Equity
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Your paper-trading account performance from saved Supabase snapshots.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void loadHistory()}
          className="rounded-xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black text-cyan-200 transition hover:bg-cyan-300/20"
        >
          Refresh Curve
        </button>
      </div>

      <div className="relative mt-6 grid gap-3 sm:grid-cols-3">
        <Metric
          label="Current Equity"
          value={formatCurrency(currentValue)}
          hint="Latest saved value"
        />

        <Metric
          label="Session Change"
          value={`${positive ? "+" : ""}${formatCurrency(
            change
          )}`}
          hint={`${positive ? "▲" : "▼"} ${Math.abs(
            changePercent
          ).toFixed(2)}%`}
          status={positive ? "positive" : "negative"}
        />

        <Metric
          label="Data Points"
          value={String(history.length)}
          hint="Portfolio snapshots"
        />
      </div>

      <div className="relative mt-6 rounded-2xl border border-white/10 bg-black/20 p-3">
        {error ? (
          <div className="flex h-[320px] items-center justify-center rounded-xl border border-red-400/20 bg-red-400/5 p-6 text-center text-sm text-red-300">
            {error}
          </div>
        ) : loading ? (
          <div className="flex h-[320px] items-center justify-center text-sm text-slate-400">
            Loading equity history...
          </div>
        ) : (
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 20,
                  bottom: 5,
                  left: 5,
                }}
              >
                <defs>
                  <linearGradient
                    id="equityGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor="#22d3ee"
                      stopOpacity={0.5}
                    />
                    <stop
                      offset="55%"
                      stopColor="#22d3ee"
                      stopOpacity={0.15}
                    />
                    <stop
                      offset="100%"
                      stopColor="#22d3ee"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="4 6"
                  stroke="rgba(148, 163, 184, 0.14)"
                  vertical={false}
                />

                <XAxis
                  dataKey="created_at"
                  tickFormatter={formatTime}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={30}
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 11,
                  }}
                />

                <YAxis
                  domain={[
                    Math.floor(minimum - padding),
                    Math.ceil(maximum + padding),
                  ]}
                  tickFormatter={formatAxisCurrency}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                  tick={{
                    fill: "#94a3b8",
                    fontSize: 11,
                  }}
                />

                <ReferenceLine
                  y={firstValue}
                  stroke="rgba(148, 163, 184, 0.35)"
                  strokeDasharray="5 5"
                />

                <Tooltip
                  labelFormatter={(label) =>
                    new Date(
                      String(label)
                    ).toLocaleString("en-GB")
                  }
                  formatter={(value) => [
                    formatCurrency(value),
                    "Portfolio Value",
                  ]}
                  contentStyle={{
                    background: "rgba(2, 6, 23, 0.96)",
                    border:
                      "1px solid rgba(34, 211, 238, 0.3)",
                    borderRadius: "14px",
                  }}
                  labelStyle={{
                    color: "#94a3b8",
                  }}
                  itemStyle={{
                    color: "#67e8f9",
                    fontWeight: 800,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="portfolio_value"
                  stroke="#22d3ee"
                  strokeWidth={3}
                  fill="url(#equityGradient)"
                  dot={
                    chartData.length <= 8
                      ? {
                          r: 4,
                          fill: "#020617",
                          stroke: "#67e8f9",
                          strokeWidth: 2,
                        }
                      : false
                  }
                  activeDot={{
                    r: 6,
                    fill: "#020617",
                    stroke: "#67e8f9",
                    strokeWidth: 3,
                  }}
                  isAnimationActive
                  animationDuration={700}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
        <span>Auto-refreshes every 5 seconds</span>

        <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 font-bold text-emerald-300">
          ● LIVE DATA
        </span>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  hint,
  status,
}: {
  label: string;
  value: string;
  hint: string;
  status?: "positive" | "negative";
}) {
  const hintClass =
    status === "positive"
      ? "text-emerald-300"
      : status === "negative"
        ? "text-red-300"
        : "text-slate-500";

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 backdrop-blur">
      <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-black text-white">
        {value}
      </p>

      <p className={`mt-1 text-xs font-bold ${hintClass}`}>
        {hint}
      </p>
    </div>
  );
}