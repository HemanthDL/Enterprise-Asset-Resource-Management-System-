"""
User routes — user management and role promotion (Admin only).
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.constants import RoleEnum
from app.models.user import User
from app.schemas.user import UserResponse, UserUpdate, UserPromote
from app.schemas.common import PaginatedResponse
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get(
    "",
    response_model=PaginatedResponse[UserResponse],
    summary="List users (Employee Directory)",
)
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    department_id: UUID | None = None,
    role: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all active users."""
    service = UserService(db)
    users, total = await service.list_users(skip=skip, limit=limit, department_id=department_id, role=role)
    return PaginatedResponse(
        items=[service.to_response(u) for u in users],
        total=total,
        skip=skip,
        limit=limit,
    )


@router.get(
    "/{user_id}",
    response_model=UserResponse,
    summary="Get user details",
)
async def get_user(
    user_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get user details. Admin/Asset Manager can view any user. Others can view themselves."""
    if current_user.role not in (RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER) and current_user.id != user_id:
        from fastapi import HTTPException, status
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot view other users' profiles")

    service = UserService(db)
    user = await service.get_user_by_id(user_id)
    return service.to_response(user)


@router.put(
    "/{user_id}",
    response_model=UserResponse,
    summary="Update user",
)
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Update user profile. Admin only."""
    service = UserService(db)
    user = await service.update_user(user_id, data, updated_by=current_user.id)
    return service.to_response(user)


@router.patch(
    "/{user_id}/promote",
    response_model=UserResponse,
    summary="Promote user role",
)
async def promote_user(
    user_id: UUID,
    data: UserPromote,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Promote Employee to Department Head or Asset Manager. Admin only."""
    service = UserService(db)
    user = await service.promote_user(user_id, data, promoted_by=current_user.id)
    return service.to_response(user)


@router.patch(
    "/{user_id}/deactivate",
    response_model=UserResponse,
    summary="Deactivate user",
)
async def deactivate_user(
    user_id: UUID,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Soft-deactivate a user. Admin only."""
    service = UserService(db)
    user = await service.deactivate_user(user_id, deactivated_by=current_user.id)
    return service.to_response(user)
