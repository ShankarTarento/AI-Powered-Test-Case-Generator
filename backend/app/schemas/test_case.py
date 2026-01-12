from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid
from app.models.test_case import TestPriority, TestStatus

class TestCaseStep(BaseModel):
    step_number: int
    action: str
    expected_result: str

class TestCaseBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    steps: Optional[List[TestCaseStep]] = None
    expected_result: Optional[str] = None
    priority: TestPriority = TestPriority.MEDIUM
    test_type: str = "functional"
    status: TestStatus = TestStatus.DRAFT

class TestCaseCreate(TestCaseBase):
    pass

class TestCaseUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    steps: Optional[List[TestCaseStep]] = None
    expected_result: Optional[str] = None
    priority: Optional[TestPriority] = None
    test_type: Optional[str] = None
    status: Optional[TestStatus] = None

class TestCaseResponse(TestCaseBase):
    id: uuid.UUID
    feature_id: uuid.UUID
    created_by: Optional[uuid.UUID] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
