from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timedelta
import uuid

from app.core.database import get_db
from app.api import dependencies as deps
from app.models.user import User
from app.services.jira_service import jira_service

router = APIRouter()


@router.get("/connect")
async def connect_jira(
    current_user: User = Depends(deps.get_current_user)
):
    """
    Initiate Jira OAuth connection.
    Redirects to Atlassian Authorization URL.
    """
    # Use user_id as state to identify user in callback
    # In production, use a signed state or Redis to prevent CSRF/spoofing
    auth_url = jira_service.get_auth_url()
    # Replace the random state in service with user_id
    auth_url = auth_url.replace(auth_url.split("&state=")[1].split("&")[0], str(current_user.id))
    
    return {"url": auth_url}


@router.get("/status")
async def get_jira_status(
    current_user: User = Depends(deps.get_current_user)
):
    """Check if user is connected to Jira"""
    is_connected = bool(current_user.jira_access_token and current_user.jira_cloud_id)
    return {
        "is_connected": is_connected,
        "site_name": current_user.jira_site_name if is_connected else None
    }


@router.get("/callback")
async def jira_callback(
    code: str,
    state: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle Jira OAuth callback.
    Exchanges code for tokens and updates user.
    """
    try:
        # 1. Verify User (using state as user_id for MVP)
        user_result = await db.execute(select(User).where(User.id == uuid.UUID(state)))
        user = user_result.scalar_one_or_none()
        if not user:
            raise HTTPException(status_code=400, detail="Invalid state parameter")

        # 2. Exchange Code
        token_data = await jira_service.exchange_code_for_token(code)
        
        # 3. Get Accessible Resources (Cloud ID)
        resources = await jira_service.get_accessible_resources(token_data["access_token"])
        if not resources:
            raise HTTPException(status_code=400, detail="No Jira resources found")
        
        cloud_id = resources[0]["id"] # Take the first site
        site_name = resources[0].get("name", "Jira Cloud")  # Get site name

        # 4. Update User
        user.jira_access_token = token_data["access_token"]
        user.jira_refresh_token = token_data["refresh_token"]
        user.jira_cloud_id = cloud_id
        user.jira_site_name = site_name
        # Calculate expiry (usually 3600s)
        expires_in = token_data.get("expires_in", 3600)
        user.jira_token_expires_at = datetime.utcnow() + timedelta(seconds=expires_in)
        
        db.add(user)
        await db.commit()

        # 5. Redirect to Frontend
        # Assuming frontend is on localhost:3000
        return RedirectResponse(url="http://localhost:3000/dashboard?jira_connected=true")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sync/{project_id}")
async def sync_project_features(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Sync features from Jira for a specific project.
    """
    await deps.verify_project_access(project_id, current_user, db)
    
    try:
        count = await jira_service.sync_project_features(project_id, db, current_user)
        return {"message": f"Successfully synced {count} new features from Jira", "count": count}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/import/{project_id}")
async def import_by_jira_key(
    project_id: uuid.UUID,
    jira_key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """
    Import a specific Jira issue by key (e.g., KB-11643).
    Works for both Epics and User Stories.
    If importing an Epic, also imports its child stories.
    """
    await deps.verify_project_access(project_id, current_user, db)
    
    if not current_user.jira_access_token or not current_user.jira_cloud_id:
        raise HTTPException(status_code=400, detail="Jira not connected. Please connect your Jira account first.")
    
    try:
        result = await jira_service.import_issue_by_key(
            jira_key=jira_key,
            project_id=project_id,
            db=db,
            user=current_user
        )
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/projects")
async def get_projects(
    current_user: User = Depends(deps.get_current_user)
):
    """Get connected Jira projects"""
    # TODO: Implement listing of Jira projects if needed
    return {"message": "Get Jira projects - Not implemented yet"}
