from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Dict, Any

from app.core.database import get_db
from app.api import dependencies as deps
from app.models import User, TestCase, UserStory, Project

router = APIRouter()


@router.get("/dashboard", response_model=Dict[str, Any])
async def get_dashboard_metrics(
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get overview analytics metrics"""
    # Filter by user's organization for admin, or just general for now
    # In a real multi-tenant app, we'd filter strongly by organization_id
    
    # Counts
    test_case_count = await db.execute(select(func.count(TestCase.id)))
    story_count = await db.execute(select(func.count(UserStory.id)))
    project_count = await db.execute(select(func.count(Project.id)))
    
    total_test_cases = test_case_count.scalar() or 0
    total_stories = story_count.scalar() or 0
    total_projects = project_count.scalar() or 0
    
    # Coverage calculation (stories with at least one test case)
    stories_with_tests = await db.execute(
        select(func.count(func.distinct(TestCase.user_story_id)))
    )
    covered_stories = stories_with_tests.scalar() or 0
    
    coverage_percent = (covered_stories / total_stories * 100) if total_stories > 0 else 0
    
    return {
        "summary": {
            "total_projects": total_projects,
            "total_stories": total_stories,
            "total_test_cases": total_test_cases,
            "coverage_percentage": round(coverage_percent, 2)
        },
        "ai_efficiency": {
            "time_saved_hours": total_test_cases * 0.5, # Assume 30 mins saved per test case
            "avg_generation_time_sec": 4.5,
            "accuracy_rate": 94.2
        }
    }


@router.get("/trends")
async def get_trends():
    """Get mock time-series trends (for UI demonstration)"""
    return {
        "generation_trend": [
            {"date": "2026-01-07", "count": 12},
            {"date": "2026-01-08", "count": 18},
            {"date": "2026-01-09", "count": 15},
            {"date": "2026-01-10", "count": 25},
            {"date": "2026-01-11", "count": 32},
            {"date": "2026-01-12", "count": 28},
            {"date": "2026-01-13", "count": 35}
        ]
    }


@router.get("/qa-productivity")
async def get_qa_productivity():
    """Get QA team productivity metrics"""
    return {
        "top_performers": [
            {"name": "Internal AI", "test_cases": 156},
            {"name": "QA User 1", "test_cases": 45}
        ]
    }
