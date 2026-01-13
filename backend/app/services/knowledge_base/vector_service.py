"""Vectorization and Qdrant indexing for knowledge entries."""
from __future__ import annotations

import logging
from typing import Iterable, List, Optional

from litellm import embedding as litellm_embedding
from qdrant_client import QdrantClient
from qdrant_client.http import models as qmodels

from app.core.config import settings
from app.models import KnowledgeEntry

logger = logging.getLogger(__name__)


class KnowledgeVectorService:
    """Generates embeddings using system-level API keys and stores them in Qdrant."""

    def __init__(self) -> None:
        self.provider = settings.KNOWLEDGE_EMBEDDING_PROVIDER.lower()
        self.model = settings.KNOWLEDGE_EMBEDDING_MODEL
        self.client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
        self.collection_name = settings.QDRANT_COLLECTION_NAME
        self.vector_size = settings.QDRANT_VECTOR_SIZE
        self._ensure_collection()

    def _ensure_collection(self) -> None:
        try:
            self.client.get_collection(self.collection_name)
        except Exception:  # pragma: no cover - network/collection bootstrap
            logger.info("Creating Qdrant collection %s", self.collection_name)
            self.client.recreate_collection(
                collection_name=self.collection_name,
                vectors_config=qmodels.VectorParams(
                    size=self.vector_size,
                    distance=qmodels.Distance.COSINE,
                ),
            )

    def _resolve_api_key(self) -> str:
        provider_to_key = {
            "openai": settings.SYSTEM_OPENAI_API_KEY,
            "anthropic": settings.SYSTEM_ANTHROPIC_API_KEY,
            "google": settings.SYSTEM_GOOGLE_API_KEY,
        }
        api_key = provider_to_key.get(self.provider)
        if not api_key:
            raise RuntimeError(
                f"System API key for provider {self.provider} is not configured"
            )
        return api_key

    def index_entries(self, entries: Iterable[KnowledgeEntry]) -> None:
        entries_list = list(entries)
        if not entries_list:
            return

        api_key = self._resolve_api_key()
        points: List[qmodels.PointStruct] = []

        for entry in entries_list:
            document = self._build_document(entry)
            if not document.strip():
                logger.warning(
                    "Skipping entry %s due to empty document text", entry.id
                )
                continue

            try:
                response = litellm_embedding(
                    model=self.model,
                    input=document,
                    api_key=api_key,
                )
            except Exception as exc:  # pragma: no cover - external API error
                logger.error("Embedding failed for entry %s: %s", entry.id, exc)
                continue

            embedding_vector = response["data"][0]["embedding"]
            point_id = str(entry.id)
            payload = {
                "entry_id": point_id,
                "project_id": str(entry.project_id),
                "organization_id": str(entry.organization_id),
                "user_story_id": str(entry.user_story_id)
                if entry.user_story_id
                else None,
                "jira_key": entry.jira_key,
                "priority": entry.priority,
                "test_type": entry.test_type,
                "title": entry.title,
            }
            points.append(
                qmodels.PointStruct(
                    id=point_id,
                    vector=embedding_vector,
                    payload=payload,
                )
            )
            entry.qdrant_point_id = point_id
            entry.embedding_model = self.model

        if not points:
            return

        self.client.upsert(
            collection_name=self.collection_name,
            wait=True,
            points=points,
        )
        logger.info(
            "Indexed %d knowledge entries into collection %s",
            len(points),
            self.collection_name,
        )

    def search_relevant_entries(
        self,
        query: str,
        project_id: UUID,
        limit: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search for relevant knowledge entries using semantic search."""
        api_key = self._resolve_api_key()
        try:
            response = litellm_embedding(
                model=self.model,
                input=query,
                api_key=api_key,
            )
        except Exception as exc:
            logger.error("Embedding failed for search query: %s", exc)
            return []

        embedding_vector = response["data"][0]["embedding"]
        
        # Filter by project_id
        project_filter = qmodels.Filter(
            must=[
                qmodels.FieldCondition(
                    key="project_id",
                    match=qmodels.MatchValue(value=str(project_id)),
                )
            ]
        )

        results = self.client.search(
            collection_name=self.collection_name,
            query_vector=embedding_vector,
            query_filter=project_filter,
            limit=limit,
        )

        return [
            {
                "id": hit.id,
                "score": hit.score,
                "payload": hit.payload
            }
            for hit in results
        ]

    def _build_document(self, entry: KnowledgeEntry) -> str:
        parts: List[str] = [entry.title or ""]
        if entry.description:
            parts.append(entry.description)
        if entry.steps:
            steps_text = self._format_steps(entry.steps)
            if steps_text:
                parts.append(steps_text)
        if entry.expected_result:
            parts.append(f"Expected: {entry.expected_result}")
        return "\n".join(part for part in parts if part)

    def _format_steps(self, steps_data) -> str:
        if isinstance(steps_data, list):
            formatted = []
            for step in steps_data:
                if isinstance(step, dict):
                    action = step.get("action") or step.get("description")
                    expected = step.get("expected_result")
                else:
                    action = str(step)
                    expected = None
                line = action or ""
                if expected:
                    line = f"{line} -> {expected}"
                formatted.append(f"Step: {line}")
            return "\n".join(formatted)
        return str(steps_data)


vector_indexer = KnowledgeVectorService()
