from fastapi import FastAPI

from analysis import analyze_market
from auto_trader import auto_trader
from config import settings
from market_data import get_btc_price
from paper_broker import PaperBroker
from portfolio import get_portfolio_summary
from risk_engine import RiskEngine
from strategy import DemoStrategy
from supabase_client import SupabaseLogger

app = FastAPI(title=settings.app_name)

broker = PaperBroker(settings.starting_balance_gbp)
risk_engine = RiskEngine(
    max_trade_size_gbp=settings.max_trade_size_gbp,
    max_daily_loss_gbp=settings.max_daily_loss_gbp,
)
strategy = DemoStrategy()
logger = SupabaseLogger(settings.supabase_url, settings.supabase_service_key)


@app.get("/")
def root():
    return {
        "name": settings.app_name,
        "environment": settings.environment,
        "paper_trading": settings.paper_trading,
        "status": "online",
    }


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "paper_trading": settings.paper_trading,
        "cash_gbp": broker.cash_gbp,
        "trades": len(broker.trades),
    }


@app.get("/portfolio")
def portfolio():
    return get_portfolio_summary()


@app.get("/market/btc")
def market_btc():
    return {
        "symbol": "BTC-GBP",
        "price": get_btc_price(),
    }


@app.get("/analysis/{symbol}")
def analysis(symbol: str):
    return analyze_market(symbol.upper())


@app.post("/autotrader/start")
async def start_auto_trader():
    return await auto_trader.start(run_paper_once)


@app.post("/autotrader/stop")
async def stop_auto_trader():
    return await auto_trader.stop()


@app.get("/autotrader/status")
def auto_trader_status():
    return auto_trader.status()


@app.post("/paper/run-once")
async def run_paper_once():
    signal = strategy.evaluate()
    trade_value = signal.quantity * signal.price
    decision = risk_engine.check_trade(trade_value)

    signal_dict = signal.__dict__

    if not decision.allowed:
        await logger.log_ai_signal(signal_dict, executed=False)
        return {
            "executed": False,
            "reason": decision.reason,
            "signal": signal_dict,
        }

    trade = broker.execute_trade(
        symbol=signal.symbol,
        side=signal.side,
        quantity=signal.quantity,
        price=signal.price,
        reason=signal.reason,
    )

    await logger.log_ai_signal(signal_dict, executed=True)
    await logger.log_paper_trade(trade.__dict__, broker.cash_gbp)

    snapshot = get_portfolio_summary()
    await logger.log_portfolio_snapshot(snapshot)

    return {
        "executed": True,
        "signal": signal_dict,
        "trade": trade.__dict__,
        "cash_gbp": broker.cash_gbp,
    }

