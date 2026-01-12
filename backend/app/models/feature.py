"""
Feature Model
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

class Feature(Base):
    """Feature model synced from Jira (Epics/User Stories)"""
    
    __tablename__ = "features"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # Jira Metadata
    jira_key = Column(String(50), nullable=True, index=True)  # e.g., PROJ-123
    jira_type = Column(String(20), default=JiraType.STORY.value, nullable=False)
    jira_status = Column(String(50), nullable=True)
    synced_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    project = relationship("Project", back_populates="features")
    test_cases = relationship("TestCase", back_populates="feature", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Feature {self.jira_key}: {self.name}>"
