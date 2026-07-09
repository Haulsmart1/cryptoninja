import { NextResponse } from "next/server";

const engine = process.env.TRADING_ENGINE_URL!;

export async function POST() {
  const response = await fetch(`${engine}/autotrader/start`, { method: "POST" });
  return NextResponse.json(await response.json());
}
