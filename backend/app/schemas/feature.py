from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid
from app.models.feature import JiraType


class FeatureBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    jira_key: Optional[str] = None
    jira_type: JiraType = JiraType.STORY
    jira_status: Optional[str] = None

class FeatureCreate(FeatureBase):
    pass

class FeatureUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    jira_key: Optional[str] = None
    jira_type: Optional[JiraType] = None
    jira_status: Optional[str] = None

class FeatureResponse(FeatureBase):
    id: uuid.UUID
    project_id: uuid.UUID
    synced_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
