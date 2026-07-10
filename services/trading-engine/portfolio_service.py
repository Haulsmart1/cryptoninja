from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from typing import Any

import httpx


TradeLoader = Callable[[], list[dict[str, Any]]]
PriceProvider = Callable[[str], float]


@dataclass
class Position:
    symbol: str
    quantity: float = 0.0
    cost_basis_gbp: float = 0.0
    realised_pnl_gbp: float = 0.0

    @property
    def average_entry(self) -> float:
        if self.quantity <= 0:
            return 0.0

        return self.cost_basis_gbp / self.quantity


class PortfolioService:
    def __init__(
        self,
        starting_balance_gbp: float,
        trade_loader: TradeLoader,
        price_provider: PriceProvider,
    ) -> None:
        if starting_balance_gbp <= 0:
            raise ValueError(
                "Starting balance must be greater than zero."
            )

        self.starting_balance_gbp = float(
            starting_balance_gbp
        )
        self.trade_loader = trade_loader
        self.price_provider = price_provider

    def get_summary(self) -> dict[str, Any]:
        trades = sorted(
            self.trade_loader(),
            key=lambda trade: str(
                trade.get("created_at", "")
            ),
        )

        cash = self.starting_balance_gbp
        positions: dict[str, Position] = {}
        realised_pnl = 0.0

        for trade in trades:
            symbol = str(
                trade.get("symbol", "")
            ).upper()

            side = str(
                trade.get("side", "")
            ).lower()

            quantity = self._number(
                trade.get("quantity")
            )

            price = self._number(
                trade.get("price")
            )

            if (
                not symbol
                or quantity <= 0
                or price <= 0
            ):
                continue

            position = positions.setdefault(
                symbol,
                Position(symbol=symbol),
            )

            trade_value = quantity * price

            if side == "buy":
                cash -= trade_value
                position.quantity += quantity
                position.cost_basis_gbp += trade_value

            elif side == "sell":
                sell_quantity = min(
                    quantity,
                    position.quantity,
                )

                if sell_quantity <= 0:
                    continue

                average_entry = position.average_entry
                sale_value = sell_quantity * price
                removed_cost = (
                    sell_quantity * average_entry
                )

                cash += sale_value
                position.quantity -= sell_quantity
                position.cost_basis_gbp -= (
                    removed_cost
                )

                trade_pnl = (
                    sale_value - removed_cost
                )

                position.realised_pnl_gbp += (
                    trade_pnl
                )

                realised_pnl += trade_pnl

                if position.quantity <= 0.00000001:
                    position.quantity = 0.0
                    position.cost_basis_gbp = 0.0

        open_positions = []
        holdings_value = 0.0
        total_cost_basis = 0.0
        unrealised_pnl = 0.0

        for position in positions.values():
            if position.quantity <= 0:
                continue

            live_price = self._safe_price(
                position.symbol,
                position.average_entry,
            )

            market_value = (
                position.quantity * live_price
            )

            position_pnl = (
                market_value
                - position.cost_basis_gbp
            )

            holdings_value += market_value
            total_cost_basis += (
                position.cost_basis_gbp
            )
            unrealised_pnl += position_pnl

            open_positions.append(
                {
                    "symbol": position.symbol,
                    "quantity": round(
                        position.quantity,
                        8,
                    ),
                    "average_entry": round(
                        position.average_entry,
                        2,
                    ),
                    "live_price": round(
                        live_price,
                        2,
                    ),
                    "cost_basis_gbp": round(
                        position.cost_basis_gbp,
                        2,
                    ),
                    "market_value_gbp": round(
                        market_value,
                        2,
                    ),
                    "unrealised_pnl_gbp": round(
                        position_pnl,
                        2,
                    ),
                    "return_percent": round(
                        (
                            position_pnl
                            / position.cost_basis_gbp
                            * 100
                        )
                        if position.cost_basis_gbp > 0
                        else 0.0,
                        4,
                    ),
                }
            )

        portfolio_value = cash + holdings_value
        total_pnl = (
            portfolio_value
            - self.starting_balance_gbp
        )

        return {
            "cash": round(cash, 2),
            "invested": round(
                total_cost_basis,
                2,
            ),
            "market_value": round(
                holdings_value,
                2,
            ),
            "portfolio_value": round(
                portfolio_value,
                2,
            ),
            "realised_pnl": round(
                realised_pnl,
                2,
            ),
            "unrealised_pnl": round(
                unrealised_pnl,
                2,
            ),
            "unrealized_pnl": round(
                unrealised_pnl,
                2,
            ),
            "total_pnl": round(
                total_pnl,
                2,
            ),
            "return_percent": round(
                (
                    total_pnl
                    / self.starting_balance_gbp
                    * 100
                ),
                4,
            ),
            "open_positions": open_positions,
            "open_position_count": len(
                open_positions
            ),
            "trade_count": len(trades),
            "btc_price": round(
                self._safe_price(
                    "BTC-GBP",
                    0.0,
                ),
                2,
            ),
        }

    def _safe_price(
        self,
        symbol: str,
        fallback: float,
    ) -> float:
        try:
            price = float(
                self.price_provider(symbol)
            )

            if price > 0:
                return price
        except Exception:
            pass

        return float(fallback)

    @staticmethod
    def _number(
        value: Any,
        default: float = 0.0,
    ) -> float:
        try:
            return float(value)
        except (TypeError, ValueError):
            return default


class SupabaseTradeLoader:
    def __init__(
        self,
        supabase_url: str,
        service_key: str,
    ) -> None:
        self.supabase_url = (
            supabase_url.rstrip("/")
        )
        self.service_key = service_key

    def __call__(self) -> list[dict[str, Any]]:
        if (
            not self.supabase_url
            or not self.service_key
        ):
            return []

        headers = {
            "apikey": self.service_key,
            "Authorization": (
                f"Bearer {self.service_key}"
            ),
        }

        params = {
            "select": (
                "id,symbol,side,quantity,"
                "price,value_gbp,status,"
                "cash_gbp,created_at"
            ),
            "order": "created_at.asc",
        }

        with httpx.Client(timeout=10) as client:
            response = client.get(
                (
                    f"{self.supabase_url}"
                    "/rest/v1/paper_trade_logs"
                ),
                headers=headers,
                params=params,
            )

            response.raise_for_status()

            data = response.json()

            if not isinstance(data, list):
                return []

            return data
