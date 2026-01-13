from typing import List, Dict, Any, Optional
import uuid
import httpx
from datetime import datetime, timedelta
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

    async def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        """Refresh the Jira access token using the refresh token"""
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.token_url,
                json={
                    "grant_type": "refresh_token",
                    "client_id": settings.JIRA_OAUTH_CLIENT_ID,
                    "client_secret": settings.JIRA_OAUTH_CLIENT_SECRET,
                    "refresh_token": refresh_token,
                },
            )
            if response.status_code != 200:
                raise ValueError("Failed to refresh Jira token. Please reconnect.")
            return response.json()

    async def _get_valid_token(self, user: User, db: AsyncSession) -> str:
        """Get a valid access token, refreshing if expired"""
        import logging
        logger = logging.getLogger(__name__)
        
        # Check if token is expired (with 5 min buffer)
        if user.jira_token_expires_at:
            # Handle timezone-aware and naive datetime comparison
            now = datetime.utcnow()
            expires_at = user.jira_token_expires_at
            
            # Remove timezone info if present for comparison
            if hasattr(expires_at, 'tzinfo') and expires_at.tzinfo is not None:
                expires_at = expires_at.replace(tzinfo=None)
            
            if now >= expires_at - timedelta(minutes=5):
                logger.info(f"Token expired for user {user.id}, refreshing...")
                
                if not user.jira_refresh_token:
                    raise ValueError("No refresh token available. Please reconnect Jira.")
                
                # Refresh the token
                token_data = await self.refresh_access_token(user.jira_refresh_token)
                
                # Update user with new tokens
                user.jira_access_token = token_data["access_token"]
                if "refresh_token" in token_data:
                    user.jira_refresh_token = token_data["refresh_token"]
                user.jira_token_expires_at = datetime.utcnow() + timedelta(
                    seconds=token_data.get("expires_in", 3600)
                )
                await db.commit()
                await db.refresh(user)
                logger.info(f"Token refreshed successfully for user {user.id}")
        
        return user.jira_access_token

    async def _fetch_issue(self, jira_key: str, user: User, db: AsyncSession) -> Dict[str, Any]:
        """Fetch a single issue from Jira by key"""
        access_token = await self._get_valid_token(user, db)
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.api_base}/{user.jira_cloud_id}/rest/api/3/issue/{jira_key}",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"expand": "names", "fields": "*all"}
            )
            
            if response.status_code == 404:
                raise ValueError(f"Issue {jira_key} not found in Jira")
            if response.status_code == 401:
                raise ValueError("Jira token expired. Please reconnect.")
            
            response.raise_for_status()
            return response.json()

    async def _fetch_epic_children(self, epic_key: str, user: User, db: AsyncSession) -> List[Dict[str, Any]]:
        """Fetch all child issues belonging to an Epic using multiple methods."""
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"Fetching children for epic {epic_key}")
        
        access_token = await self._get_valid_token(user, db)
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Method 1: Try Jira's specific endpoint for Epic children (Jira Software API)
            try:
                # Try the agile/epic endpoint
                response = await client.get(
                    f"{self.api_base}/{user.jira_cloud_id}/rest/agile/1.0/epic/{epic_key}/issue",
                    headers={"Authorization": f"Bearer {access_token}"},
                    params={"maxResults": 100}
                )
                logger.info(f"Agile epic endpoint status: {response.status_code}")
                if response.status_code == 200:
                    data = response.json()
                    issues = data.get("issues", [])
                    if issues:
                        logger.info(f"Found {len(issues)} children via agile API")
                        return issues
            except Exception as e:
                logger.warning(f"Agile epic endpoint failed: {e}")
            
            # Method 2: Try JQL search with different syntaxes using new API
            jql_queries = [
                f'parent = "{epic_key}"',       # Next-gen projects (quoted)
                f'parent = {epic_key}',          # Next-gen projects (unquoted)  
                f'"Epic Link" = "{epic_key}"',   # Classic projects (quoted)
                f'"Epic Link" = {epic_key}',     # Classic projects (unquoted)
            ]
            
            for jql in jql_queries:
                try:
                    logger.info(f"Trying JQL: {jql}")
                    # Using new /search/jql endpoint (old /search is deprecated and returns 410)
                    # Request all fields to ensure full description is included
                    response = await client.get(
                        f"{self.api_base}/{user.jira_cloud_id}/rest/api/3/search/jql",
                        params={"jql": jql, "maxResults": 100, "fields": "*all"},
                        headers={"Authorization": f"Bearer {access_token}"},
                    )
                    
                    logger.info(f"JQL response status: {response.status_code}")
                    
                    if response.status_code == 401:
                        raise ValueError("Jira token expired. Please reconnect.")
                    
                    if response.status_code == 200:
                        data = response.json()
                        issues = data.get("issues", [])
                        
                        # Filter out defects/bugs - only keep stories, tasks, etc.
                        filtered_issues = []
                        excluded_types = ['bug', 'defect', 'error', 'fault']
                        for issue in issues:
                            issue_type = issue.get("fields", {}).get("issuetype", {}).get("name", "").lower()
                            if issue_type not in excluded_types:
                                filtered_issues.append(issue)
                            else:
                                logger.info(f"Excluding {issue.get('key')} (type: {issue_type})")
                        
                        logger.info(f"Found {len(filtered_issues)} children (excluded {len(issues) - len(filtered_issues)} defects) with JQL: {jql}")
                        if filtered_issues:
                            return filtered_issues
                    elif response.status_code == 400:
                        logger.info(f"JQL syntax not valid: {jql}")
                        continue
                except Exception as e:
                    logger.warning(f"Error for JQL {jql}: {e}")
                    continue
            
            logger.info(f"No children found for epic {epic_key}")
            return []



    def _extract_description(self, description_raw: Any) -> Optional[str]:
        """Extract plain text from Jira ADF (Atlassian Document Format) description"""
        if not description_raw:
            return None
        if isinstance(description_raw, str):
            return description_raw
        
        # For ADF format, recursively extract text content
        if isinstance(description_raw, dict) and "content" in description_raw:
            return self._extract_adf_text(description_raw)
        
        return str(description_raw) if description_raw else None
    
    def _extract_adf_text(self, node: dict) -> Optional[str]:
        """Recursively extract text from ADF nodes"""
        texts = []
        
        # Handle text nodes directly
        if node.get("type") == "text":
            return node.get("text", "")
        
        # Process content array
        content = node.get("content", [])
        for item in content:
            if item.get("type") == "text":
                texts.append(item.get("text", ""))
            elif item.get("type") in ["paragraph", "heading", "bulletList", "orderedList", "listItem", "blockquote", "codeBlock", "panel", "table", "tableRow", "tableCell", "tableHeader"]:
                # Recursively extract text from nested elements
                nested_text = self._extract_adf_text(item)
                if nested_text:
                    texts.append(nested_text)
            elif item.get("type") == "hardBreak":
                texts.append("\n")
        
        return "\n".join(filter(None, texts)) if texts else None
    
    def _build_story_description(self, fields: Dict[str, Any]) -> Optional[str]:
        """Build a complete description from Jira fields including custom fields"""
        parts = []
        
        # Try standard description first
        desc = self._extract_description(fields.get("description"))
        if desc:
            parts.append(desc)
        
        # Look for common user story custom fields
        # These are often named customfield_XXXXX in Jira
        for key, value in fields.items():
            if not key.startswith("customfield_"):
                continue
            if value is None:
                continue
                
            # Try to extract text from custom fields
            extracted = None
            if isinstance(value, str):
                extracted = value
            elif isinstance(value, dict):
                # Could be ADF format or option value
                if "content" in value:
                    extracted = self._extract_adf_text(value)
                elif "value" in value:
                    extracted = value.get("value")
            elif isinstance(value, list):
                # Could be list of options
                texts = []
                for item in value:
                    if isinstance(item, str):
                        texts.append(item)
                    elif isinstance(item, dict) and "value" in item:
                        texts.append(item.get("value"))
                if texts:
                    extracted = ", ".join(texts)
            
            if extracted and len(extracted) > 10:  # Only include substantial content
                parts.append(extracted)
        
        return "\n\n".join(parts) if parts else None

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
        # Normalize jira key to uppercase (Jira is case-sensitive)
        jira_key = jira_key.upper().strip()
        
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
        issue = await self._fetch_issue(jira_key, user, db)
        
        # Get the issue ID (internal Jira ID) for more reliable JQL
        issue_id = issue.get("id")
        
        fields = issue["fields"]
        summary = fields.get("summary", "No Summary")
        description = self._build_story_description(fields)  # Build from all fields
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
            children = await self._fetch_epic_children(jira_key, user, db)
            
            for child in children:
                child_key = child["key"]
                child_fields = child["fields"]
                
                # Check if child already exists
                existing_child = await db.execute(
                    select(UserStory).where(UserStory.jira_key == child_key)
                )
                if existing_child.scalar_one_or_none():
                    continue
                
                # Build description from all available fields (description + custom fields)
                import logging
                logger = logging.getLogger(__name__)
                
                extracted_desc = self._build_story_description(child_fields)
                logger.info(f"Child {child_key} built description: {extracted_desc[:200] if extracted_desc else 'None'}...")
                
                child_story = UserStory(
                    project_id=project_id,
                    epic_id=user_story.id,  # Link to parent Epic
                    name=child_fields.get("summary", "No Summary"),
                    description=extracted_desc,
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

