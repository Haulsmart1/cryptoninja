from dataclasses import dataclass


@dataclass
class StrategySignal:
    symbol: str
    side: str
    quantity: float
    price: float
    reason: str
    confidence: int


class DemoStrategy:
    def evaluate(self) -> StrategySignal:
        return StrategySignal(
            symbol="BTC-GBP",
            side="buy",
            quantity=0.001,
            price=50000,
            reason="Demo paper signal. Live trading disabled.",
            confidence=82,
        )
