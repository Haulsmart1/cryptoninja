from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    environment: str = "development"
    paper_trading: bool = True
    max_trade_risk_percent: float = 2.0
    max_daily_loss_percent: float = 3.0
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    coinbase_api_key: str = ""
    coinbase_api_secret: str = ""

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()
