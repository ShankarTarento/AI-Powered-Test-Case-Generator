"""
User Model with Role-Based Access Control
"""
from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class UserRole(str, enum.Enum):
    """User roles for RBAC"""
    ADMIN = "admin"
    QA = "qa"


class User(Base):
    """User model for authentication and profile management"""
    
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=True)
    
    # Organization (multi-tenancy)
    organization_id = Column(UUID(as_uuid=True), ForeignKey("organizations.id"), nullable=True)
    
    # Role for RBAC
    role = Column(String(20), default=UserRole.QA.value, nullable=False)
    
    # Account status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)
    is_superuser = Column(Boolean, default=False, nullable=False)
    must_change_password = Column(Boolean, default=False, nullable=False)
    
    # API Keys for LLM providers (encrypted)
    openai_api_key = Column(Text, nullable=True)
    anthropic_api_key = Column(Text, nullable=True)
    google_api_key = Column(Text, nullable=True)
    azure_api_key = Column(Text, nullable=True)
    
    # AI Preferences
    preferred_ai_provider = Column(String(50), nullable=True, default="openai")
    preferred_ai_model = Column(String(100), nullable=True)

    # Jira Integration
    jira_access_token = Column(Text, nullable=True)
    jira_refresh_token = Column(Text, nullable=True)
    jira_cloud_id = Column(String(255), nullable=True)
    jira_site_name = Column(String(255), nullable=True)  # Display name of connected Jira site
    jira_token_expires_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    organization = relationship("Organization", back_populates="users")
    created_projects = relationship("Project", back_populates="creator", foreign_keys="Project.created_by")
    project_memberships = relationship("ProjectMember", back_populates="user", foreign_keys="ProjectMember.user_id")
    
    @property
    def is_admin(self) -> bool:
        """Check if user has admin role"""
        return self.role == UserRole.ADMIN.value or self.is_superuser
    
    def __repr__(self):
        return f"<User {self.email} ({self.role})>"
