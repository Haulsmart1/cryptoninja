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


    def test_broker_rejects_bankroll_or_order_cap_above_review_limit(self):
        with self.assertRaises(ValueError):
            PaperBroker(starting_balance_gbp=10.01)
        with self.assertRaises(ValueError):
            PaperBroker(starting_balance_gbp=10, max_trade_size_gbp=1.01)

    def test_oversized_paper_order_fails_without_changing_ledger(self):
        broker = PaperBroker(starting_balance_gbp=10)

        with self.assertRaises(ValueError):
            broker.execute_trade(
                symbol="BTC-GBP",
                side="buy",
                quantity=0.00004,
                price=50_000,
                reason="Must exceed the paper order cap.",
            )

        self.assertEqual(broker.cash_gbp, 10)
        self.assertEqual(broker.positions, {})
        self.assertEqual(broker.trades, [])

    def test_paper_buy_cannot_overdraw_virtual_cash(self):
        broker = PaperBroker(starting_balance_gbp=0.50)

        with self.assertRaises(ValueError):
            broker.execute_trade(
                symbol="BTC-GBP",
                side="buy",
                quantity=0.00002,
                price=50_000,
                reason="Must exceed available virtual cash.",
            )

        self.assertEqual(broker.cash_gbp, 0.50)
        self.assertEqual(broker.trades, [])

    def test_invalid_paper_order_inputs_fail_without_recording_a_fill(self):
        broker = PaperBroker(starting_balance_gbp=10)

        invalid_orders = [
            {"symbol": "", "side": "buy", "quantity": 0.00002, "price": 50_000},
            {"symbol": "BTC-GBP", "side": "hold", "quantity": 0.00002, "price": 50_000},
            {"symbol": "BTC-GBP", "side": "buy", "quantity": 0, "price": 50_000},
            {"symbol": "BTC-GBP", "side": "buy", "quantity": 0.00002, "price": -1},
        ]

        for order in invalid_orders:
            with self.assertRaises(ValueError):
                broker.execute_trade(reason="Invalid paper input.", **order)

        self.assertEqual(broker.cash_gbp, 10)
        self.assertEqual(broker.positions, {})
        self.assertEqual(broker.trades, [])

    def test_paper_sell_requires_an_owned_virtual_position(self):
        broker = PaperBroker(starting_balance_gbp=10)

        with self.assertRaises(ValueError):
            broker.execute_trade(
                symbol="BTC-GBP",
                side="sell",
                quantity=0.00002,
                price=50_000,
                reason="Naked paper sell must fail.",
            )

        buy = broker.execute_trade(
            symbol="btc-gbp",
            side="BUY",
            quantity=0.00002,
            price=50_000,
            reason="Acquire a virtual position.",
        )
        sell = broker.execute_trade(
            symbol="BTC-GBP",
            side="sell",
            quantity=0.00002,
            price=50_000,
            reason="Close the owned virtual position.",
        )

        self.assertEqual(buy.status, "filled_paper")
        self.assertEqual(sell.status, "filled_paper")
        self.assertEqual(broker.cash_gbp, 10)
        self.assertEqual(broker.positions, {})
        self.assertEqual(len(broker.trades), 2)


if __name__ == "__main__":
    unittest.main()
