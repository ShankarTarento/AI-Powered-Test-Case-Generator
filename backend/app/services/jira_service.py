from typing import List, Dict, Any, Optional
import uuid
import httpx
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.config import settings
from app.models.feature import UserStory, JiraType
from app.models.project import Project
from app.models.user import User

class JiraService:
    def __init__(self):
        self.auth_url = "https://auth.atlassian.com/authorize"
        self.token_url = "https://auth.atlassian.com/oauth/token"
        self.api_base = "https://api.atlassian.com/ex/jira"
        self.cloud_resource_url = "https://api.atlassian.com/oauth/token/accessible-resources"

    def get_auth_url(self) -> str:
        """Generate OAuth 2.0 authorization URL"""
        scopes = "read:jira-work read:jira-user offline_access"
        return (
            f"{self.auth_url}"
            f"?audience=api.atlassian.com"
            f"&client_id={settings.JIRA_OAUTH_CLIENT_ID}"
            f"&scope={scopes}"
            f"&redirect_uri={settings.JIRA_OAUTH_REDIRECT_URI}"
            f"&state={uuid.uuid4()}"
            f"&response_type=code"
            f"&prompt=consent"
        )

    async def exchange_code_for_token(self, code: str) -> Dict[str, Any]:
        """Exchange auth code for access token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                json={
                    "grant_type": "authorization_code",
                    "client_id": settings.JIRA_OAUTH_CLIENT_ID,
                    "client_secret": settings.JIRA_OAUTH_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": settings.JIRA_OAUTH_REDIRECT_URI,
                },
            )
            response.raise_for_status()
            return response.json()

    async def get_accessible_resources(self, access_token: str) -> List[Dict[str, Any]]:
        """Get accessible Jira Cloud resources (sites)"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.cloud_resource_url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            response.raise_for_status()
            return response.json()

    async def _fetch_issue(self, jira_key: str, user: User) -> Dict[str, Any]:
        """Fetch a single issue from Jira by key"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/{user.jira_cloud_id}/rest/api/3/issue/{jira_key}",
                headers={"Authorization": f"Bearer {user.jira_access_token}"},
                params={"expand": "names"}
            )
            
            if response.status_code == 404:
                raise ValueError(f"Issue {jira_key} not found in Jira")
            if response.status_code == 401:
                raise ValueError("Jira token expired. Please reconnect.")
            
            response.raise_for_status()
            return response.json()

    async def _fetch_epic_children(self, epic_key: str, user: User) -> List[Dict[str, Any]]:
        """Fetch all stories belonging to an Epic. Tries multiple JQL syntaxes for compatibility."""
        import logging
        logger = logging.getLogger(__name__)
        
        # Try different JQL syntaxes as Jira versions/project types differ
        jql_queries = [
            f'parent = "{epic_key}"',  # Next-gen projects (quoted)
            f'parent = {epic_key}',    # Next-gen projects (unquoted)
            f'"Epic Link" = "{epic_key}"',  # Classic projects (quoted)
            f'"Epic Link" = {epic_key}',    # Classic projects (unquoted)
            f'"Parent" = {epic_key}',       # Alternative syntax
            f'parentEpic = {epic_key}',     # Some Jira versions
        ]
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            for jql in jql_queries:
                try:
                    logger.info(f"Trying JQL for children: {jql}")
                    response = await client.get(
                        f"{self.api_base}/{user.jira_cloud_id}/rest/api/3/search",
                        params={"jql": jql, "maxResults": 100, "fields": "summary,description,status,issuetype"},
                        headers={"Authorization": f"Bearer {user.jira_access_token}"},
                    )
                    
                    logger.info(f"JQL response status: {response.status_code}")
                    
                    if response.status_code == 401:
                        raise ValueError("Jira token expired. Please reconnect.")
                    
                    # 400 means JQL syntax not supported, try next
                    if response.status_code == 400:
                        logger.info(f"JQL not supported: {jql}")
                        continue
                    
                    # 410 Gone - try next query
                    if response.status_code == 410:
                        logger.info(f"JQL returned 410: {jql}")
                        continue
                    
                    if response.status_code == 200:
                        data = response.json()
                        issues = data.get("issues", [])
                        logger.info(f"Found {len(issues)} children with JQL: {jql}")
                        if issues:
                            return issues
                    else:
                        logger.warning(f"Unexpected status {response.status_code} for JQL: {jql}")
                        
                except httpx.HTTPStatusError as e:
                    logger.warning(f"HTTP error for JQL {jql}: {e}")
                    continue
                except Exception as e:
                    logger.warning(f"Error for JQL {jql}: {e}")
                    continue
            
            logger.info(f"No children found for epic {epic_key}")
            return []


    def _extract_description(self, description_raw: Any) -> Optional[str]:
        """Extract plain text from Jira ADF description"""
        if not description_raw:
            return None
        if isinstance(description_raw, str):
            return description_raw
        # For ADF format, extract text content
        if isinstance(description_raw, dict) and "content" in description_raw:
            texts = []
            for block in description_raw.get("content", []):
                if block.get("type") == "paragraph":
                    for item in block.get("content", []):
                        if item.get("type") == "text":
                            texts.append(item.get("text", ""))
            return "\n".join(texts) if texts else None
        return str(description_raw)

    async def import_issue_by_key(
        self, 
        jira_key: str, 
        project_id: uuid.UUID, 
        db: AsyncSession, 
        user: User
    ) -> Dict[str, Any]:
        """
        Import a specific Jira issue by key.
        If it's an Epic, also imports child stories.
        """
        # Check if already exists
        existing = await db.execute(
            select(UserStory).where(UserStory.jira_key == jira_key)
        )
        existing_story = existing.scalar_one_or_none()
        if existing_story:
            return {
                "message": f"Issue {jira_key} already imported",
                "user_story": {"id": str(existing_story.id), "name": existing_story.name},
                "imported_count": 0
            }

        # Fetch the issue from Jira
        issue = await self._fetch_issue(jira_key, user)
        
        fields = issue["fields"]
        summary = fields.get("summary", "No Summary")
        description = self._extract_description(fields.get("description"))
        issue_type = fields["issuetype"]["name"].lower()
        status = fields["status"]["name"]
        
        is_epic = "epic" in issue_type
        jira_type = JiraType.EPIC if is_epic else JiraType.STORY
        
        # Create the main issue
        user_story = UserStory(
            project_id=project_id,
            name=summary,
            description=description,
            jira_key=jira_key,
            jira_type=jira_type.value,
            jira_status=status,
            synced_at=datetime.utcnow()
        )
        db.add(user_story)
        await db.flush()  # Get ID
        
        imported_count = 1
        child_stories = []
        
        # If Epic, fetch and import child stories
        if is_epic:
            children = await self._fetch_epic_children(jira_key, user)
            
            for child in children:
                child_key = child["key"]
                child_fields = child["fields"]
                
                # Check if child already exists
                existing_child = await db.execute(
                    select(UserStory).where(UserStory.jira_key == child_key)
                )
                if existing_child.scalar_one_or_none():
                    continue
                
                child_story = UserStory(
                    project_id=project_id,
                    epic_id=user_story.id,  # Link to parent Epic
                    name=child_fields.get("summary", "No Summary"),
                    description=self._extract_description(child_fields.get("description")),
                    jira_key=child_key,
                    jira_type=JiraType.STORY.value,
                    jira_status=child_fields["status"]["name"],
                    synced_at=datetime.utcnow()
                )
                db.add(child_story)
                child_stories.append(child_key)
                imported_count += 1
        
        await db.commit()
        
        return {
            "message": f"Successfully imported {jira_key}" + (f" with {len(child_stories)} child stories" if child_stories else ""),
            "user_story": {
                "id": str(user_story.id),
                "name": user_story.name,
                "type": jira_type.value,
                "jira_key": jira_key
            },
            "children": child_stories,
            "imported_count": imported_count
        }

    async def sync_project_features(self, project_id: uuid.UUID, db: AsyncSession, user: User) -> int:
        """
        Sync features from Jira using real API.
        Requires user to have linked Jira account.
        """
        if not user.jira_access_token or not user.jira_cloud_id:
            raise ValueError("User not connected to Jira")

        # Verify project exists
        project_result = await db.execute(select(Project).where(Project.id == project_id))
        project = project_result.scalar_one_or_none()
        if not project:
            raise ValueError("Project not found")

        # Fetch issues from Jira
        jql = f"project = {project.jira_project_key} AND issuetype in (Epic, Story)"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/{user.jira_cloud_id}/rest/api/3/search",
                params={"jql": jql, "maxResults": 100},
                headers={"Authorization": f"Bearer {user.jira_access_token}"},
            )
            
            if response.status_code == 401:
                raise ValueError("Jira token expired. Please reconnect.")
            
            response.raise_for_status()
            data = response.json()

        issues = data.get("issues", [])
        added_count = 0

        # Get existing keys
        existing_result = await db.execute(select(UserStory).where(UserStory.project_id == project_id))
        existing_keys = {s.jira_key for s in existing_result.scalars().all()}

        for issue in issues:
            key = issue["key"]
            if key in existing_keys:
                continue
                
            fields = issue["fields"]
            summary = fields.get("summary", "No Summary")
            description = self._extract_description(fields.get("description"))
            issue_type = fields["issuetype"]["name"].lower()
            jira_type = JiraType.EPIC if "epic" in issue_type else JiraType.STORY
            status = fields["status"]["name"]

            new_story = UserStory(
                project_id=project_id,
                name=summary,
                description=description,
                jira_key=key,
                jira_type=jira_type.value,
                jira_status=status,
                synced_at=datetime.utcnow()
            )
            db.add(new_story)
            added_count += 1
                
        await db.commit()
        return added_count

jira_service = JiraService()

