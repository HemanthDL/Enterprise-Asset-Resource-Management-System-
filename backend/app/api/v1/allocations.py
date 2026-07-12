"""
Allocation routes — allocate, return, list overdue.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.constants import RoleEnum
from app.models.user import User
from app.schemas.asset_allocation import AllocationCreate, AllocationReturn, AllocationResponse
from app.schemas.common import PaginatedResponse
from app.services.allocation_service import AllocationService

router = APIRouter(prefix="/allocations", tags=["Asset Allocations"])


@router.get("", response_model=PaginatedResponse[AllocationResponse], summary="List allocations")
async def list_allocations(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER, RoleEnum.DEPARTMENT_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """List all allocations."""
    service = AllocationService(db)
    allocs, total = await service.list_allocations(skip=skip, limit=limit)
    return PaginatedResponse(
        items=[service.to_response(a) for a in allocs], total=total, skip=skip, limit=limit
    )


@router.post("", response_model=AllocationResponse, status_code=201, summary="Allocate asset")
async def allocate_asset(
    data: AllocationCreate,
    current_user: User = Depends(require_roles(RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """
    Allocate asset to employee/department.
    Returns 409 Conflict with current holder info if asset is already taken.
    """
    service = AllocationService(db)
    alloc = await service.allocate_asset(data, allocated_by=current_user.id)
    return service.to_response(alloc)


@router.patch("/{allocation_id}/return", response_model=AllocationResponse, summary="Return asset")
async def return_asset(
    allocation_id: UUID,
    data: AllocationReturn,
    current_user: User = Depends(require_roles(RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Return an allocated asset. Captures condition check-in notes."""
    service = AllocationService(db)
    alloc = await service.return_asset(allocation_id, data, returned_by=current_user.id)
    return service.to_response(alloc)


@router.get("/overdue", response_model=list[AllocationResponse], summary="Overdue allocations")
async def get_overdue(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """List overdue allocations (past expected return date)."""
    service = AllocationService(db)
    allocs = await service.get_overdue(skip=skip, limit=limit)
    return [service.to_response(a) for a in allocs]
