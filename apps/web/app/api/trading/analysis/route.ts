import { NextResponse } from "next/server";

const engine =
  process.env.TRADING_ENGINE_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    const response = await fetch(`${engine}/analysis/BTC-GBP`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Engine unavailable" },
        { status: response.status }
      );
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json(
      { error: "Engine unavailable" },
      { status: 503 }
    );
  }
}
