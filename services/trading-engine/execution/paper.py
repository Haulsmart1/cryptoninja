from typing import Any

from models.decision import TradingDecision


def build_paper_order(
    decision: TradingDecision | dict[str, Any],
) -> dict[str, Any]:
    if isinstance(decision, TradingDecision):
        decision_data = decision.to_dict()
    else:
        decision_data = decision

    action = str(
        decision_data.get("action", "HOLD")
    ).upper()

    if action != "BUY":
        raise ValueError(
            f"Paper execution only supports BUY. Received {action}."
        )

    price = float(
        decision_data.get("price", 0)
    )

    position_size_gbp = float(
        decision_data.get("position_size_gbp", 0)
    )

    if price <= 0:
        raise ValueError(
            "Decision price must be greater than zero."
        )

    if position_size_gbp <= 0:
        raise ValueError(
            "Position size must be greater than zero."
        )

    quantity = round(
        position_size_gbp / price,
        8,
    )

    if quantity <= 0:
        raise ValueError(
            "Calculated quantity must be greater than zero."
        )

    return {
        "symbol": str(
            decision_data["symbol"]
        ).upper(),
        "side": "buy",
        "quantity": quantity,
        "price": price,
        "value_gbp": round(
            quantity * price,
            2,
        ),
        "stop_loss": decision_data.get(
            "stop_loss"
        ),
        "take_profit": decision_data.get(
            "take_profit"
        ),
        "confidence": decision_data.get(
            "confidence"
        ),
        "reason": "; ".join(
            decision_data.get("reasons", [])
        ),
    }
