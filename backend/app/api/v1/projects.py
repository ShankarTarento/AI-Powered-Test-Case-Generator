"""
Projects API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List
from uuid import UUID

from app.core.database import get_db
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.models.project import Project
from app.models.project_member import ProjectMember, MemberRole
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectDetailResponse,
    ProjectMemberCreate,
    ProjectMemberUpdate,
    ProjectMemberResponse,
    ProjectMemberInfo,
    InviteMemberRequest
)
from app.api.dependencies import get_current_user, get_current_admin, verify_project_access

router = APIRouter()

# Default password for invited QA users
DEFAULT_QA_PASSWORD = "Test@123"


@router.get("", response_model=List[ProjectResponse])
async def list_projects(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all projects
    - Admin: sees all projects in their organization
    - QA: sees only projects they are members of
    """
    if current_user.is_admin:
        # Admin sees all projects in their organization
        result = await db.execute(
            select(Project)
            .options(selectinload(Project.members))
            .where(Project.organization_id == current_user.organization_id)
            .order_by(Project.created_at.desc())
        )
        projects = result.scalars().all()
    else:
        # QA sees only their projects
        result = await db.execute(
            select(Project)
            .join(ProjectMember)
            .options(selectinload(Project.members))
            .where(ProjectMember.user_id == current_user.id)
            .order_by(Project.created_at.desc())
        )
        projects = result.scalars().all()
    
    # Add member count to response
    return [
        ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            jira_project_key=p.jira_project_key,
            created_by=p.created_by,
            created_at=p.created_at,
            updated_at=p.updated_at,
            member_count=len(p.members)
        )
        for p in projects
    ]


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new project (Admin only)
    """
    new_project = Project(
        name=project_data.name,
        description=project_data.description,
        jira_project_key=project_data.jira_project_key,
        organization_id=current_user.organization_id,
        created_by=current_user.id
    )
    
    db.add(new_project)
    await db.commit()
    await db.refresh(new_project)
    
    return ProjectResponse(
        id=new_project.id,
        name=new_project.name,
        description=new_project.description,
        jira_project_key=new_project.jira_project_key,
        created_by=new_project.created_by,
        created_at=new_project.created_at,
        updated_at=new_project.updated_at,
        member_count=0
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Get project details with members
    """
    project = await verify_project_access(project_id, current_user, db)
    
    # Get members with user info
    result = await db.execute(
        select(ProjectMember, User)
        .join(User, ProjectMember.user_id == User.id)
        .where(ProjectMember.project_id == project_id)
    )
    members_data = result.all()
    
    members = [
        ProjectMemberInfo(
            id=pm.user_id,
            email=user.email,
            full_name=user.full_name,
            role=pm.role,
            added_at=pm.created_at
        )
        for pm, user in members_data
    ]
    
    return ProjectDetailResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        jira_project_key=project.jira_project_key,
        created_by=project.created_by,
        created_at=project.created_at,
        updated_at=project.updated_at,
        member_count=len(members),
        members=members
    )


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: UUID,
    project_data: ProjectUpdate,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Update a project (Admin only)
    """
    result = await db.execute(
        select(Project)
        .options(selectinload(Project.members))
        .where(Project.id == project_id)
        .where(Project.organization_id == current_user.organization_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update fields
    if project_data.name is not None:
        project.name = project_data.name
    if project_data.description is not None:
        project.description = project_data.description
    if project_data.jira_project_key is not None:
        project.jira_project_key = project_data.jira_project_key
    
    await db.commit()
    await db.refresh(project)
    
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        jira_project_key=project.jira_project_key,
        created_by=project.created_by,
        created_at=project.created_at,
        updated_at=project.updated_at,
        member_count=len(project.members)
    )


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a project (Admin only)
    """
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .where(Project.organization_id == current_user.organization_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    await db.delete(project)
    await db.commit()


# ==================== Member Management ====================

@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
async def list_project_members(
    project_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List members of a project
    """
    await verify_project_access(project_id, current_user, db)
    
    result = await db.execute(
        select(ProjectMember, User)
        .join(User, ProjectMember.user_id == User.id)
        .where(ProjectMember.project_id == project_id)
    )
    members_data = result.all()
    
    return [
        ProjectMemberResponse(
            id=pm.id,
            project_id=pm.project_id,
            user_id=pm.user_id,
            role=pm.role,
            added_by=pm.added_by,
            created_at=pm.created_at,
            user_email=user.email,
            user_full_name=user.full_name
        )
        for pm, user in members_data
    ]


@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
async def add_project_member_by_email(
    project_id: UUID,
    member_data: InviteMemberRequest,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Add a QA user to a project by email (Admin only)
    If user doesn't exist, creates a new QA user with default password
    """
    # Verify project exists and belongs to admin's org
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .where(Project.organization_id == current_user.organization_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user exists
    result = await db.execute(select(User).where(User.email == member_data.email))
    user = result.scalar_one_or_none()
    
    if user:
        # User exists - verify they're in the same org
        if user.organization_id != current_user.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User belongs to a different organization"
            )
    else:
        # Create new QA user with default password
        user = User(
            email=member_data.email,
            full_name=member_data.full_name,
            hashed_password=hash_password(DEFAULT_QA_PASSWORD),
            role=UserRole.QA.value,
            organization_id=current_user.organization_id,
            is_active=True,
            is_verified=False,
            must_change_password=True  # Force password change on first login
        )
        db.add(user)
        await db.flush()  # Get the user ID
    
    # Check if user is already a member
    result = await db.execute(
        select(ProjectMember)
        .where(ProjectMember.project_id == project_id)
        .where(ProjectMember.user_id == user.id)
    )
    existing_member = result.scalar_one_or_none()
    
    if existing_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this project"
        )
    
    # Create membership
    new_member = ProjectMember(
        project_id=project_id,
        user_id=user.id,
        role=MemberRole.MEMBER.value,
        added_by=current_user.id
    )
    
    db.add(new_member)
    await db.commit()
    await db.refresh(new_member)
    
    return ProjectMemberResponse(
        id=new_member.id,
        project_id=new_member.project_id,
        user_id=new_member.user_id,
        role=new_member.role,
        added_by=new_member.added_by,
        created_at=new_member.created_at,
        user_email=user.email,
        user_full_name=user.full_name
    )


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_project_member(
    project_id: UUID,
    user_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    """
    Remove a QA user from a project (Admin only)
    """
    # Verify project is in admin's org
    result = await db.execute(
        select(Project)
        .where(Project.id == project_id)
        .where(Project.organization_id == current_user.organization_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    result = await db.execute(
        select(ProjectMember)
        .where(ProjectMember.project_id == project_id)
        .where(ProjectMember.user_id == user_id)
    )
    member = result.scalar_one_or_none()
    
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this project"
        )
    
    await db.delete(member)
    await db.commit()
