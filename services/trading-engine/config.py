from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "CryptoNinja Trading Engine"
    environment: str = "development"
    paper_trading: bool = True
    starting_balance_gbp: float = 10000
    max_trade_size_gbp: float = 100
    max_daily_loss_gbp: float = 250
    supabase_url: str = ""
    supabase_service_key: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
