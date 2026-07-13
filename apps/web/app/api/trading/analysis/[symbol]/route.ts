import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const configuredEngineUrl = process.env.TRADING_ENGINE_URL;

  if (!configuredEngineUrl) {
    return NextResponse.json(
      { error: "Trading engine is not configured." },
      { status: 503 }
    );
  }

  const engineUrl = configuredEngineUrl
    .trim()
    .replace(/\/+$/, "");

  const analysisUrl =
    `${engineUrl}/analysis/${encodeURIComponent(params.symbol)}`;

  try {
    const response = await fetch(analysisUrl, {
      method: "GET",
      cache: "no-store",
      headers: {
        Accept: "application/json",
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
        "X-Analysis-Upstream": analysisUrl,
        "X-Analysis-Upstream-Status": String(response.status),
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown analysis proxy error.";

    console.error("Analysis proxy failed:", {
      analysisUrl,
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
