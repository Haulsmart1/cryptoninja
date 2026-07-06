import requests

COINBASE_URL = "https://api.exchange.coinbase.com/products/BTC-GBP/ticker"

def get_btc_price() -> float:
    response = requests.get(COINBASE_URL, timeout=10)
    response.raise_for_status()

    data = response.json()

    return float(data["price"])
