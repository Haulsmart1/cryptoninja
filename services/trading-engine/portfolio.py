from typing import Any

import httpx

from config import settings
from market_data import get_btc_price
from portfolio_service import PortfolioService


def _price_provider(symbol: str) -> float:
    if symbol.upper() == "BTC-GBP":
        return get_btc_price()

    raise ValueError(
        f"No live price provider configured for {symbol}."
    )


def _load_user_trades(user_id: str) -> list[dict[str, Any]]:
    if not user_id:
        raise ValueError("user_id is required.")

    if not settings.supabase_url or not settings.supabase_service_key:
        raise RuntimeError("Supabase is not configured.")

    headers = {
        "apikey": settings.supabase_service_key,
        "Authorization": (
            f"Bearer {settings.supabase_service_key}"
        ),
    }

    params = {
        "select": (
            "id,symbol,side,quantity,price,value_gbp,"
            "status,cash_gbp,created_at,user_id"
        ),
        "user_id": f"eq.{user_id}",
        "order": "created_at.asc",
    }

    with httpx.Client(timeout=10) as client:
        response = client.get(
            (
                f"{settings.supabase_url.rstrip('/')}"
                "/rest/v1/paper_trade_logs"
            ),
            headers=headers,
            params=params,
        )

    response.raise_for_status()

    data = response.json()

    return data if isinstance(data, list) else []


def get_portfolio_summary(user_id: str) -> dict:
    service = PortfolioService(
        starting_balance_gbp=settings.starting_balance_gbp,
        trade_loader=lambda: _load_user_trades(user_id),
        price_provider=_price_provider,
    )

    return service.get_summary()
