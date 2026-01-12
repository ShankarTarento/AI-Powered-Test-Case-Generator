from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
import uuid

from app.core.database import get_db
from app.api import dependencies as deps
from app.models import TestCase, Feature, User, TestStatus
from app.schemas.test_case import TestCaseCreate, TestCaseUpdate, TestCaseResponse

router = APIRouter()

@router.get("/features/{feature_id}/test-cases", response_model=List[TestCaseResponse])
async def get_feature_test_cases(
    feature_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """List all test cases for a feature"""
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
        
    await deps.verify_project_access(feature.project_id, current_user, db)
    
    result = await db.execute(
        select(TestCase)
        .where(TestCase.feature_id == feature_id)
        .order_by(desc(TestCase.created_at))
    )
    test_cases = result.scalars().all()
    
    return test_cases

@router.post("/features/{feature_id}/test-cases", response_model=TestCaseResponse)
async def create_test_case(
    feature_id: uuid.UUID,
    test_case_in: TestCaseCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Create a new test case manually"""
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
        
    await deps.verify_project_access(feature.project_id, current_user, db)
    
    test_case = TestCase(
        **test_case_in.model_dump(),
        feature_id=feature_id,
        created_by=current_user.id
    )
    db.add(test_case)
    await db.commit()
    await db.refresh(test_case)
    return test_case

@router.put("/test-cases/{test_case_id}", response_model=TestCaseResponse)
async def update_test_case(
    test_case_id: uuid.UUID,
    test_case_in: TestCaseUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Update test case details"""
    result = await db.execute(select(TestCase).where(TestCase.id == test_case_id))
    test_case = result.scalar_one_or_none()
    
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
        
    result = await db.execute(select(Feature).where(Feature.id == test_case.feature_id))
    feature = result.scalar_one_or_none()
    
    await deps.verify_project_access(feature.project_id, current_user, db)
    
    for field, value in test_case_in.model_dump(exclude_unset=True).items():
        setattr(test_case, field, value)
        
    await db.commit()
    await db.refresh(test_case)
    return test_case

@router.delete("/test-cases/{test_case_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_test_case(
    test_case_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Delete a test case"""
    result = await db.execute(select(TestCase).where(TestCase.id == test_case_id))
    test_case = result.scalar_one_or_none()
    
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
        
    result = await db.execute(select(Feature).where(Feature.id == test_case.feature_id))
    feature = result.scalar_one_or_none()
    
    await deps.verify_project_access(feature.project_id, current_user, db)
    
    await db.delete(test_case)
    await db.commit()

@router.post("/features/{feature_id}/generate-test-cases", response_model=List[TestCaseResponse])
async def generate_ai_test_cases(
    feature_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Generate test cases using AI (Mock implementation for now)"""
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
        
    await deps.verify_project_access(feature.project_id, current_user, db)
    
    # Mock AI generation logic
    generated_test_cases = [
        {
            "title": f"Verify {feature.name} functionality",
            "description": f"Test the core functionality of {feature.name}",
            "steps": [
                {"step_number": 1, "action": "Navigate to feature page", "expected_result": "Page loads successfully"},
                {"step_number": 2, "action": "Perform action X", "expected_result": "Result Y occurs"}
            ],
            "expected_result": "Feature works as expected",
            "priority": "high",
            "test_type": "functional",
            "status": "draft"
        },
        {
            "title": f"Verify {feature.name} edge case",
            "description": "Test invalid input handling",
            "steps": [
                {"step_number": 1, "action": "Enter invalid data", "expected_result": "Validation error shown"}
            ],
            "expected_result": "System handles error gracefully",
            "priority": "medium",
            "test_type": "edge_case",
            "status": "draft"
        }
    ]
    
    created_cases = []
    for case_data in generated_test_cases:
        test_case = TestCase(
            **case_data,
            feature_id=feature_id,
            created_by=current_user.id
        )
        db.add(test_case)
        created_cases.append(test_case)
        
    await db.commit()
    for case in created_cases:
        await db.refresh(case)
        
    return created_cases
