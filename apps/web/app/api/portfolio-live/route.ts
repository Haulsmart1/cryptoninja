import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET() {
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("portfolio_history")
    .select("portfolio_value,cash,invested,unrealized_pnl,btc_price,created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({
      cash: 0,
      invested: 0,
      market_value: 0,
      portfolio_value: 0,
      unrealized_pnl: 0,
      return_percent: 0,
      btc_price: 0,
    });
  }

  const startingBalance = 10000;
  const portfolioValue = Number(data.portfolio_value || 0);
  const invested = Number(data.invested || 0);
  const cash = Number(data.cash || 0);

  return NextResponse.json({
    cash,
    invested,
    market_value: Math.max(portfolioValue - cash, 0),
    portfolio_value: portfolioValue,
    unrealized_pnl: Number(data.unrealized_pnl || 0),
    return_percent: ((portfolioValue - startingBalance) / startingBalance) * 100,
    btc_price: Number(data.btc_price || 0),
    created_at: data.created_at,
  });
}
