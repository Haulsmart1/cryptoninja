"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Point = {
  time: string;
  value: number;
};

export default function EquityCurve({
  portfolioValue,
}: {
  portfolioValue: number;
}) {
  const now = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const data: Point[] = [
    {
      time: now,
      value: portfolioValue,
    },
  ];

  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
      <h2 className="text-2xl font-black">Portfolio Equity</h2>

      <div className="mt-6 h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" />
            <YAxis domain={["auto", "auto"]} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              strokeWidth={3}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
