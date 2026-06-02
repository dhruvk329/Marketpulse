from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App config, loaded from the .env file (see .env.example)."""
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    
    DATABASE_URL: str = "sqlite:///./marketpulse.db"

    SECRET_KEY: str = "dev-secret-change-me"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # a week

    FINNHUB_API_KEY: str = ""
    NEWSAPI_KEY: str = ""
    ALPHA_VANTAGE_API_KEY: str = ""
    NEWS_PROVIDER_ORDER: str = "finnhub,newsapi,alphavantage"

    FRONTEND_ORIGIN: str = "http://localhost:5173"


settings = Settings()
