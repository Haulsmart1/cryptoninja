from config import settings
from market_data import get_btc_price
from portfolio_service import (
    PortfolioService,
    SupabaseTradeLoader,
)


def _price_provider(symbol: str) -> float:
    normalized_symbol = symbol.upper()

    if normalized_symbol == "BTC-GBP":
        return get_btc_price()

    raise ValueError(
        f"No live price provider configured for {symbol}."
    )


_trade_loader = SupabaseTradeLoader(
    settings.supabase_url,
    settings.supabase_service_key,
)

_portfolio_service = PortfolioService(
    starting_balance_gbp=(
        settings.starting_balance_gbp
    ),
    trade_loader=_trade_loader,
    price_provider=_price_provider,
)


def get_portfolio_summary() -> dict:
    return _portfolio_service.get_summary()
