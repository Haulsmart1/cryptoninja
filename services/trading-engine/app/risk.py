from dataclasses import dataclass


@dataclass(frozen=True)
class RiskDecision:
    allowed: bool
    reason: str
    max_position_value: float


class RiskEngine:
    def __init__(self, max_trade_risk_percent: float, max_daily_loss_percent: float) -> None:
        self.max_trade_risk_percent = max_trade_risk_percent
        self.max_daily_loss_percent = max_daily_loss_percent

    def evaluate_trade(
        self,
        portfolio_value: float,
        proposed_position_value: float,
        daily_pnl: float,
    ) -> RiskDecision:
        if portfolio_value <= 0:
            return RiskDecision(False, "Portfolio value must be positive.", 0)

        max_position_value = portfolio_value * (self.max_trade_risk_percent / 100)
        max_daily_loss = portfolio_value * (self.max_daily_loss_percent / 100)

        if abs(min(daily_pnl, 0)) >= max_daily_loss:
            return RiskDecision(False, "Daily loss limit reached.", max_position_value)

        if proposed_position_value > max_position_value:
            return RiskDecision(False, "Proposed trade exceeds max risk per trade.", max_position_value)

        return RiskDecision(True, "Trade allowed by risk rules.", max_position_value)
