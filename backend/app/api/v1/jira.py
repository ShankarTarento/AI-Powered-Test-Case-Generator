"""
Jira Integration API Routes
"""
from fastapi import APIRouter

router = APIRouter()


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


@router.post("/sync")
async def sync_jira():
    """Manually trigger Jira sync"""
    return {"message": "Sync Jira - TODO"}
