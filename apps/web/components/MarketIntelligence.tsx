"use client";

import { useEffect, useState } from "react";

type Prices = {
  "BTC-GBP": number;
  "ETH-GBP": number;
  "SOL-GBP": number;
};

type Portfolio = {
  portfolio_value: number;
};

type Health = {
  status: string;
};

export default function MarketIntelligence() {
  const [prices, setPrices] = useState<Prices | null>(null);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [health, setHealth] = useState<Health | null>(null);

  async function refresh() {
    const [p, pf, h] = await Promise.all([
      fetch("/api/market/prices").then(r => r.json()),
      fetch("/api/portfolio").then(r => r.json()),
      fetch("/api/trading/health").then(r => r.json()),
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

      <Card title="BTC" value={prices ? `£${prices["BTC-GBP"].toLocaleString()}` : "..."} />

      <Card title="ETH" value={prices ? `£${prices["ETH-GBP"].toLocaleString()}` : "..."} />

      <Card title="SOL" value={prices ? `£${prices["SOL-GBP"].toLocaleString()}` : "..."} />

      <Card
        title="Portfolio"
        value={portfolio ? `£${portfolio.portfolio_value.toLocaleString()}` : "..."}
      />

      <Card
        title="Engine"
        value={health?.status === "healthy" ? "🟢 ONLINE" : "🔴 OFFLINE"}
      />

      <Card
        title="AI"
        value="82%"
      />

    </div>
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
    <div className="rounded-2xl border border-cyan-400/20 bg-white/[0.04] p-4">
      <p className="text-xs uppercase tracking-wider text-slate-400">
        {title}
      </p>

      <p className="mt-2 text-xl font-black text-cyan-300">
        {value}
      </p>
    </div>
  );
}
