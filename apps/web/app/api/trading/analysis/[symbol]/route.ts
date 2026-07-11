import { NextRequest, NextResponse } from "next/server";

const engineUrl = process.env.TRADING_ENGINE_URL;

export async function GET(
  _request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  if (!engineUrl) {
    return NextResponse.json(
      { error: "Trading engine is not configured." },
      { status: 503 }
    );
  }

  try {
    const response = await fetch(
      `${engineUrl}/analysis/${encodeURIComponent(params.symbol)}`,
      {
        cache: "no-store",
      }
    );

    const data = await response.json();

    return NextResponse.json(data, {
      status: response.status,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { error: "Unable to connect to trading engine." },
      { status: 503 }
    );
  }
}
