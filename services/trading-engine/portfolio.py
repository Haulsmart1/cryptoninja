from market_data import get_btc_price


def get_portfolio_summary():
    price = get_btc_price()

    quantity = 0.001
    avg_entry = 50000.0
    starting_balance = 10000.0
    cash = 9950.0

    invested = quantity * avg_entry
    market_value = quantity * price
    unrealized = market_value - invested
    portfolio_value = cash + market_value

    return {
        "cash": round(cash, 2),
        "invested": round(invested, 2),
        "market_value": round(market_value, 2),
        "portfolio_value": round(portfolio_value, 2),
        "unrealized_pnl": round(unrealized, 2),
        "return_percent": round(((portfolio_value - starting_balance) / starting_balance) * 100, 4),
        "btc_price": round(price, 2),
    }
