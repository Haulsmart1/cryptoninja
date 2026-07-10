import unittest

from risk.sizing import (
    calculate_position_size,
    calculate_risk_score,
)


class RiskSizingTests(unittest.TestCase):
    def test_position_size_never_exceeds_configured_cap(self):
        size = calculate_position_size(
            starting_balance_gbp=10_000,
            max_position_percent=2.5,
            confidence=100,
            risk_score=0,
        )

        self.assertLessEqual(size, 250)

    def test_high_risk_reduces_position_size(self):
        low_risk_size = calculate_position_size(
            starting_balance_gbp=10_000,
            max_position_percent=2.5,
            confidence=90,
            risk_score=10,
        )

        high_risk_size = calculate_position_size(
            starting_balance_gbp=10_000,
            max_position_percent=2.5,
            confidence=90,
            risk_score=80,
        )

        self.assertLess(
            high_risk_size,
            low_risk_size,
        )

    def test_risk_score_stays_between_zero_and_one_hundred(self):
        score = calculate_risk_score(
            confidence=10,
            market_regime="High Volatility",
            momentum="Weak",
        )

        self.assertGreaterEqual(score, 0)
        self.assertLessEqual(score, 100)


if __name__ == "__main__":
    unittest.main()
