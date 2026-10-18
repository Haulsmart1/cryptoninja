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

  const statusUrl = `${engineUrl}/autotrader/status`;

  try {
    const response = await fetch(statusUrl, {
      method: "GET",
      cache: "no-store",
      // Covers both connecting and consuming the response body.
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
        {
          status: response.status >= 400 ? response.status : 502,
          headers: responseHeaders,
        }
      );
    }

    let data: unknown;

    try {
      data = JSON.parse(responseText);
    } catch {
      // Maintenance HTML and arbitrary upstream diagnostics must not become a
      // successful API response or be reflected into the authenticated client.
      data = null;
    }

    if (data === null || typeof data !== "object" || Array.isArray(data)) {
      return NextResponse.json(
        { error: "Trading engine returned an invalid response." },
        { status: 502, headers: responseHeaders }
      );
    }

    const status = data as { enabled?: unknown; emergency_stop?: unknown };
    if (typeof status.enabled !== "boolean" ||
        (status.emergency_stop !== undefined && typeof status.emergency_stop !== "boolean")) {
      return NextResponse.json(
        { error: "Trading engine returned an invalid response." },
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
