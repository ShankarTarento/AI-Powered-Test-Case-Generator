from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
from app.models.feature import JiraType


class UserStoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=500)
    description: Optional[str] = None
    jira_key: Optional[str] = None
    jira_type: str = JiraType.STORY.value
    jira_status: Optional[str] = None

class UserStoryCreate(UserStoryBase):
    epic_id: Optional[uuid.UUID] = None

class UserStoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=500)
    description: Optional[str] = None
    epic_id: Optional[uuid.UUID] = None
    jira_key: Optional[str] = None
    jira_type: Optional[str] = None
    jira_status: Optional[str] = None

class UserStoryResponse(UserStoryBase):
    id: uuid.UUID
    project_id: uuid.UUID
    epic_id: Optional[uuid.UUID] = None
    synced_at: datetime
    created_at: datetime
    updated_at: datetime
    test_case_count: int = 0

    class Config:
        from_attributes = True

class UserStoryWithChildren(UserStoryResponse):
    """Epic with its child stories"""
    children: List[UserStoryResponse] = []

# Aliases for backward compatibility
FeatureBase = UserStoryBase
FeatureCreate = UserStoryCreate
FeatureUpdate = UserStoryUpdate
FeatureResponse = UserStoryResponse

