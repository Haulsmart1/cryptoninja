"use client";

import { authFetch } from "../lib/auth-fetch";

import { useEffect, useRef, useState } from "react";

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
  paper_trading?: boolean;
};

function money(value?: number) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? `£${value.toLocaleString()}` : "Unavailable";
}

export default function MarketIntelligence() {
  const [prices, setPrices] = useState<Prices>({});
  const [portfolio, setPortfolio] = useState<Portfolio>({});
  const [health, setHealth] = useState<Health>({});
  const requestSequence = useRef(0);
  const activeReads = useRef(new Set<AbortController>());

  async function safeJson(url: string): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    activeReads.current.add(controller);
    const timer = setTimeout(() => controller.abort(), 10000);
    let onAbort: () => void = () => {};
    try {
      const interrupted = new Promise<never>((_resolve, reject) => {
        onAbort = () => reject(new Error("Read unavailable"));
        controller.signal.addEventListener("abort", onAbort, { once: true });
      });
      const read = (async () => {
        const options = { cache: "no-store" as const, signal: controller.signal };
        const response = url === "/api/portfolio" ? await authFetch(url, options) : await fetch(url, options);
        if (!response.ok) return {};
        const data: unknown = await response.json();
        return data && typeof data === "object" && !Array.isArray(data) ? data as Record<string, unknown> : {};
      })();
      // Also bound session acquisition and body parsing if a provider ignores cancellation.
      return await Promise.race([read, interrupted]);
    } catch {
      return {};
    } finally {
      clearTimeout(timer);
      controller.signal.removeEventListener("abort", onAbort);
      activeReads.current.delete(controller);
    }
  }

  async function refresh() {
    const requestNumber = ++requestSequence.current;
    const [p, pf, h] = await Promise.all([
      safeJson("/api/market/prices"),
      safeJson("/api/portfolio"),
      safeJson("/api/trading/health"),
    ]);

    if (requestNumber !== requestSequence.current) return;
    const confirmedPrices: Prices = {};
    for (const symbol of ["BTC-GBP", "ETH-GBP", "SOL-GBP"] as const) {
      const value = p[symbol];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) confirmedPrices[symbol] = value;
    }
    setPrices(confirmedPrices);
    setPortfolio(typeof pf.portfolio_value === "number" && Number.isFinite(pf.portfolio_value) && pf.portfolio_value >= 0 ? { portfolio_value: pf.portfolio_value } : {});
    setHealth(h.status === "healthy" && h.paper_trading === true ? { status: "healthy", paper_trading: true } : {});
  }

  useEffect(() => {
    refresh();
    // Give every bounded read time to settle before the next scheduled refresh.
    const timer = setInterval(refresh, 15000);
    return () => {
      clearInterval(timer);
      requestSequence.current += 1;
      for (const controller of activeReads.current) controller.abort();
    };
  }, []);

  return (
    <div className="grid gap-4 md:grid-cols-6">
      <Card title="BTC" value={money(prices["BTC-GBP"])} />
      <Card title="ETH" value={money(prices["ETH-GBP"])} />
      <Card title="SOL" value={money(prices["SOL-GBP"])} />
      <Card title="Portfolio" value={money(portfolio.portfolio_value)} />
      <Card title="Engine" value={health.status === "healthy" ? "🟢 ONLINE" : "🔴 OFFLINE"} />
      <Card title="AI" value="Not verified" />
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
