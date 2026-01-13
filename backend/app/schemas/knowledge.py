"""Pydantic schemas for knowledge base resources"""
from __future__ import annotations

from datetime import datetime
from typing import Dict, List, Optional, Any
from uuid import UUID

from pydantic import BaseModel

from app.schemas.test_case import TestCaseStep


class KnowledgeBatchResponse(BaseModel):
    id: UUID
    organization_id: UUID
    project_id: UUID
    uploaded_by: Optional[UUID]
    file_name: str
    file_type: str
    file_size_bytes: Optional[int]
    original_file_uri: str
    normalized_file_uri: Optional[str]
    status: str
    row_count: int
    processed_count: int
    error_count: int
    error_details: Optional[Dict[str, Any]]
    column_mapping: Optional[Dict[str, Optional[str]]]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class KnowledgeEntryResponse(BaseModel):
    id: UUID
    batch_id: UUID
    organization_id: UUID
    project_id: UUID
    user_story_id: Optional[UUID]
    jira_key: Optional[str]
    title: str
    description: Optional[str]
    steps: Optional[List[TestCaseStep]]
    expected_result: Optional[str]
    priority: Optional[str]
    test_type: Optional[str]
    tags: Optional[List[str]]
    source_row_number: Optional[int]
    source_row_hash: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
