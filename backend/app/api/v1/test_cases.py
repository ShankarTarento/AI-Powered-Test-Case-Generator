import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List
import uuid

from app.core.database import get_db
from app.api import dependencies as deps
from app.models import TestCase, Feature, User, TestStatus
from app.schemas.test_case import TestCaseCreate, TestCaseUpdate, TestCaseResponse
from app.services.ai_generator import AIGeneratorService

logger = logging.getLogger(__name__)

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
    """Generate test cases using AI with RAG support"""
    # Verify access to the project
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
        
    await deps.verify_project_access(feature.project_id, current_user, db)
    
    ai_service = AIGeneratorService(db)
    try:
        created_cases = await ai_service.generate_test_cases_for_story(
            story_id=feature_id,
            user_id=current_user.id
        )
        await db.commit()
        return created_cases
    except Exception as e:
        logger.error(f"Generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/epics/{epic_id}/bulk-generate-test-cases")
async def bulk_generate_test_cases_for_epic(
    epic_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Generate test cases for all child stories of an Epic"""
    # Verify the epic exists
    result = await db.execute(select(Feature).where(Feature.id == epic_id))
    epic = result.scalar_one_or_none()
    
    if not epic:
        raise HTTPException(status_code=404, detail="Epic not found")
        
    await deps.verify_project_access(epic.project_id, current_user, db)
    
    # Get all child stories of this epic
    result = await db.execute(
        select(Feature).where(Feature.epic_id == epic_id)
    )
    child_stories = result.scalars().all()
    
    if not child_stories:
        raise HTTPException(status_code=400, detail="No child stories found for this Epic")
    
    results = {
        "total_stories": len(child_stories),
        "stories_processed": 0,
        "test_cases_generated": 0,
        "stories": []
    }
    
    ai_service = AIGeneratorService(db)
    for story in child_stories:
        # Check if story already has test cases
        existing_result = await db.execute(
            select(TestCase).where(TestCase.user_story_id == story.id)
        )
        existing_cases = existing_result.scalars().all()
        
        if existing_cases:
            results["stories"].append({
                "id": str(story.id),
                "jira_key": story.jira_key,
                "name": story.name,
                "status": "skipped",
                "reason": f"Already has {len(existing_cases)} test cases"
            })
            continue
        
        try:
            # Generate real test cases for this story
            created_cases = await ai_service.generate_test_cases_for_story(
                story_id=story.id,
                user_id=current_user.id
            )
            
            results["stories_processed"] += 1
            results["test_cases_generated"] += len(created_cases)
            results["stories"].append({
                "id": str(story.id),
                "jira_key": story.jira_key,
                "name": story.name,
                "status": "generated",
                "test_cases_created": len(created_cases)
            })
        except Exception as e:
            logger.error(f"Failed to generate for story {story.jira_key}: {str(e)}")
            results["stories"].append({
                "id": str(story.id),
                "jira_key": story.jira_key,
                "name": story.name,
                "status": "failed",
                "reason": str(e)
            })
    
    await db.commit()
    return results
