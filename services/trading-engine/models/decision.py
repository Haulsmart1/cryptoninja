from dataclasses import asdict, dataclass
from typing import Optional


@dataclass(frozen=True, slots=True)
class TradingDecision:
    symbol: str
    action: str
    confidence: float
    market_regime: str
    trend: str
    momentum: str
    price: float
    sma20: float
    risk_score: int
    position_size_gbp: float
    stop_loss: Optional[float]
    take_profit: Optional[float]
    reasons: tuple[str, ...]

    def to_dict(self) -> dict:
        data = asdict(self)
        data["reasons"] = list(self.reasons)
        return data
