"use client";

import { useEffect, useState } from "react";
import { createClient } from "../lib/supabase-browser";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Snapshot = {
  portfolio_value: number;
  created_at: string;
};

export default function PortfolioChart() {
  const [data, setData] = useState<Snapshot[]>([]);

  async function load() {
    const supabase = createClient();

    const { data } = await supabase
      .from("portfolio_history")
      .select("portfolio_value, created_at")
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      setData(data as Snapshot[]);
    }
  }

  useEffect(() => {
    load();
    const timer = setInterval(load, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="mb-4 text-2xl font-black">
        Portfolio Performance
      </h2>

      <div style={{ width: "100%", height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="created_at"
              tickFormatter={(v) =>
                new Date(v).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
              }
            />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="portfolio_value"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
