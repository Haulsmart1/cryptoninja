from typing import Optional


def clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(value, maximum))


def calculate_risk_score(
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

    normalized_momentum = momentum.lower()

    if normalized_momentum == "weak":
        score += 10
    elif normalized_momentum == "strong":
        score -= 5

    return int(clamp(score, 0, 100))


def calculate_position_size(
    starting_balance_gbp: float,
    max_position_percent: float,
    confidence: float,
    risk_score: int,
) -> float:
    if starting_balance_gbp <= 0:
        raise ValueError("Starting balance must be greater than zero.")

    if not 0 < max_position_percent <= 100:
        raise ValueError(
            "Maximum position percentage must be between 0 and 100."
        )

    maximum_position = (
        starting_balance_gbp * max_position_percent / 100
    )

    confidence_factor = clamp(confidence / 100, 0.25, 1.0)
    risk_factor = clamp(1 - risk_score / 100, 0.10, 1.0)

    return round(
        maximum_position * confidence_factor * risk_factor,
        2,
    )


def calculate_protective_levels(
    price: float,
    action: str,
    stop_loss_percent: float,
    take_profit_percent: float,
) -> tuple[Optional[float], Optional[float]]:
    if price <= 0:
        return None, None

    if action.upper() != "BUY":
        return None, None

    stop_loss = round(
        price * (1 - stop_loss_percent / 100),
        2,
    )

    take_profit = round(
        price * (1 + take_profit_percent / 100),
        2,
    )

    return stop_loss, take_profit
