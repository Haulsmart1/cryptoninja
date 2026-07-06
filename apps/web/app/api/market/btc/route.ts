import { NextResponse } from "next/server";

const ENGINE_URL =
  process.env.TRADING_ENGINE_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    const response = await fetch(`${ENGINE_URL}/market/btc`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Trading engine unavailable" },
        { status: 503 }
      );
    }

    const data = await response.json();

    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to trading engine" },
      { status: 503 }
    );
  }
}
