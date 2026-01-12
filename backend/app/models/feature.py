"""
User Story Model (Epics and User Stories from Jira)
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class JiraType(str, enum.Enum):
    """Jira issue type"""
    EPIC = "epic"
    STORY = "story"
    BUG = "bug"
    TASK = "task"

class UserStory(Base):
    """User Story model - can be an Epic (with children) or a Story (optionally linked to Epic)"""
    
    __tablename__ = "user_stories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    # Parent Epic (null for Epics or standalone stories)
    epic_id = Column(UUID(as_uuid=True), ForeignKey("user_stories.id", ondelete="SET NULL"), nullable=True)
    
    name = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    
    # Jira Metadata
    jira_key = Column(String(50), nullable=True, unique=True, index=True)  # e.g., KB-11643
    jira_type = Column(String(20), default=JiraType.STORY.value, nullable=False)
    jira_status = Column(String(50), nullable=True)
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="user_stories")
    test_cases = relationship("TestCase", back_populates="user_story", cascade="all, delete-orphan")
    
    # Self-referential for Epic -> Stories
    children = relationship("UserStory", back_populates="parent_epic", foreign_keys=[epic_id])
    parent_epic = relationship("UserStory", remote_side=[id], back_populates="children", foreign_keys=[epic_id])
    
    @property
    def is_epic(self) -> bool:
        return self.jira_type == JiraType.EPIC.value
    
    def __repr__(self):
        return f"<UserStory {self.jira_key}: {self.name}>"

# Alias for backward compatibility during migration
Feature = UserStory

