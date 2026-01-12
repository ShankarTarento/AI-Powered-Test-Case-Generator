"""
Database Migration Script
Run this to create initial database tables
"""
from sqlalchemy import create_engine
from app.core.config import settings
from app.core.database import Base
from app.models import User

# Import all models here to ensure they're registered
# Add more model imports as you create them


def init_db():
    """Initialize database - create all tables"""
    # Create sync engine for migrations
    sync_url = settings.DATABASE_URL.replace("+asyncpg", "")
    engine = create_engine(sync_url, echo=True)
    
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")


if __name__ == "__main__":
    init_db()
