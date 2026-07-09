import random
import requests
import pandas as pd

COINBASE_URL = "https://api.exchange.coinbase.com/products/BTC-GBP/candles?granularity=3600"

def analyze_market(symbol: str):
    try:
        candles = requests.get(COINBASE_URL, timeout=10).json()

        df = pd.DataFrame(
            candles,
            columns=[
                "time",
                "low",
                "high",
                "open",
                "close",
                "volume",
            ],
        )

        df["close"] = df["close"].astype(float)

        df = df.sort_values("time")

        sma20 = df["close"].rolling(20).mean().iloc[-1]

        price = df["close"].iloc[-1]

        trend = "Bullish" if price > sma20 else "Bearish"

        confidence = 88 if trend == "Bullish" else 54

        action = (
            "BUY"
            if trend == "Bullish"
            else "SELL"
        )

        momentum = (
            "Strong"
            if abs(price - sma20) / sma20 > 0.02
            else "Moderate"
        )

        return {
            "symbol": symbol,
            "action": action,
            "confidence": confidence,
            "trend": trend,
            "momentum": momentum,
            "price": round(price, 2),
            "sma20": round(sma20, 2),
            "reason": f"Price {'above' if trend=='Bullish' else 'below'} SMA20.",
        }

    except Exception as ex:
        return {
            "symbol": symbol,
            "action": "HOLD",
            "confidence": 50,
            "trend": "Unknown",
            "momentum": "Unknown",
            "reason": str(ex),
        }
