import { NextResponse } from "next/server";
import { runPaperTrade } from "../../../../lib/trading-engine";

export async function POST() {
  try {
    const data = await runPaperTrade();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { executed: false, reason: "Trading engine unavailable" },
      { status: 503 }
    );
  }
}
