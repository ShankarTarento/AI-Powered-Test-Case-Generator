import asyncio
import logging
import sys
import os
from sqlalchemy import select

# Add current directory to path
sys.path.append(os.getcwd())

from app.core.database import engine, Base, AsyncSessionLocal
from app.models.user import User, UserRole
from app.models.organization import Organization
from app.core.security import hash_password

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def init_data():
    logger.info("Creating initial data...")
    async with AsyncSessionLocal() as session:
        # Check if organization exists
        result = await session.execute(select(Organization).where(Organization.name == "Default Org"))
        org = result.scalar_one_or_none()
        
        if not org:
            logger.info("Creating default organization...")
            org = Organization(name="Default Org")
            session.add(org)
            await session.commit()
            await session.refresh(org)
        
        # Check if user exists
        result = await session.execute(select(User).where(User.email == "tarento@gmail.com"))
        user = result.scalar_one_or_none()
        
        if not user:
            logger.info("Creating default user...")
            user = User(
                email="tarento@gmail.com",
                hashed_password=hash_password("password"),
                full_name="Tarento User",
                role=UserRole.ADMIN,
                organization_id=org.id,
                is_active=True,
                is_verified=True
            )
            session.add(user)
            await session.commit()
            logger.info("Default user created: tarento@gmail.com / password")
        else:
            logger.info("Default user already exists.")

if __name__ == "__main__":
    asyncio.run(init_data())
