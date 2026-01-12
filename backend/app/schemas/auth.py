"""
Authentication Schemas
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class UserRoleEnum(str, Enum):
    """User roles for RBAC"""
    ADMIN = "admin"
    QA = "qa"


class UserBase(BaseModel):
    """Base user schema"""
    email: EmailStr
    full_name: Optional[str] = None


class UserRegister(UserBase):
    """Schema for user registration (Admin with Organization)"""
    password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)
    organization_name: str = Field(..., min_length=1, max_length=255)


class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str


class OrganizationResponse(BaseModel):
    """Schema for organization response"""
    id: UUID
    name: str
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class UserResponse(UserBase):
    """Schema for user response (public data)"""
    id: UUID
    role: str  # "admin" or "qa"
    is_active: bool
    is_verified: bool
    must_change_password: bool
    organization: Optional[OrganizationResponse] = None
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


class UserListResponse(BaseModel):
    """Schema for listing users (for admin)"""
    id: UUID
    email: str
    full_name: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    """Schema for JWT token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class TokenPayload(BaseModel):
    """Schema for JWT token payload"""
    sub: str  # User ID
    exp: int  # Expiration timestamp
    type: str  # "access" or "refresh"
    role: str  # User role


class RefreshTokenRequest(BaseModel):
    """Schema for refresh token request"""
    refresh_token: str


class PasswordChange(BaseModel):
    """Schema for password change"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=100)
    confirm_password: str = Field(..., min_length=8, max_length=100)


class UserRoleUpdate(BaseModel):
    """Schema for updating user role (admin only)"""
    role: UserRoleEnum


class InviteUserRequest(BaseModel):
    """Schema for inviting a QA user by email"""
    email: EmailStr
    full_name: Optional[str] = None
