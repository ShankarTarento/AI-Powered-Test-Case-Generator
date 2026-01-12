import asyncio
import logging
import sys
import os
from sqlalchemy import select

# Add current directory to path
sys.path.append(os.getcwd())

from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.core.security import verify_password

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def verify_user_login():
    logger.info("Verifying user login...")
    async with AsyncSessionLocal() as session:
        # Check if user exists
        result = await session.execute(select(User).where(User.email == "tarento@gmail.com"))
        user = result.scalar_one_or_none()
        
        if not user:
            logger.error("User tarento@gmail.com NOT FOUND!")
            return

        logger.info(f"User found: {user.email}")
        logger.info(f"Stored Hash: {user.hashed_password}")
        
        is_valid = verify_password("password", user.hashed_password)
        if is_valid:
            logger.info("SUCCESS: Password 'password' matches stored hash.")
        else:
            logger.error("FAILURE: Password 'password' DOES NOT match stored hash.")

if __name__ == "__main__":
    asyncio.run(verify_user_login())
