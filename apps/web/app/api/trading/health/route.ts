import { NextResponse } from "next/server";

const configuredEngineUrl = process.env.TRADING_ENGINE_URL;

export async function GET() {
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

  const engineUrl = configuredEngineUrl.replace(/\/+$/, "");
  const healthUrl = `${engineUrl}/health`;

  try {
    const response = await fetch(healthUrl, {
      cache: "no-store",
    });

    const data = await response.json();

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
          error: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
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
        error: message,
      },
      { status: 503 }
    );
  }
}