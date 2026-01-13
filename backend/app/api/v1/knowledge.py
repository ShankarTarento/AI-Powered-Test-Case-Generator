"""Knowledge base upload and retrieval endpoints"""
from __future__ import annotations

from pathlib import Path
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api import dependencies as deps
from app.core.config import settings
from app.core.database import get_db
from app.models import KnowledgeBatchStatus, User
from app.schemas.knowledge import KnowledgeBatchResponse, KnowledgeEntryResponse
from app.services.knowledge_base.batch_service import KnowledgeBatchService

router = APIRouter()


def _allowed_extensions() -> List[str]:
    return [ext.strip().lower() for ext in settings.KNOWLEDGE_ALLOWED_EXTENSIONS.split(",") if ext.strip()]


def _validate_file_extension(filename: str) -> str:
    if not filename:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Filename missing")
    extension = Path(filename).suffix.lower().lstrip(".")
    allowed = set(_allowed_extensions())
    if extension not in allowed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed extensions: {', '.join(sorted(allowed))}",
        )
    return extension


def _validate_file_size(file_bytes: bytes) -> None:
    if not file_bytes:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Uploaded file is empty")
    max_bytes = settings.KNOWLEDGE_MAX_FILE_SIZE_MB * 1024 * 1024
    if len(file_bytes) > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File exceeds size limit of {settings.KNOWLEDGE_MAX_FILE_SIZE_MB} MB",
        )


@router.post(
    "/projects/{project_id}/knowledge-batches",
    response_model=KnowledgeBatchResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_knowledge_batch(
    project_id: UUID,
    file: UploadFile = File(...),
    current_admin: User = Depends(deps.get_current_admin),
    db: AsyncSession = Depends(get_db),
):
    project = await deps.verify_project_access(project_id, current_admin, db)
    extension = _validate_file_extension(file.filename or "")
    file_bytes = await file.read()
    _validate_file_size(file_bytes)

    service = KnowledgeBatchService(db)
    batch = await service.create_batch(
        project=project,
        user=current_admin,
        file_name=file.filename or "upload",
        file_type=extension,
        file_size_bytes=len(file_bytes),
    )
    service.upload_original_file(batch, file_bytes=file_bytes, content_type=file.content_type)

    try:
        await service.process_batch(batch)
    except Exception as exc:  # pragma: no cover - bubbled to client
        batch.status = KnowledgeBatchStatus.FAILED.value
        batch.error_details = {"message": str(exc)}
        await db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc

    await db.commit()
    await db.refresh(batch)
    return batch


@router.get(
    "/projects/{project_id}/knowledge-batches",
    response_model=List[KnowledgeBatchResponse],
)
async def list_knowledge_batches(
    project_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await deps.verify_project_access(project_id, current_user, db)
    service = KnowledgeBatchService(db)
    batches = await service.list_batches_for_project(project.id)
    return batches


@router.get("/knowledge-batches/{batch_id}", response_model=KnowledgeBatchResponse)
async def get_knowledge_batch(
    batch_id: UUID,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeBatchService(db)
    batch = await service.get_batch(batch_id)
    await deps.verify_project_access(batch.project_id, current_user, db)
    return batch


@router.get(
    "/projects/{project_id}/knowledge-entries",
    response_model=List[KnowledgeEntryResponse],
)
async def list_knowledge_entries(
    project_id: UUID,
    jira_key: Optional[str] = None,
    user_story_id: Optional[UUID] = None,
    limit: int = 50,
    current_user: User = Depends(deps.get_current_user),
    db: AsyncSession = Depends(get_db),
):
    project = await deps.verify_project_access(project_id, current_user, db)
    sanitized_limit = max(1, min(limit, 200))
    service = KnowledgeBatchService(db)
    entries = await service.list_entries(
        project_id=project.id,
        jira_key=jira_key,
        user_story_id=user_story_id,
        limit=sanitized_limit,
    )
    return entries
