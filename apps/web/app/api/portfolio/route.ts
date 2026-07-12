import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const engineUrl = process.env.TRADING_ENGINE_URL;

export async function GET() {
  if (!engineUrl) {
    return NextResponse.json(
      { error: "Trading engine is not configured." },
      { status: 503 }
    );
  }

  const supabase = createSupabaseServerClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json(
      { error: "Not authenticated." },
      { status: 401 }
    );
  }

  try {
    const response = await fetch(`${engineUrl}/portfolio`, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
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