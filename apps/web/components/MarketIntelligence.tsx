"use client";

import { useEffect, useState } from "react";

type Prices = {
  "BTC-GBP"?: number;
  "ETH-GBP"?: number;
  "SOL-GBP"?: number;
};

type Portfolio = {
  portfolio_value?: number;
};

type Health = {
  status?: string;
};

function money(value?: number) {
  return typeof value === "number" ? `£${value.toLocaleString()}` : "Offline";
}

export default function MarketIntelligence() {
  const [prices, setPrices] = useState<Prices>({});
  const [portfolio, setPortfolio] = useState<Portfolio>({});
  const [health, setHealth] = useState<Health>({});

  async function safeJson(url: string) {
    try {
      const response = await fetch(url, { cache: "no-store" });
      if (!response.ok) return {};
      return await response.json();
    } catch {
      return {};
    }
  }

  async function refresh() {
    const [p, pf, h] = await Promise.all([
      safeJson("/api/market/prices"),
      safeJson("/api/portfolio"),
      safeJson("/api/trading/health"),
    ]);

    setPrices(p);
    setPortfolio(pf);
    setHealth(h);
  }

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-6">
      <Card title="BTC" value={money(prices["BTC-GBP"])} />
      <Card title="ETH" value={money(prices["ETH-GBP"])} />
      <Card title="SOL" value={money(prices["SOL-GBP"])} />
      <Card title="Portfolio" value={money(portfolio.portfolio_value)} />
      <Card title="Engine" value={health.status === "healthy" ? "🟢 ONLINE" : "🔴 OFFLINE"} />
      <Card title="AI" value="82%" />
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-cyan-400/20 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">{title}</p>
      <p className="mt-2 text-xl font-black text-cyan-300">{value}</p>
    </div>
  );
}
