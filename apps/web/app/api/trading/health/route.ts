import { NextResponse } from "next/server";

const engineUrl = process.env.TRADING_ENGINE_URL;

export async function GET() {
  if (!engineUrl) {
    return NextResponse.json(
      {
        status: "offline",
        paper_trading: true,
        error: "TRADING_ENGINE_URL is not configured.",
      },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(`${engineUrl}/health`, {
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          status: "offline",
          paper_trading: true,
          error: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, {
      status: 200,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown trading engine health error.";

    console.error("Trading engine health request failed:", {
      engineUrl,
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
