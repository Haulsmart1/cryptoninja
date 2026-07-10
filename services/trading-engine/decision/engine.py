from collections.abc import Callable
from typing import Any

from analysis import analyze_market
from models.decision import TradingDecision
from risk.sizing import (
    calculate_position_size,
    calculate_protective_levels,
    calculate_risk_score,
)


Analyzer = Callable[[str], dict[str, Any]]


class DecisionEngine:
    def __init__(
        self,
        analyzer: Analyzer = analyze_market,
        starting_balance_gbp: float = 10_000.0,
        max_position_percent: float = 2.5,
        stop_loss_percent: float = 2.0,
        take_profit_percent: float = 4.0,
    ) -> None:
        self.analyzer = analyzer
        self.starting_balance_gbp = starting_balance_gbp
        self.max_position_percent = max_position_percent
        self.stop_loss_percent = stop_loss_percent
        self.take_profit_percent = take_profit_percent

    @staticmethod
    def _number(
        value: Any,
        default: float = 0.0,
    ) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _classify_market_regime(
        trend: str,
        momentum: str,
        price: float,
        sma20: float,
    ) -> str:
        distance_percent = 0.0

        if sma20 > 0:
            distance_percent = (
                abs(price - sma20) / sma20 * 100
            )

        if distance_percent >= 3:
            return "High Volatility"

        normalized_trend = trend.lower()
        normalized_momentum = momentum.lower()

        if (
            normalized_trend == "bullish"
            and normalized_momentum == "strong"
        ):
            return "Bull"

        if (
            normalized_trend == "bearish"
            and normalized_momentum == "strong"
        ):
            return "Bear"

        return "Sideways"

    @staticmethod
    def _choose_action(
        trend: str,
        confidence: float,
        risk_score: int,
    ) -> str:
        if (
            trend == "Bullish"
            and confidence >= 85
            and risk_score <= 50
        ):
            return "BUY"

        if trend == "Bearish" and confidence >= 75:
            return "SELL"

        return "HOLD"

    def make_decision_model(
        self,
        symbol: str,
    ) -> TradingDecision:
        normalized_symbol = symbol.upper()
        analysis = self.analyzer(normalized_symbol)

        price = self._number(analysis.get("price"))
        sma20 = self._number(analysis.get("sma20"))
        confidence = self._number(
            analysis.get("confidence"),
            50,
        )

        trend = str(
            analysis.get("trend", "Unknown")
        )

        momentum = str(
            analysis.get("momentum", "Unknown")
        )

        market_regime = self._classify_market_regime(
            trend=trend,
            momentum=momentum,
            price=price,
            sma20=sma20,
        )

        risk_score = calculate_risk_score(
            confidence=confidence,
            market_regime=market_regime,
            momentum=momentum,
        )

        action = self._choose_action(
            trend=trend,
            confidence=confidence,
            risk_score=risk_score,
        )

        position_size_gbp = 0.0

        if action == "BUY":
            position_size_gbp = calculate_position_size(
                starting_balance_gbp=self.starting_balance_gbp,
                max_position_percent=self.max_position_percent,
                confidence=confidence,
                risk_score=risk_score,
            )

        stop_loss, take_profit = (
            calculate_protective_levels(
                price=price,
                action=action,
                stop_loss_percent=self.stop_loss_percent,
                take_profit_percent=self.take_profit_percent,
            )
        )

        reasons = [
            str(
                analysis.get(
                    "reason",
                    "No analysis reason supplied.",
                )
            ),
            (
                "Market regime classified as "
                f"{market_regime}."
            ),
            (
                "Risk score calculated at "
                f"{risk_score}/100."
            ),
        ]

        if price > 0 and sma20 > 0:
            relation = (
                "above" if price >= sma20 else "below"
            )
            reasons.append(
                f"Price is {relation} SMA20."
            )

        return TradingDecision(
            symbol=normalized_symbol,
            action=action,
            confidence=round(confidence, 2),
            market_regime=market_regime,
            trend=trend,
            momentum=momentum,
            price=round(price, 2),
            sma20=round(sma20, 2),
            risk_score=risk_score,
            position_size_gbp=position_size_gbp,
            stop_loss=stop_loss,
            take_profit=take_profit,
            reasons=tuple(reasons),
        )

    def make_decision(self, symbol: str) -> dict:
        return self.make_decision_model(symbol).to_dict()


_default_engine = DecisionEngine()


def make_decision(symbol: str) -> dict:
    return _default_engine.make_decision(symbol)
