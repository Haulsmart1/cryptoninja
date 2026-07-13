import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const configuredEngineUrl = process.env.TRADING_ENGINE_URL;
  const authorization = request.headers.get("authorization");

  if (!configuredEngineUrl) {
    return NextResponse.json(
      { error: "Trading engine is not configured." },
      { status: 503 }
    );
  }

  if (!authorization) {
    return NextResponse.json(
      { error: "Authentication is required." },
      { status: 401 }
    );
  }

  const engineUrl = configuredEngineUrl
    .trim()
    .replace(/\/+$/, "");

  const startUrl = `${engineUrl}/autotrader/start`;

  try {
    const response = await fetch(startUrl, {
      method: "POST",
      cache: "no-store",
      headers: {
        Accept: "application/json",
        Authorization: authorization,
      },
    });

    const responseText = await response.text();

    let data: unknown;

    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = {
        error:
          responseText ||
          "Trading engine returned an invalid response.",
      };
    }

    return NextResponse.json(data, {
      status: response.status,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown auto-trader start proxy error.";

    console.error("Auto-trader start proxy failed:", {
      startUrl,
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
