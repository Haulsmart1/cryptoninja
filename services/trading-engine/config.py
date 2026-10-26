from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CryptoNinja Trading Engine"
    environment: str = "development"
    # This service is deliberately incapable of starting in a non-paper mode.
    paper_trading: Literal[True] = True
    # Review launch is a fixed £10 simulated bankroll, never customer money.
    starting_balance_gbp: float = Field(default=10, gt=0, le=10)
    max_trade_size_gbp: float = Field(default=1, gt=0, le=10)
    max_daily_loss_gbp: float = Field(default=1, gt=0, le=10)
    supabase_url: str = ""
    supabase_service_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
