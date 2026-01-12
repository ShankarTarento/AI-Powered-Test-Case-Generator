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
    """List all features for a project"""
    await deps.verify_project_access(project_id, current_user, db)
    
    query = select(Feature).where(Feature.project_id == project_id)
        
    result = await db.execute(query.order_by(desc(Feature.created_at)))
    features = result.scalars().all()
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
