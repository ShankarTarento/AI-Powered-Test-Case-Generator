"""
ProjectMember Model - Junction table for User-Project assignments
"""
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class MemberRole(str, enum.Enum):
    """Role within a project"""
    MEMBER = "member"
    LEAD = "lead"


class ProjectMember(Base):
    """Junction table for QA users assigned to projects"""
    
    __tablename__ = "project_members"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    
    # Foreign keys
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    added_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Role within the project
    role = Column(String(20), default=MemberRole.MEMBER.value, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="members")
    user = relationship("User", back_populates="project_memberships", foreign_keys=[user_id])
    added_by_user = relationship("User", foreign_keys=[added_by])
    
    # Constraints
    __table_args__ = (
        UniqueConstraint('project_id', 'user_id', name='unique_project_member'),
    )
    
    def __repr__(self):
        return f"<ProjectMember project={self.project_id} user={self.user_id}>"
