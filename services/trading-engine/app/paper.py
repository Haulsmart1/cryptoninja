from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4


@dataclass(frozen=True)
class PaperOrder:
    id: str
    symbol: str
    side: str
    quantity: float
    price: float
    status: str
    created_at: str


class PaperExecutor:
    def create_order(self, symbol: str, side: str, quantity: float, price: float) -> PaperOrder:
        if side.lower() not in {"buy", "sell"}:
            raise ValueError("side must be 'buy' or 'sell'")

        if quantity <= 0 or price <= 0:
            raise ValueError("quantity and price must be positive")

        return PaperOrder(
            id=str(uuid4()),
            symbol=symbol.upper(),
            side=side.lower(),
            quantity=quantity,
            price=price,
            status="filled_paper",
            created_at=datetime.now(timezone.utc).isoformat(),
        )
