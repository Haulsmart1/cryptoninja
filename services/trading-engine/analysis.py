from random import randint, choice

def analyze_market(symbol: str):
    confidence = randint(72, 96)

    trend = choice([
        "Bullish",
        "Neutral",
        "Bearish",
    ])

    momentum = choice([
        "Weak",
        "Moderate",
        "Strong",
    ])

    rsi = randint(35, 72)

    if confidence >= 85:
        action = "BUY"
    elif confidence >= 60:
        action = "HOLD"
    else:
        action = "SELL"

    reason = (
        f"{symbol} trend is {trend.lower()}, "
        f"momentum is {momentum.lower()} "
        f"with RSI at {rsi}."
    )

    return {
        "symbol": symbol,
        "action": action,
        "confidence": confidence,
        "trend": trend,
        "momentum": momentum,
        "rsi": rsi,
        "reason": reason,
    }
