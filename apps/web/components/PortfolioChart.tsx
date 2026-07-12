"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { createClient } from "../lib/supabase-browser";

type Snapshot = {
  portfolio_value: number;
  created_at: string;
};

type RawSnapshot = {
  portfolio_value: unknown;
  created_at: unknown;
};

function normalizeSnapshots(rows: RawSnapshot[]): Snapshot[] {
  return rows
    .map((row) => ({
      portfolio_value: Number(row.portfolio_value),
      created_at: String(row.created_at ?? ""),
    }))
    .filter(
      (row) =>
        Number.isFinite(row.portfolio_value) &&
        row.created_at.length > 0 &&
        !Number.isNaN(new Date(row.created_at).getTime())
    )
    .sort(
      (left, right) =>
        new Date(left.created_at).getTime() -
        new Date(right.created_at).getTime()
    );
}

function formatTime(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

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

export default function PortfolioChart() {
  const [data, setData] = useState<Snapshot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const supabase = createClient();

      const {
        data: rows,
        error: queryError,
      } = await supabase
        .from("portfolio_history")
        .select("portfolio_value, created_at")
        .order("created_at", { ascending: true })
        .limit(100);

      if (queryError) {
        throw new Error(queryError.message);
      }

      const normalized = normalizeSnapshots(
        (rows ?? []) as RawSnapshot[]
      );

      setData(normalized);
      setError(null);
    } catch (loadError) {
      setData([]);
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
    void load();

    const timer = window.setInterval(() => {
      void load();
    }, 5000);

    return () => {
      window.clearInterval(timer);
    };
  }, [load]);

  const chartData = useMemo(() => {
    if (data.length !== 1) {
      return data;
    }

    const firstPoint = data[0];
    const firstTime = new Date(firstPoint.created_at).getTime();

    return [
      firstPoint,
      {
        ...firstPoint,
        created_at: new Date(firstTime + 60_000).toISOString(),
      },
    ];
  }, [data]);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="text-2xl font-black">
          Portfolio Performance
        </h2>

        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 hover:border-cyan-300/40 hover:text-cyan-300"
        >
          Refresh
        </button>
      </div>

      {error ? (
        <div className="flex h-[300px] items-center justify-center rounded-2xl border border-red-400/20 bg-red-400/5 p-6 text-center text-sm text-red-300">
          Unable to load portfolio history: {error}
        </div>
      ) : loading ? (
        <div className="flex h-[300px] items-center justify-center rounded-2xl border border-white/10 text-sm text-slate-400">
          Loading portfolio history...
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex h-[300px] items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center">
          <div>
            <p className="font-bold text-slate-200">
              No portfolio history yet
            </p>
            <p className="mt-2 text-sm text-slate-400">
              The graph will appear after portfolio snapshots are saved.
            </p>
          </div>
        </div>
      ) : (
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{
                top: 10,
                right: 20,
                bottom: 10,
                left: 10,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />

              <XAxis
                dataKey="created_at"
                tickFormatter={formatTime}
                minTickGap={24}
              />

              <YAxis
                domain={["auto", "auto"]}
                tickFormatter={(value) =>
                  `£${Number(value).toLocaleString("en-GB", {
                    maximumFractionDigits: 0,
                  })}`
                }
                width={80}
              />

              <Tooltip
                labelFormatter={(label) =>
                  formatTime(String(label))
                }
                formatter={(value) => [
                  formatCurrency(value),
                  "Portfolio Value",
                ]}
              />

              <Line
                type="monotone"
                dataKey="portfolio_value"
                strokeWidth={3}
                dot={chartData.length <= 2}
                activeDot={{ r: 5 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}