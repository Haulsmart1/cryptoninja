from dataclasses import dataclass
from datetime import datetime, timezone
from math import isfinite
from uuid import uuid4


@dataclass
class PaperTrade:
    id: str
    symbol: str
    side: str
    quantity: float
    price: float
    value_gbp: float
    status: str
    reason: str
    created_at: str


class PaperBroker:
    def __init__(
        self,
        starting_balance_gbp: float,
        max_trade_size_gbp: float = 1,
    ):
        if not isfinite(starting_balance_gbp) or not 0 < starting_balance_gbp <= 10:
            raise ValueError("Paper bankroll must be greater than £0 and no more than £10.")
        if not isfinite(max_trade_size_gbp) or not 0 < max_trade_size_gbp <= 1:
            raise ValueError("Paper order cap must be greater than £0 and no more than £1.")

        self.cash_gbp = starting_balance_gbp
        self.max_trade_size_gbp = max_trade_size_gbp
        self.positions: dict[str, float] = {}
        self.trades: list[PaperTrade] = []

    def execute_trade(
        self,
        symbol: str,
        side: str,
        quantity: float,
        price: float,
        reason: str,
    ) -> PaperTrade:
        normalised_symbol = symbol.strip().upper()
        normalised_side = side.strip().lower()

        if not normalised_symbol:
            raise ValueError("Paper trade symbol is required.")
        if normalised_side not in {"buy", "sell"}:
            raise ValueError("Paper trade side must be buy or sell.")
        if not isfinite(quantity) or quantity <= 0:
            raise ValueError("Paper trade quantity must be a positive finite number.")
        if not isfinite(price) or price <= 0:
            raise ValueError("Paper trade price must be a positive finite number.")

        value_gbp = quantity * price
        if not isfinite(value_gbp) or value_gbp > self.max_trade_size_gbp:
            raise ValueError("Paper trade exceeds the £1 simulated order cap.")

        if normalised_side == "buy":
            if value_gbp > self.cash_gbp:
                raise ValueError("Paper trade exceeds available virtual cash.")
        else:
            owned_quantity = self.positions.get(normalised_symbol, 0)
            if quantity > owned_quantity:
                raise ValueError("Paper sell exceeds the owned virtual position.")

        trade = PaperTrade(
            id=str(uuid4()),
            symbol=normalised_symbol,
            side=normalised_side,
            quantity=quantity,
            price=price,
            value_gbp=value_gbp,
            status="filled_paper",
            reason=reason,
            created_at=datetime.now(timezone.utc).isoformat(),
        )

        if normalised_side == "buy":
            self.cash_gbp -= value_gbp
            self.positions[normalised_symbol] = (
                self.positions.get(normalised_symbol, 0) + quantity
            )
        else:
            self.cash_gbp += value_gbp
            remaining = self.positions[normalised_symbol] - quantity
            if remaining:
                self.positions[normalised_symbol] = remaining
            else:
                del self.positions[normalised_symbol]

        self.trades.append(trade)
        return trade
