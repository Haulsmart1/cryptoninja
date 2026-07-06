from fastapi import FastAPI

from config import settings
from paper_broker import PaperBroker
from risk_engine import RiskEngine
from strategy import DemoStrategy

app = FastAPI(title=settings.app_name)

broker = PaperBroker(settings.starting_balance_gbp)
risk_engine = RiskEngine(
    max_trade_size_gbp=settings.max_trade_size_gbp,
    max_daily_loss_gbp=settings.max_daily_loss_gbp,
)
strategy = DemoStrategy()


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


@app.post("/paper/run-once")
def run_paper_once():
    signal = strategy.evaluate()
    trade_value = signal.quantity * signal.price
    decision = risk_engine.check_trade(trade_value)

    if not decision.allowed:
        return {
            "executed": False,
            "reason": decision.reason,
        }

    trade = broker.execute_trade(
        symbol=signal.symbol,
        side=signal.side,
        quantity=signal.quantity,
        price=signal.price,
        reason=signal.reason,
    )

    return {
        "executed": True,
        "trade": trade.__dict__,
        "cash_gbp": broker.cash_gbp,
    }
