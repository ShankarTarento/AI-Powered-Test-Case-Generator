"""Knowledge base ingestion service"""
from __future__ import annotations

import hashlib
import logging
from typing import Dict, List, Optional, Set
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    KnowledgeBatch,
    KnowledgeEntry,
    KnowledgeBatchStatus,
    KnowledgeEntryStatus,
    Project,
    User,
    UserStory,
)
from app.services.knowledge_storage import knowledge_storage_client
from app.services.knowledge_base.parser import parser, ParsedFile
from app.services.knowledge_base.vector_service import vector_indexer

logger = logging.getLogger(__name__)


class KnowledgeBatchService:
    """Coordinates creation, processing, and status updates for knowledge uploads"""

    def __init__(self, db: AsyncSession):
        self.db = db

    async def create_batch(
        self,
        *,
        project: Project,
        user: User,
        file_name: str,
        file_type: str,
        file_size_bytes: Optional[int],
    ) -> KnowledgeBatch:
        batch = KnowledgeBatch(
            organization_id=project.organization_id,
            project_id=project.id,
            uploaded_by=user.id,
            file_name=file_name,
            file_type=file_type,
            file_size_bytes=file_size_bytes,
            status=KnowledgeBatchStatus.UPLOAD_PENDING.value,
        )
        self.db.add(batch)
        await self.db.flush()

        object_path = self._original_object_path(batch)
        batch.original_file_uri = knowledge_storage_client.build_uri(object_path)
        return batch

    async def list_batches_for_project(self, project_id: UUID) -> List[KnowledgeBatch]:
        result = await self.db.execute(
            select(KnowledgeBatch)
            .where(KnowledgeBatch.project_id == project_id)
            .order_by(KnowledgeBatch.created_at.desc())
        )
        return result.scalars().all()

    async def list_entries(
        self,
        project_id: UUID,
        *,
        jira_key: Optional[str] = None,
        user_story_id: Optional[UUID] = None,
        limit: int = 100,
    ) -> List[KnowledgeEntry]:
        query = select(KnowledgeEntry).where(KnowledgeEntry.project_id == project_id)
        if jira_key:
            query = query.where(KnowledgeEntry.jira_key == jira_key)
        if user_story_id:
            query = query.where(KnowledgeEntry.user_story_id == user_story_id)
        query = query.order_by(KnowledgeEntry.created_at.desc()).limit(limit)
        result = await self.db.execute(query)
        return result.scalars().all()

    def upload_original_file(
        self,
        batch: KnowledgeBatch,
        *,
        file_bytes: bytes,
        content_type: Optional[str] = None,
    ) -> None:
        object_path = self._original_object_path(batch)
        knowledge_storage_client.upload_bytes(object_path, file_bytes, content_type)

    async def get_batch(self, batch_id: UUID) -> KnowledgeBatch:
        result = await self.db.execute(
            select(KnowledgeBatch).where(KnowledgeBatch.id == batch_id)
        )
        batch = result.scalar_one_or_none()
        if not batch:
            raise ValueError("Knowledge batch not found")
        return batch

    async def process_batch(self, batch: KnowledgeBatch) -> KnowledgeBatch:
        logger.info("Processing knowledge batch %s", batch.id)
        batch.status = KnowledgeBatchStatus.PROCESSING.value
        await self.db.flush()

        object_path = self._original_object_path(batch)
        file_bytes = knowledge_storage_client.download_bytes(object_path)
        parsed_file = parser.parse(file_bytes, batch.file_type)
        column_map = parser.detect_columns(parsed_file.headers)

        batch.row_count = len(parsed_file.rows)
        batch.column_mapping = column_map
        entries = await self._persist_entries(batch, parsed_file, column_map)
        await self.db.flush()
        await self._index_entries(entries)
        batch.processed_count = len(entries)
        batch.status = KnowledgeBatchStatus.COMPLETED.value
        await self.db.flush()
        return batch

    async def _persist_entries(
        self,
        batch: KnowledgeBatch,
        parsed_file: ParsedFile,
        column_map: Dict[str, Optional[str]],
    ) -> List[KnowledgeEntry]:
        entries: List[KnowledgeEntry] = []
        jira_column = column_map.get("jira_key")
        jira_keys = set()
        if jira_column:
            for row in parsed_file.rows:
                jira_value = row.data.get(jira_column)
                if jira_value:
                    jira_keys.add(jira_value)
        # TODO: Support manual mapping when Jira key is missing
        user_stories = await self._load_user_stories(batch.project_id, jira_keys)
        story_by_key = {story.jira_key: story for story in user_stories if story.jira_key}

        for row in parsed_file.rows:
            normalized = parser.normalize_row(row, column_map)
            jira_key = normalized.get("jira_key")
            if not jira_key:
                batch.error_count += 1
                continue

            source_hash = self._hash_row(normalized)
            user_story = story_by_key.get(jira_key)
            entry = KnowledgeEntry(
                batch_id=batch.id,
                organization_id=batch.organization_id,
                project_id=batch.project_id,
                user_story_id=user_story.id if user_story else None,
                jira_key=jira_key,
                title=normalized.get("title") or "",
                description=normalized.get("description"),
                steps=normalized.get("steps"),
                expected_result=normalized.get("expected_result"),
                priority=normalized.get("priority"),
                test_type=normalized.get("test_type"),
                raw_payload=normalized,
                source_row_number=row.row_number,
                source_row_hash=source_hash,
                status=KnowledgeEntryStatus.ACTIVE.value,
            )
            self.db.add(entry)
            entries.append(entry)
        return entries

    async def _index_entries(self, entries: List[KnowledgeEntry]) -> None:
        if not entries:
            return
        try:
            vector_indexer.index_entries(entries)
        except Exception as exc:  # pragma: no cover - external services
            logger.error("Vector indexing failed: %s", exc)

    async def _load_user_stories(self, project_id: UUID, jira_keys: Set[str]):
        if not jira_keys:
            return []
        result = await self.db.execute(
            select(UserStory)
            .where(UserStory.project_id == project_id)
            .where(UserStory.jira_key.in_(list(jira_keys)))
        )
        return result.scalars().all()

    def _original_object_path(self, batch: KnowledgeBatch) -> str:
        return knowledge_storage_client.build_original_path(
            batch.organization_id,
            batch.project_id,
            batch.id,
            batch.file_name,
        )

    def _hash_row(self, normalized_row: Dict[str, Optional[str]]) -> str:
        serialized = str(normalized_row).encode("utf-8")
        return hashlib.sha256(serialized).hexdigest()


async def get_batch_service(db: AsyncSession) -> KnowledgeBatchService:
    return KnowledgeBatchService(db)
