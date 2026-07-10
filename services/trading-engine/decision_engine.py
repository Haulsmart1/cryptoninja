from typing import Any

from analysis import analyze_market


STARTING_BALANCE_GBP = 10_000.0
MAX_POSITION_PERCENT = 2.5
STOP_LOSS_PERCENT = 2.0
TAKE_PROFIT_PERCENT = 4.0


def _number(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _classify_market_regime(
    trend: str,
    momentum: str,
    price: float,
    sma20: float,
) -> str:
    distance_percent = 0.0

    if sma20 > 0:
        distance_percent = abs(price - sma20) / sma20 * 100

    if distance_percent >= 3:
        return "High Volatility"

    if trend.lower() == "bullish" and momentum.lower() == "strong":
        return "Bull"

    if trend.lower() == "bearish" and momentum.lower() == "strong":
        return "Bear"

    return "Sideways"


def _calculate_risk_score(
    confidence: float,
    market_regime: str,
    momentum: str,
) -> int:
    score = 50

    if confidence >= 85:
        score -= 20
    elif confidence < 60:
        score += 20

    if market_regime == "High Volatility":
        score += 25
    elif market_regime == "Bear":
        score += 15
    elif market_regime == "Bull":
        score -= 10

    if momentum.lower() == "weak":
        score += 10
    elif momentum.lower() == "strong":
        score -= 5

    return max(0, min(100, score))


def _calculate_position_size(
    confidence: float,
    risk_score: int,
) -> float:
    base_size = STARTING_BALANCE_GBP * (MAX_POSITION_PERCENT / 100)

    confidence_factor = max(0.25, min(confidence / 100, 1.0))
    risk_factor = max(0.10, 1 - (risk_score / 100))

    return round(base_size * confidence_factor * risk_factor, 2)


def make_decision(symbol: str) -> dict:
    analysis = analyze_market(symbol)

    price = _number(analysis.get("price"))
    sma20 = _number(analysis.get("sma20"))
    confidence = _number(analysis.get("confidence"), 50)

    trend = str(analysis.get("trend", "Unknown"))
    momentum = str(analysis.get("momentum", "Unknown"))

    market_regime = _classify_market_regime(
        trend=trend,
        momentum=momentum,
        price=price,
        sma20=sma20,
    )

    risk_score = _calculate_risk_score(
        confidence=confidence,
        market_regime=market_regime,
        momentum=momentum,
    )

    if (
        trend == "Bullish"
        and confidence >= 85
        and risk_score <= 50
    ):
        action = "BUY"
    elif trend == "Bearish" and confidence >= 75:
        action = "SELL"
    else:
        action = "HOLD"

    position_size_gbp = (
        _calculate_position_size(confidence, risk_score)
        if action == "BUY"
        else 0.0
    )

    stop_loss = (
        round(price * (1 - STOP_LOSS_PERCENT / 100), 2)
        if price > 0 and action == "BUY"
        else None
    )

    take_profit = (
        round(price * (1 + TAKE_PROFIT_PERCENT / 100), 2)
        if price > 0 and action == "BUY"
        else None
    )

    reasons = [
        str(analysis.get("reason", "No analysis reason supplied.")),
        f"Market regime classified as {market_regime}.",
        f"Risk score calculated at {risk_score}/100.",
    ]

    if price > 0 and sma20 > 0:
        reasons.append(
            f"Price is {'above' if price >= sma20 else 'below'} SMA20."
        )

    return {
        "symbol": symbol.upper(),
        "action": action,
        "confidence": round(confidence, 2),
        "market_regime": market_regime,
        "trend": trend,
        "momentum": momentum,
        "price": round(price, 2),
        "sma20": round(sma20, 2),
        "risk_score": risk_score,
        "position_size_gbp": position_size_gbp,
        "stop_loss": stop_loss,
        "take_profit": take_profit,
        "reasons": reasons,
    }
