import { NextResponse } from "next/server";
import { getEngineHealth } from "../../../../lib/trading-engine";

export async function GET() {
  try {
    const data = await getEngineHealth();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { status: "offline", paper_trading: true, cash_gbp: 0, trades: 0 },
      { status: 503 }
    );
  }
}
