import asyncio
import logging
import sys
import os

# Add current directory to path to ensure app package is found
sys.path.append(os.getcwd())

from app.core.database import engine, Base
# Import all models to ensure they are registered with Base metadata
from app.models import *

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_db():
    logger.info("Creating database tables...")
    try:
        async with engine.begin() as conn:
            # Create all tables defined in models
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables created successfully.")
    except Exception as e:
        logger.error(f"Error creating tables: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(init_db())
