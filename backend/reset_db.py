import asyncio
import logging
import sys
import os
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

from app.core.database import engine, Base
# Import models to register them
from app.models import *

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def reset_db():
    logger.info("Resetting related tables...")
    async with engine.begin() as conn:
        logger.info("Dropping test_cases...")
        await conn.execute(text("DROP TABLE IF EXISTS test_cases CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS features CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS user_stories CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS sprints CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS project_members CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS projects CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS users CASCADE"))
        await conn.execute(text("DROP TABLE IF EXISTS organizations CASCADE"))
        logger.info("Dropping sprints...")
        await conn.execute(text("DROP TABLE IF EXISTS sprints CASCADE"))
        
        # Re-create all tables
        logger.info("Re-creating tables...")
        await conn.run_sync(Base.metadata.create_all)
        
    logger.info("Database reset successfully.")

if __name__ == "__main__":
    asyncio.run(reset_db())
