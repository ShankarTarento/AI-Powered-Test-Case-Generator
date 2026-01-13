"""Knowledge base models for uploaded historical test cases"""
from __future__ import annotations

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    Integer,
    BigInteger,
    JSON,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class KnowledgeBatchStatus(str, enum.Enum):
    """Processing status for a knowledge batch"""

    PENDING = "pending"
    UPLOAD_PENDING = "upload_pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DELETED = "deleted"


class KnowledgeEntryStatus(str, enum.Enum):
    """Lifecycle status for a normalized knowledge entry"""

    ACTIVE = "active"
    DISCARDED = "discarded"
    DELETED = "deleted"


class KnowledgeBatch(Base):
    """Represents a single uploaded historical test case file"""

    __tablename__ = "knowledge_batches"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    project_id = Column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    file_name = Column(String(255), nullable=False)
    file_type = Column(String(32), nullable=False)  # csv, xlsx, etc.
    file_size_bytes = Column(BigInteger, nullable=True)
    original_file_uri = Column(String(1024), nullable=False)
    normalized_file_uri = Column(String(1024), nullable=True)

    status = Column(String(32), default=KnowledgeBatchStatus.PENDING.value, nullable=False)
    row_count = Column(Integer, default=0, nullable=False)
    processed_count = Column(Integer, default=0, nullable=False)
    error_count = Column(Integer, default=0, nullable=False)
    error_details = Column(JSON, nullable=True)
    column_mapping = Column(JSON, nullable=True)  # stores detected headers -> schema mapping

    checksum = Column(String(256), nullable=True)
    started_at = Column(DateTime(timezone=True), nullable=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    organization = relationship("Organization", back_populates="knowledge_batches")
    project = relationship("Project", back_populates="knowledge_batches")
    uploader = relationship("User")
    entries = relationship(
        "KnowledgeEntry", back_populates="batch", cascade="all, delete-orphan", passive_deletes=True
    )

    def __repr__(self) -> str:  # pragma: no cover - repr helper
        return f"<KnowledgeBatch {self.id} status={self.status}>"


class KnowledgeEntry(Base):
    """Normalized historical test case row mapped to a Jira story/epic"""

    __tablename__ = "knowledge_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    batch_id = Column(
        UUID(as_uuid=True), ForeignKey("knowledge_batches.id", ondelete="CASCADE"), nullable=False
    )
    organization_id = Column(
        UUID(as_uuid=True), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False
    )
    project_id = Column(
        UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    user_story_id = Column(
        UUID(as_uuid=True), ForeignKey("user_stories.id", ondelete="SET NULL"), nullable=True
    )

    jira_key = Column(String(64), index=True, nullable=True)
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=True)
    steps = Column(JSON, nullable=True)
    expected_result = Column(Text, nullable=True)
    priority = Column(String(32), nullable=True)
    test_type = Column(String(64), nullable=True)
    tags = Column(JSON, nullable=True)

    source_row_number = Column(Integer, nullable=True)
    source_row_hash = Column(String(128), nullable=True, index=True)
    raw_payload = Column(JSON, nullable=True)

    qdrant_point_id = Column(String(64), nullable=True)
    embedding_model = Column(String(128), nullable=True)

    status = Column(String(32), default=KnowledgeEntryStatus.ACTIVE.value, nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    batch = relationship("KnowledgeBatch", back_populates="entries")
    project = relationship("Project", back_populates="knowledge_entries")
    organization = relationship("Organization", back_populates="knowledge_entries")
    user_story = relationship("UserStory", back_populates="knowledge_entries")

    __table_args__ = (
        Index("ix_knowledge_entries_project_story", "project_id", "user_story_id"),
        Index("ix_knowledge_entries_project_jira", "project_id", "jira_key"),
    )

    def __repr__(self) -> str:  # pragma: no cover - repr helper
        return f"<KnowledgeEntry {self.id} jira={self.jira_key}>"
