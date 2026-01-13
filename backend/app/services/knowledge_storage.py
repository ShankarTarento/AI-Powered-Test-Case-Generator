"""Storage utilities for knowledge base uploads"""
from __future__ import annotations

import logging
import os
import re
from datetime import timedelta
from pathlib import Path
from typing import Optional
from uuid import UUID

from app.core.config import settings

try:  # Optional dependency is installed via backend requirements
    from google.cloud import storage  # type: ignore
except Exception:  # pragma: no cover - google client not installed during tests
    storage = None

logger = logging.getLogger(__name__)


class KnowledgeStorageClient:
    """Handles persistence of knowledge base artifacts in GCS (with local fallback)."""

    def __init__(self, bucket_name: str, local_dir: str, signed_url_ttl: int) -> None:
        self.bucket_name = bucket_name.strip()
        self.local_dir = Path(local_dir)
        self.signed_url_ttl = signed_url_ttl
        self._client: Optional["storage.Client"] = None

        if not self.bucket_name:
            self.local_dir.mkdir(parents=True, exist_ok=True)
            logger.warning(
                "KNOWLEDGE_BASE_BUCKET not configured; falling back to local storage at %s",
                self.local_dir,
            )

    def _ensure_client(self) -> "storage.Client":
        if not self.bucket_name:
            raise RuntimeError("Cloud storage bucket is not configured")
        if storage is None:
            raise RuntimeError(
                "google-cloud-storage is not installed; cannot use GCS storage backend"
            )
        if self._client is None:
            self._client = storage.Client()
        return self._client

    def _get_bucket(self):
        client = self._ensure_client()
        return client.bucket(self.bucket_name)

    def _sanitize_filename(self, file_name: str) -> str:
        base = os.path.basename(file_name)
        return re.sub(r"[^A-Za-z0-9._-]", "_", base)

    def build_original_path(
        self,
        organization_id: UUID,
        project_id: UUID,
        batch_id: UUID,
        file_name: str,
    ) -> str:
        safe_name = self._sanitize_filename(file_name)
        return (
            f"org/{organization_id}/project/{project_id}/batch/{batch_id}/original/{safe_name}"
        )

    def build_normalized_path(
        self, organization_id: UUID, project_id: UUID, batch_id: UUID
    ) -> str:
        return f"org/{organization_id}/project/{project_id}/batch/{batch_id}/normalized/rows.jsonl"

    def build_uri(self, object_path: str) -> str:
        if self.bucket_name:
            return f"gs://{self.bucket_name}/{object_path}"
        return str(self.local_dir.joinpath(object_path).resolve())

    def upload_bytes(
        self, object_path: str, data: bytes, content_type: Optional[str] = None
    ) -> str:
        """Upload bytes to storage and return the object URI."""
        if self.bucket_name:
            bucket = self._get_bucket()
            blob = bucket.blob(object_path)
            blob.upload_from_string(data, content_type=content_type)
            return self.build_uri(object_path)

        destination = self.local_dir / object_path
        destination.parent.mkdir(parents=True, exist_ok=True)
        destination.write_bytes(data)
        return self.build_uri(object_path)

    def download_bytes(self, object_path: str) -> bytes:
        if self.bucket_name:
            bucket = self._get_bucket()
            blob = bucket.blob(object_path)
            return blob.download_as_bytes()

        source = self.local_dir / object_path
        return source.read_bytes()

    def generate_signed_url(
        self,
        object_path: str,
        method: str = "GET",
        content_type: Optional[str] = None,
    ) -> str:
        if not self.bucket_name:
            raise RuntimeError("Signed URLs are only available when a GCS bucket is configured")
        bucket = self._get_bucket()
        blob = bucket.blob(object_path)
        return blob.generate_signed_url(
            expiration=timedelta(seconds=self.signed_url_ttl),
            method=method,
            content_type=content_type,
        )


knowledge_storage_client = KnowledgeStorageClient(
    bucket_name=settings.KNOWLEDGE_BASE_BUCKET,
    local_dir=settings.KNOWLEDGE_BASE_LOCAL_DIR,
    signed_url_ttl=settings.KNOWLEDGE_BASE_SIGNED_URL_TTL,
)
