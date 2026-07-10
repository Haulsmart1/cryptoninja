import { NextRequest, NextResponse } from "next/server";

const engineUrl = process.env.TRADING_ENGINE_URL;

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!engineUrl || !authorization) {
    return NextResponse.json(
      { error: "Authenticated trading engine request required." },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(
      `${engineUrl}/autotrader/emergency-stop`,
      {
        method: "POST",
        cache: "no-store",
        headers: {
          Authorization: authorization,
        },
      }
    );

    return NextResponse.json(await response.json(), {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to trading engine." },
      { status: 503 }
    );
  }
}
