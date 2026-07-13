import { NextRequest, NextResponse } from "next/server";

const configuredEngineUrl = process.env.TRADING_ENGINE_URL;

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!configuredEngineUrl) {
    return NextResponse.json(
      { error: "TRADING_ENGINE_URL is not configured." },
      { status: 503 }
    );
  }

  if (!authorization) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    );
  }

  const engineUrl = configuredEngineUrl.replace(/\/+$/, "");
  const paperTradeUrl = `${engineUrl}/paper/run-once`;

  try {
    const response = await fetch(paperTradeUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        Authorization: authorization,
        Accept: "application/json",
      },
    });

    const data = await response.json().catch(() => ({
      error: `Trading engine returned HTTP ${response.status}.`,
    }));

    if (!response.ok) {
      console.error("Paper trade request failed:", {
        paperTradeUrl,
        status: response.status,
        data,
      });
    }

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown trading-engine connection error.";

    console.error("Trading engine request failed:", {
      paperTradeUrl,
      message,
      error,
    });

    return NextResponse.json(
      {
        error: "Unable to connect to trading engine.",
        detail: message,
      },
      { status: 503 }
    );
  }
}