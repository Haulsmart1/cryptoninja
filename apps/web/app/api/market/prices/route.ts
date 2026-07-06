import { NextResponse } from "next/server";

const PRODUCTS = ["BTC-GBP", "ETH-GBP", "SOL-GBP"];

export async function GET() {
  try {
    const results = await Promise.all(
      PRODUCTS.map(async (productId) => {
        const response = await fetch(
          `https://api.coinbase.com/api/v3/brokerage/market/products/${productId}`,
          { cache: "no-store" }
        );

        if (!response.ok) {
          return [productId, null];
        }

        const data = await response.json();
        return [productId, Number(data.price || 0)];
      })
    );

    return NextResponse.json(Object.fromEntries(results));
  } catch {
    return NextResponse.json(
      {
        "BTC-GBP": null,
        "ETH-GBP": null,
        "SOL-GBP": null,
      },
      { status: 503 }
    );
  }
}
