"""
Project Schemas
"""
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class MemberRoleEnum(str, Enum):
    """Role within a project"""
    MEMBER = "member"
    LEAD = "lead"


# Project Schemas
class ProjectBase(BaseModel):
    """Base project schema"""
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    jira_project_key: Optional[str] = Field(None, max_length=50)


class ProjectCreate(ProjectBase):
    """Schema for creating a project"""
    pass


class ProjectUpdate(BaseModel):
    """Schema for updating a project"""
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    jira_project_key: Optional[str] = Field(None, max_length=50)


class ProjectMemberInfo(BaseModel):
    """Brief user info for project members"""
    id: UUID
    email: str
    full_name: Optional[str] = None
    role: str  # member or lead
    added_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class ProjectResponse(ProjectBase):
    """Schema for project response"""
    id: UUID
    created_by: UUID
    created_at: datetime
    updated_at: datetime
    member_count: Optional[int] = None
    
    model_config = ConfigDict(from_attributes=True)


class ProjectDetailResponse(ProjectResponse):
    """Schema for detailed project response with members"""
    members: List[ProjectMemberInfo] = []


# Project Member Schemas
class ProjectMemberCreate(BaseModel):
    """Schema for adding a member to a project by user_id"""
    user_id: UUID
    role: MemberRoleEnum = MemberRoleEnum.MEMBER


class InviteMemberRequest(BaseModel):
    """Schema for inviting a member by email"""
    email: EmailStr
    full_name: Optional[str] = None


class ProjectMemberUpdate(BaseModel):
    """Schema for updating a member's role"""
    role: MemberRoleEnum


class ProjectMemberResponse(BaseModel):
    """Schema for project member response"""
    id: UUID
    project_id: UUID
    user_id: UUID
    role: str
    added_by: UUID
    created_at: datetime
    
    # Include user details
    user_email: Optional[str] = None
    user_full_name: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)
