from dataclasses import dataclass


@dataclass
class RiskDecision:
    allowed: bool
    reason: str


class RiskEngine:
    def __init__(self, max_trade_size_gbp: float, max_daily_loss_gbp: float):
        self.max_trade_size_gbp = max_trade_size_gbp
        self.max_daily_loss_gbp = max_daily_loss_gbp
        self.daily_loss_gbp = 0.0

    def check_trade(self, trade_value_gbp: float) -> RiskDecision:
        if trade_value_gbp <= 0:
            return RiskDecision(False, "Trade value must be greater than zero.")

        if trade_value_gbp > self.max_trade_size_gbp:
            return RiskDecision(False, "Trade exceeds maximum trade size.")

        if abs(self.daily_loss_gbp) >= self.max_daily_loss_gbp:
            return RiskDecision(False, "Daily loss limit reached.")

        return RiskDecision(True, "Trade allowed.")
