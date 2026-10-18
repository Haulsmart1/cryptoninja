import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const responseHeaders = {
  "Cache-Control": "private, no-store, no-cache, must-revalidate",
};

export async function GET(request: NextRequest) {
  const configuredEngineUrl = process.env.TRADING_ENGINE_URL;
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401, headers: responseHeaders }
    );
  }

  if (!configuredEngineUrl) {
    return NextResponse.json(
      { error: "Trading engine is not configured." },
      { status: 503, headers: responseHeaders }
    );
  }

  const engineUrl = configuredEngineUrl
    .trim()
    .replace(/\/+$/, "");

  try {
    const response = await fetch(`${engineUrl}/portfolio`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: "Trading engine returned an error." },
        { status: response.status >= 400 ? response.status : 502, headers: responseHeaders }
      );
    }

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      data = null;
    }

    const summary = data as Record<string, unknown> | null;
    if (!summary || typeof summary !== "object" || Array.isArray(summary) ||
        !["cash", "invested", "market_value", "portfolio_value", "unrealized_pnl", "total_pnl", "return_percent", "btc_price"].every(
          key => typeof summary[key] === "number" && Number.isFinite(summary[key])
        )) {
      return NextResponse.json(
        { error: "Trading engine returned an invalid portfolio." },
        { status: 502, headers: responseHeaders }
      );
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json(
      {
        error: "Unable to connect to trading engine.",
      },
      { status: 503, headers: responseHeaders }
    );
  }
}
