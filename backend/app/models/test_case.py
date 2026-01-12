"""
Test Case Model
"""
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base

class TestPriority(str, enum.Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class TestStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    PASSED = "passed"
    FAILED = "failed"
    SKIPPED = "skipped"

class TestCase(Base):
    """Test Case generated from features"""
    
    __tablename__ = "test_cases"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    user_story_id = Column(UUID(as_uuid=True), ForeignKey("user_stories.id", ondelete="CASCADE"), nullable=False)
    # Alias for backward compatibility
    feature_id = None  # Removed, use user_story_id
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    steps = Column(JSON, nullable=True)  # List of {step_number, action, expected_result}
    expected_result = Column(Text, nullable=True)  # Overall expected result
    
    priority = Column(String(20), default=TestPriority.MEDIUM.value, nullable=False)
    test_type = Column(String(50), default="functional", nullable=False)
    status = Column(String(20), default=TestStatus.DRAFT.value, nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
    # Relationships
    user_story = relationship("UserStory", back_populates="test_cases")
    feature = property(lambda self: self.user_story)  # Alias for backward compatibility
    creator = relationship("User", foreign_keys=[created_by])
    
    def __repr__(self):
        return f"<TestCase {self.title}>"
