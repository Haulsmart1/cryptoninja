from collections.abc import Callable

from fastapi import Depends, FastAPI

from analysis import analyze_market
from auth import require_user_id
from auto_trader import auto_traders
from config import settings
from decision_engine import make_decision
from market_data import get_btc_price
from paper_broker import PaperBroker
from portfolio import get_portfolio_summary
from risk_engine import RiskEngine
from supabase_client import SupabaseLogger

app = FastAPI(title=settings.app_name)

risk_engine = RiskEngine(
    max_trade_size_gbp=settings.max_trade_size_gbp,
    max_daily_loss_gbp=settings.max_daily_loss_gbp,
)

logger = SupabaseLogger(
    settings.supabase_url,
    settings.supabase_service_key,
)

brokers: dict[str, PaperBroker] = {}


def get_user_broker(user_id: str) -> PaperBroker:
    portfolio = get_portfolio_summary(user_id)

    broker = brokers.get(user_id)

    if broker is None:
        broker = PaperBroker(settings.starting_balance_gbp)
        brokers[user_id] = broker

    broker.cash_gbp = float(
        portfolio.get(
            "cash",
            settings.starting_balance_gbp,
        )
    )

    return broker


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
    }


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


@app.get("/portfolio")
def portfolio(
    user_id: str = Depends(require_user_id),
):
    return get_portfolio_summary(user_id)


async def execute_paper_decision(
    user_id: str,
    decision_data: dict,
) -> dict:
    trader = auto_traders.get(user_id)

    if trader.emergency_stop:
        return {
            "executed": False,
            "reason": "Emergency stop is active.",
        }

    if not settings.paper_trading:
        return {
            "executed": False,
            "reason": "Paper trading is disabled.",
        }

    action = str(
        decision_data.get("action", "HOLD")
    ).upper()

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
        }

    portfolio_before = get_portfolio_summary(user_id)
    available_cash = float(
        portfolio_before.get("cash", 0)
    )

    trade_value = min(
        position_size_gbp,
        available_cash,
        float(settings.max_trade_size_gbp),
    )

    if trade_value <= 0:
        return {
            "executed": False,
            "reason": "Insufficient paper cash.",
        }

    quantity = round(trade_value / price, 8)
    risk_decision = risk_engine.check_trade(trade_value)

    signal = {
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
            user_id,
            signal,
            executed=False,
        )

        return {
            "executed": False,
            "reason": risk_decision.reason,
        }

    broker = get_user_broker(user_id)

    trade = broker.execute_trade(
        symbol=signal["symbol"],
        side=signal["side"],
        quantity=signal["quantity"],
        price=signal["price"],
        reason=signal["reason"],
    )

    await logger.log_ai_signal(
        user_id,
        signal,
        executed=True,
    )

    await logger.log_paper_trade(
        user_id,
        trade.__dict__,
        broker.cash_gbp,
    )

    portfolio_after = get_portfolio_summary(user_id)

    await logger.log_portfolio_snapshot(
        user_id,
        portfolio_after,
    )

    return {
        "executed": True,
        "decision": decision_data,
        "trade": trade.__dict__,
        "cash_gbp": portfolio_after["cash"],
    }


@app.post("/paper/run-once")
async def run_paper_once(
    user_id: str = Depends(require_user_id),
):
    portfolio_before = get_portfolio_summary(user_id)

    await logger.log_portfolio_snapshot(
        user_id,
        portfolio_before,
    )

    decision_data = make_decision("BTC-GBP")

    return await execute_paper_decision(
        user_id,
        decision_data,
    )


@app.post("/autotrader/start")
async def start_auto_trader(
    user_id: str = Depends(require_user_id),
):
    trader = auto_traders.get(user_id)

    async def execute_for_user(decision_data: dict) -> dict:
        return await execute_paper_decision(
            user_id,
            decision_data,
        )

    return await trader.start(execute_for_user)


@app.post("/autotrader/stop")
async def stop_auto_trader(
    user_id: str = Depends(require_user_id),
):
    return await auto_traders.get(user_id).stop()


@app.post("/autotrader/emergency-stop")
def emergency_stop_auto_trader(
    user_id: str = Depends(require_user_id),
):
    return auto_traders.get(
        user_id
    ).trigger_emergency_stop()


@app.post("/autotrader/reset-emergency-stop")
def reset_emergency_stop(
    user_id: str = Depends(require_user_id),
):
    return auto_traders.get(
        user_id
    ).reset_emergency_stop()


@app.get("/autotrader/status")
def auto_trader_status(
    user_id: str = Depends(require_user_id),
):
    return auto_traders.get(user_id).status()
