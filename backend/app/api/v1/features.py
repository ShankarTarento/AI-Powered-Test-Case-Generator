from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Optional
import uuid

from app.core.database import get_db
from app.api import dependencies as deps
from app.models import Feature, Project, User
from app.schemas.feature import FeatureCreate, FeatureUpdate, FeatureResponse

router = APIRouter()

@router.get("/projects/{project_id}/features", response_model=List[FeatureResponse])
async def get_project_features(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """List all top-level features for a project (Epics and standalone stories, not child stories)"""
    await deps.verify_project_access(project_id, current_user, db)
    
    # Subquery to count test cases
    from sqlalchemy import select, func, desc
    from app.models import TestCase
    
    test_case_subquery = (
        select(func.count(TestCase.id))
        .where(TestCase.user_story_id == Feature.id)
        .scalar_subquery()
    )
    
    query = select(
        Feature,
        test_case_subquery.label("test_case_count")
    ).where(
        Feature.project_id == project_id,
        Feature.epic_id == None
    ).order_by(desc(Feature.created_at))
        
    result = await db.execute(query)
    
    features = []
    for feature, count in result.all():
        feature.test_case_count = count or 0
        features.append(feature)
        
    return features

@router.post("/projects/{project_id}/features", response_model=FeatureResponse)
async def create_feature(
    project_id: uuid.UUID,
    feature_in: FeatureCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Create a new feature (manually)"""
    await deps.verify_project_access(project_id, current_user, db)
    
    feature = Feature(
        **feature_in.model_dump(),
        project_id=project_id
    )
    db.add(feature)
    await db.commit()
    await db.refresh(feature)
    return feature

@router.put("/features/{feature_id}", response_model=FeatureResponse)
async def update_feature(
    feature_id: uuid.UUID,
    feature_in: FeatureUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Update feature details"""
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
        
    await deps.verify_project_access(feature.project_id, current_user, db)
    
    for field, value in feature_in.model_dump(exclude_unset=True).items():
        setattr(feature, field, value)
        
    await db.commit()
    await db.refresh(feature)
    return feature

@router.delete("/features/{feature_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_feature(
    feature_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    """Delete a feature"""
    result = await db.execute(select(Feature).where(Feature.id == feature_id))
    feature = result.scalar_one_or_none()
    
    if not feature:
        raise HTTPException(status_code=404, detail="Feature not found")
        
    await deps.verify_project_access(feature.project_id, current_user, db)
    
    await db.delete(feature)
    await db.commit()

@router.get("/stories/{story_id}")
async def get_story(
    story_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(deps.get_current_user)
):
    from sqlalchemy import select, func, desc
    from app.models import TestCase
    
    # Subquery to count test cases
    def get_count_subquery(feature_id_col):
        return select(func.count(TestCase.id)).where(TestCase.user_story_id == feature_id_col).scalar_subquery()

    result = await db.execute(
        select(Feature, get_count_subquery(Feature.id).label("count"))
        .where(Feature.id == story_id)
    )
    story_row = result.first()
    
    if not story_row:
        raise HTTPException(status_code=404, detail="Story not found")
        
    story, story_test_count = story_row
    await deps.verify_project_access(story.project_id, current_user, db)
    
    # Get children with their counts
    children_result = await db.execute(
        select(Feature, get_count_subquery(Feature.id).label("count"))
        .where(Feature.epic_id == story_id)
    )
    children_data = children_result.all()
    
    # Build response
    return {
        "id": str(story.id),
        "name": story.name,
        "description": story.description,
        "epic_id": str(story.epic_id) if story.epic_id else None,
        "jira_key": story.jira_key,
        "jira_type": story.jira_type,
        "jira_status": story.jira_status,
        "test_case_count": story_test_count or 0,
        "created_at": story.created_at.isoformat(),
        "children": [
            {
                "id": str(c.id),
                "name": c.name,
                "description": c.description,
                "jira_key": c.jira_key,
                "jira_type": c.jira_type,
                "jira_status": c.jira_status,
                "test_case_count": c_count or 0,
                "created_at": c.created_at.isoformat()
            }
            for c, c_count in children_data
        ]
    }

