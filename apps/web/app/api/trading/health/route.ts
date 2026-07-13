import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const configuredEngineUrl = process.env.TRADING_ENGINE_URL;

  if (!configuredEngineUrl) {
    return NextResponse.json(
      {
        status: "offline",
        paper_trading: true,
        error: "TRADING_ENGINE_URL is not configured.",
      },
      { status: 503 }
    );
  }

  const engineUrl = configuredEngineUrl.trim().replace(/\/+$/, "");
  const healthUrl = `${engineUrl}/health`;

  try {
    const response = await fetch(healthUrl, {
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
        message: responseText || "Trading engine returned an empty response.",
      };
    }

    if (!response.ok) {
      console.error("Trading engine health returned an error:", {
        healthUrl,
        status: response.status,
        data,
      });

      return NextResponse.json(
        {
          status: "offline",
          paper_trading: true,
          requested_url: healthUrl,
          upstream_status: response.status,
          error: data,
        },
        { status: 503 }
      );
    }

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown trading engine health error.";

    console.error("Trading engine health request failed:", {
      healthUrl,
      message,
      error,
    });

    return NextResponse.json(
      {
        status: "offline",
        paper_trading: true,
        requested_url: healthUrl,
        error: message,
      },
      { status: 503 }
    );
  }
}