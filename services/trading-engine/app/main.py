from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.paper import PaperExecutor
from app.risk import RiskEngine

app = FastAPI(title="CryptoNinja Trading Engine", version="0.1.0")

risk_engine = RiskEngine(
    max_trade_risk_percent=settings.max_trade_risk_percent,
    max_daily_loss_percent=settings.max_daily_loss_percent,
)
paper_executor = PaperExecutor()


class PaperOrderRequest(BaseModel):
    symbol: str = Field(min_length=3, examples=["BTC-GBP"])
    side: str = Field(pattern="^(buy|sell)$")
    quantity: float = Field(gt=0)
    price: float = Field(gt=0)
    portfolio_value: float = Field(gt=0, default=10_000)
    daily_pnl: float = 0


@app.get("/health")
def health() -> dict[str, str | bool]:
    return {
        "status": "ok",
        "environment": settings.environment,
        "paper_trading": settings.paper_trading,
    }


@app.post("/paper/order")
def create_paper_order(payload: PaperOrderRequest):
    proposed_value = payload.quantity * payload.price
    decision = risk_engine.evaluate_trade(
        portfolio_value=payload.portfolio_value,
        proposed_position_value=proposed_value,
        daily_pnl=payload.daily_pnl,
    )

    if not decision.allowed:
        raise HTTPException(status_code=400, detail=decision.reason)

    try:
        order = paper_executor.create_order(
            symbol=payload.symbol,
            side=payload.side,
            quantity=payload.quantity,
            price=payload.price,
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"order": order, "risk": decision}
