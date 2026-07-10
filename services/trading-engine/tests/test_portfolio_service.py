import unittest

from portfolio_service import PortfolioService


class PortfolioServiceTests(unittest.TestCase):
    def test_buy_trade_creates_position(self):
        trades = [
            {
                "symbol": "BTC-GBP",
                "side": "buy",
                "quantity": 0.001,
                "price": 50_000,
                "created_at": "2026-01-01T10:00:00Z",
            }
        ]

        service = PortfolioService(
            starting_balance_gbp=10_000,
            trade_loader=lambda: trades,
            price_provider=lambda symbol: 55_000,
        )

        summary = service.get_summary()

        self.assertEqual(
            summary["cash"],
            9_950,
        )

        self.assertEqual(
            summary["market_value"],
            55,
        )

        self.assertEqual(
            summary["portfolio_value"],
            10_005,
        )

        self.assertEqual(
            summary["unrealised_pnl"],
            5,
        )

        self.assertEqual(
            summary["open_position_count"],
            1,
        )

    def test_sell_trade_records_realised_profit(self):
        trades = [
            {
                "symbol": "BTC-GBP",
                "side": "buy",
                "quantity": 0.002,
                "price": 50_000,
                "created_at": "2026-01-01T10:00:00Z",
            },
            {
                "symbol": "BTC-GBP",
                "side": "sell",
                "quantity": 0.001,
                "price": 60_000,
                "created_at": "2026-01-01T11:00:00Z",
            },
        ]

        service = PortfolioService(
            starting_balance_gbp=10_000,
            trade_loader=lambda: trades,
            price_provider=lambda symbol: 55_000,
        )

        summary = service.get_summary()

        self.assertEqual(
            summary["realised_pnl"],
            10,
        )

        self.assertEqual(
            summary["cash"],
            9_960,
        )

        self.assertEqual(
            summary["invested"],
            50,
        )

        self.assertEqual(
            summary["market_value"],
            55,
        )

        self.assertEqual(
            summary["portfolio_value"],
            10_015,
        )

    def test_invalid_trades_are_ignored(self):
        trades = [
            {
                "symbol": "BTC-GBP",
                "side": "buy",
                "quantity": 0,
                "price": 50_000,
                "created_at": "2026-01-01T10:00:00Z",
            },
            {
                "symbol": "",
                "side": "buy",
                "quantity": 1,
                "price": 50_000,
                "created_at": "2026-01-01T11:00:00Z",
            },
        ]

        service = PortfolioService(
            starting_balance_gbp=10_000,
            trade_loader=lambda: trades,
            price_provider=lambda symbol: 55_000,
        )

        summary = service.get_summary()

        self.assertEqual(
            summary["portfolio_value"],
            10_000,
        )

        self.assertEqual(
            summary["open_position_count"],
            0,
        )


if __name__ == "__main__":
    unittest.main()
