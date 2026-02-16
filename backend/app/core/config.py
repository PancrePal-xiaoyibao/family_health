from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "Family Health Backend"
    db_url: str = "sqlite:///./family_health.db"
    secret_key: str = "change-this-in-production-please-use-32-plus-bytes"
    access_token_expire_minutes: int = 15
    refresh_token_expire_days: int = 7
    login_lock_max_attempts: int = 5
    login_lock_minutes: int = 15

    model_config = SettingsConfigDict(env_prefix="FH_", env_file=".env", extra="ignore")


settings = Settings()
