"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List
import os


class Settings(BaseSettings):
    """Application settings"""
    
    # Project
    PROJECT_NAME: str = "AI Test Case Generator"
    VERSION: str = "0.1.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "dev-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:8000",
        "http://127.0.0.1:3000"
    ]
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+asyncpg://testgen:testgen_dev_password@localhost:5432/testgen_db"
    )
    DATABASE_ECHO: bool = False
    
    # Redis
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    REDIS_CACHE_TTL: int = 300  # 5 minutes
    
    # Celery
    CELERY_BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
    CELERY_RESULT_BACKEND: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
    
    # Qdrant Vector DB
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "localhost")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    QDRANT_COLLECTION_NAME: str = "test_cases"
    QDRANT_VECTOR_SIZE: int = 1536  # OpenAI ada-002 default
    
    # Jira
    JIRA_OAUTH_CLIENT_ID: str = os.getenv("JIRA_OAUTH_CLIENT_ID", "")
    JIRA_OAUTH_CLIENT_SECRET: str = os.getenv("JIRA_OAUTH_CLIENT_SECRET", "")
    JIRA_OAUTH_REDIRECT_URI: str = "http://localhost:8000/api/v1/jira/callback"
    JIRA_API_VERSION: str = "3"
    
    # System LLM Keys (Optional fallback)
    SYSTEM_OPENAI_API_KEY: str = os.getenv("SYSTEM_OPENAI_API_KEY", "")
    SYSTEM_ANTHROPIC_API_KEY: str = os.getenv("SYSTEM_ANTHROPIC_API_KEY", "")
    SYSTEM_GOOGLE_API_KEY: str = os.getenv("SYSTEM_GOOGLE_API_KEY", "")
    
    # LiteLLM Settings
    LITELLM_CACHE_ENABLED: bool = True
    LITELLM_CACHE_TTL: int = 3600  # 1 hour
    LITELLM_MAX_RETRIES: int = 3
    LITELLM_TIMEOUT: int = 60  # seconds
    
    # AI Generation Defaults
    DEFAULT_AI_PROVIDER: str = "openai"
    DEFAULT_AI_MODEL: str = "gpt-4-turbo"
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_MAX_TOKENS: int = 2000
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 100
    
    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 10
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()
