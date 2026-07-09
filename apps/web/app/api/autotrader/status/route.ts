import { NextResponse } from "next/server";

const engine = process.env.TRADING_ENGINE_URL!;

export async function GET() {
  const response = await fetch(`${engine}/autotrader/status`, { cache: "no-store" });
  return NextResponse.json(await response.json());
}
