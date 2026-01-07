import os
from pydantic_settings import BaseSettings
import urllib.parse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    PORT: int = int(os.getenv("PORT", 4000))
    # Database connection details
    DB_HOST: str = os.getenv("DB_HOST", "localhost")
    DB_PORT: int = int(os.getenv("DB_PORT", 3306))
    DB_USER: str = os.getenv("DB_USER", "root")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "password")
    DB_NAME: str = os.getenv("DB_NAME", "auth_db")
    # JWT settings
    JWT_ACCESS_SECRET: str = os.getenv("JWT_ACCESS_SECRET", "your_access_secret_key_here")
    JWT_REFRESH_SECRET: str = os.getenv("JWT_REFRESH_SECRET", "your_refresh_secret_key_here")
    JWT_ACCESS_EXPIRES_IN: str = os.getenv("JWT_ACCESS_EXPIRES_IN", "15m")
    JWT_REFRESH_EXPIRES_IN: str = os.getenv("JWT_REFRESH_EXPIRES_IN", "7d")
    
    @property
    def database_url(self) -> str:
        # URL encode the password to handle special characters
        encoded_password = urllib.parse.quote(self.DB_PASSWORD)
        return f"mysql+mysql-connector://{self.DB_USER}:{encoded_password}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
