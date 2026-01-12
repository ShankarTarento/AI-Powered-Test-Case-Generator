from typing import List, Dict, Any
import uuid
import random
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.feature import Feature, JiraType
from app.models.project import Project

class JiraService:
    def __init__(self):
        # In a real implementation, we would initialize the Jira client here
        pass

    async def connect(self):
        """Mock connection"""
        return True

    async def sync_project_features(self, project_id: uuid.UUID, db: AsyncSession) -> int:
        """
        Mock sync of features from Jira.
        Generates realistic Epics and User Stories.
        """
        # Verify project exists
        project_result = await db.execute(select(Project).where(Project.id == project_id))
        project = project_result.scalar_one_or_none()
        if not project:
            raise ValueError("Project not found")

        # Mock Data Generation
        mock_features = [
            {
                "name": "User Authentication Epic",
                "description": "As a system, I need robust authentication handling for Users and Admins.",
                "jira_key": f"PROJ-{random.randint(100, 999)}",
                "jira_type": JiraType.EPIC,
                "jira_status": "in_progress"
            },
            {
                "name": "Login User Story",
                "description": "As a user, I want to login with email and password so that I can access my dashboard.",
                "jira_key": f"PROJ-{random.randint(1000, 9999)}",
                "jira_type": JiraType.STORY,
                "jira_status": "done"
            },
            {
                "name": "Forgot Password Story",
                "description": "As a user, I want to reset my password via email link if I forget it.",
                "jira_key": f"PROJ-{random.randint(1000, 9999)}",
                "jira_type": JiraType.STORY,
                "jira_status": "todo"
            },
            {
                "name": "Dashboard Reporting Epic",
                "description": "Provide visual analytics for project status and test coverage.",
                "jira_key": f"PROJ-{random.randint(100, 999)}",
                "jira_type": JiraType.EPIC,
                "jira_status": "todo"
            },
            {
                "name": "Export PDF Report",
                "description": "As a manager, I want to export the test coverage report as PDF.",
                "jira_key": f"PROJ-{random.randint(1000, 9999)}",
                "jira_type": JiraType.STORY,
                "jira_status": "in_progress"
            }
        ]

        # Check existing to avoid duplicates (mock logic: check by name for simplicity)
        existing_result = await db.execute(select(Feature).where(Feature.project_id == project_id))
        existing_names = {f.name for f in existing_result.scalars().all()}

        added_count = 0
        for feature_data in mock_features:
            if feature_data["name"] not in existing_names:
                new_feature = Feature(
                    project_id=project_id,
                    **feature_data
                )
                db.add(new_feature)
                added_count += 1
        
        await db.commit()
        return added_count

jira_service = JiraService()
