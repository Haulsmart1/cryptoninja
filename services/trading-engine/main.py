from fastapi import FastAPI

from analysis import analyze_market
from auto_trader import auto_trader
from config import settings
from decision_engine import make_decision
from market_data import get_btc_price
from paper_broker import PaperBroker
from portfolio import get_portfolio_summary
from risk_engine import RiskEngine
from supabase_client import SupabaseLogger

app = FastAPI(title=settings.app_name)

broker = PaperBroker(settings.starting_balance_gbp)

risk_engine = RiskEngine(
    max_trade_size_gbp=settings.max_trade_size_gbp,
    max_daily_loss_gbp=settings.max_daily_loss_gbp,
)

logger = SupabaseLogger(
    settings.supabase_url,
    settings.supabase_service_key,
)


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


@app.get("/decision/{symbol}")
def decision(symbol: str):
    return make_decision(symbol.upper())


async def execute_paper_decision(decision_data: dict) -> dict:
    if auto_trader.emergency_stop:
        return {
            "executed": False,
            "reason": "Emergency stop is active.",
        }

    action = str(decision_data.get("action", "HOLD")).upper()

    if action != "BUY":
        return {
            "executed": False,
            "reason": f"{action} execution is not enabled yet.",
            "decision": decision_data,
        }

    price = float(decision_data.get("price", 0))
    position_size_gbp = float(
        decision_data.get("position_size_gbp", 0)
    )

    if price <= 0 or position_size_gbp <= 0:
        return {
            "executed": False,
            "reason": "Invalid price or position size.",
            "decision": decision_data,
        }

    quantity = round(position_size_gbp / price, 8)
    trade_value = quantity * price

    risk_decision = risk_engine.check_trade(trade_value)

    signal_dict = {
        "symbol": decision_data["symbol"],
        "side": "buy",
        "quantity": quantity,
        "price": price,
        "confidence": decision_data["confidence"],
        "reason": "; ".join(
            decision_data.get("reasons", [])
        ),
    }

    if not risk_decision.allowed:
        await logger.log_ai_signal(
            signal_dict,
            executed=False,
        )

        return {
            "executed": False,
            "reason": risk_decision.reason,
            "decision": decision_data,
        }

    trade = broker.execute_trade(
        symbol=signal_dict["symbol"],
        side=signal_dict["side"],
        quantity=signal_dict["quantity"],
        price=signal_dict["price"],
        reason=signal_dict["reason"],
    )

    await logger.log_ai_signal(
        signal_dict,
        executed=True,
    )

    await logger.log_paper_trade(
        trade.__dict__,
        broker.cash_gbp,
    )

    snapshot = get_portfolio_summary()

    await logger.log_portfolio_snapshot(snapshot)

    return {
        "executed": True,
        "decision": decision_data,
        "trade": trade.__dict__,
        "cash_gbp": broker.cash_gbp,
    }


@app.post("/paper/run-once")
async def run_paper_once():
    decision_data = make_decision("BTC-GBP")
    return await execute_paper_decision(decision_data)


@app.post("/autotrader/start")
async def start_auto_trader():
    return await auto_trader.start(
        execute_paper_decision
    )


@app.post("/autotrader/stop")
async def stop_auto_trader():
    return await auto_trader.stop()


@app.post("/autotrader/emergency-stop")
def emergency_stop_auto_trader():
    return auto_trader.trigger_emergency_stop()


@app.post("/autotrader/reset-emergency-stop")
def reset_emergency_stop():
    return auto_trader.reset_emergency_stop()


@app.get("/autotrader/status")
def auto_trader_status():
    return auto_trader.status()
