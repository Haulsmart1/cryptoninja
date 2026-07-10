import { NextRequest, NextResponse } from "next/server";

const engineUrl = process.env.TRADING_ENGINE_URL;

export async function GET(request: NextRequest) {
  if (!engineUrl) {
    return NextResponse.json(
      { error: "Trading engine is not configured." },
      { status: 503 }
    );
  }

  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json(
      { error: "Authorization is required." },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${engineUrl}/portfolio`, {
      cache: "no-store",
      headers: {
        Authorization: authorization,
      },
    });

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to connect to trading engine." },
      { status: 503 }
    );
  }
}
