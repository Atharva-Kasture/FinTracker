from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./finance_tracker.db"
    secret_key: str = "super_secret_key_change_this_in_production"
    claude_api_key: str = "your_key_here"
    
    class Config:
        env_file = ".env"

settings = Settings()