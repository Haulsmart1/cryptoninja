import unittest

from pydantic import ValidationError

from config import Settings
from paper_broker import PaperBroker


class PaperOnlyContractTests(unittest.TestCase):
    def test_review_defaults_are_ten_pound_paper_bankroll(self):
        settings = Settings(_env_file=None)

        self.assertTrue(settings.paper_trading)
        self.assertEqual(settings.starting_balance_gbp, 10)
        self.assertEqual(settings.max_trade_size_gbp, 1)
        self.assertEqual(settings.max_daily_loss_gbp, 1)

    def test_non_paper_mode_is_rejected_at_startup(self):
        with self.assertRaises(ValidationError):
            Settings(paper_trading=False, _env_file=None)

    def test_bankroll_over_ten_pounds_is_rejected_at_startup(self):
        with self.assertRaises(ValidationError):
            Settings(starting_balance_gbp=10.01, _env_file=None)

    def test_one_pound_simulation_is_explicitly_paper(self):
        broker = PaperBroker(starting_balance_gbp=10)

        trade = broker.execute_trade(
            symbol="BTC-GBP",
            side="buy",
            quantity=0.00002,
            price=50_000,
            reason="Deterministic review simulation.",
        )

        self.assertEqual(trade.status, "filled_paper")
        self.assertEqual(trade.value_gbp, 1)
        self.assertEqual(broker.cash_gbp, 9)


if __name__ == "__main__":
    unittest.main()
