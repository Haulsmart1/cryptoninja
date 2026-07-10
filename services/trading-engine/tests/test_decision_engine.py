import unittest

from decision.engine import DecisionEngine


class DecisionEngineTests(unittest.TestCase):
    def test_bullish_analysis_produces_buy_decision(self):
        def analyzer(symbol: str) -> dict:
            return {
                "symbol": symbol,
                "confidence": 90,
                "trend": "Bullish",
                "momentum": "Strong",
                "price": 50_000,
                "sma20": 48_000,
                "reason": "Bullish test signal.",
            }

        engine = DecisionEngine(analyzer=analyzer)
        decision = engine.make_decision("btc-gbp")

        self.assertEqual(
            decision["symbol"],
            "BTC-GBP",
        )
        self.assertEqual(
            decision["action"],
            "BUY",
        )
        self.assertGreater(
            decision["position_size_gbp"],
            0,
        )
        self.assertIsNotNone(
            decision["stop_loss"],
        )
        self.assertIsNotNone(
            decision["take_profit"],
        )

    def test_uncertain_analysis_produces_hold_decision(self):
        def analyzer(symbol: str) -> dict:
            return {
                "symbol": symbol,
                "confidence": 55,
                "trend": "Neutral",
                "momentum": "Weak",
                "price": 50_000,
                "sma20": 50_100,
                "reason": "Uncertain test signal.",
            }

        engine = DecisionEngine(analyzer=analyzer)
        decision = engine.make_decision("BTC-GBP")

        self.assertEqual(
            decision["action"],
            "HOLD",
        )
        self.assertEqual(
            decision["position_size_gbp"],
            0,
        )
        self.assertIsNone(
            decision["stop_loss"],
        )
        self.assertIsNone(
            decision["take_profit"],
        )


if __name__ == "__main__":
    unittest.main()
