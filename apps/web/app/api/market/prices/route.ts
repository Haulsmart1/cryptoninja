import { NextResponse } from "next/server";

const PRODUCTS = ["BTC-GBP", "ETH-GBP", "SOL-GBP"];

export async function GET() {
  try {
    const results = await Promise.all(
      PRODUCTS.map(async (productId) => {
        const response = await fetch(
          `https://api.exchange.coinbase.com/products/${productId}/ticker`,
          {
            cache: "no-store",
            headers: {
              Accept: "application/json",
            },
          }
        );

        if (!response.ok) {
          return [productId, null] as const;
        }

        const data: { price?: string } = await response.json();
        const price = Number(data.price);

        return [
          productId,
          Number.isFinite(price) && price > 0 ? price : null,
        ] as const;
      })
    );

    return NextResponse.json(Object.fromEntries(results), {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
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
