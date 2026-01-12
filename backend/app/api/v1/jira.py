from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from app.core.database import get_db
from app.api import dependencies as deps
from app.models.user import User
from app.services.jira_service import jira_service

router = APIRouter()


@router.post("/sync/{project_id}")
async def sync_project_features(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Sync features from Jira for a specific project.
    (Currently uses mock data)
    """
    await deps.verify_project_access(project_id, current_user, db)
    
    try:
        count = await jira_service.sync_project_features(project_id, db)
        return {"message": f"Successfully synced {count} new features from Jira", "count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/connect")
async def connect_jira():
    """Initiate Jira OAuth connection"""
    return {"message": "Jira connect endpoint - TODO"}


@router.get("/callback")
async def jira_callback():
    """Handle Jira OAuth callback"""
    return {"message": "Jira callback endpoint - TODO"}


@router.get("/projects")
async def get_projects():
    """Get connected Jira projects"""
    return {"message": "Get Jira projects - TODO"}
