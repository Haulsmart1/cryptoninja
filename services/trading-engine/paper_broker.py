from dataclasses import dataclass
from datetime import datetime, timezone
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
    def __init__(self, starting_balance_gbp: float):
        self.cash_gbp = starting_balance_gbp
        self.trades: list[PaperTrade] = []

    def execute_trade(
        self,
        symbol: str,
        side: str,
        quantity: float,
        price: float,
        reason: str,
    ) -> PaperTrade:
        value_gbp = quantity * price

        trade = PaperTrade(
            id=str(uuid4()),
            symbol=symbol,
            side=side,
            quantity=quantity,
            price=price,
            value_gbp=value_gbp,
            status="filled",
            reason=reason,
            created_at=datetime.now(timezone.utc).isoformat(),
        )

        if side.lower() == "buy":
            self.cash_gbp -= value_gbp
        elif side.lower() == "sell":
            self.cash_gbp += value_gbp

        self.trades.append(trade)
        return trade
