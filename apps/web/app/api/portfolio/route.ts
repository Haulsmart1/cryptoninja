import { NextResponse } from "next/server";

const ENGINE_URL = process.env.TRADING_ENGINE_URL ?? "http://127.0.0.1:8000";

export async function GET() {
  try {
    const response = await fetch(`${ENGINE_URL}/portfolio`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Portfolio unavailable" }, { status: 503 });
    }

    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: "Unable to connect to engine" }, { status: 503 });
  }
}
