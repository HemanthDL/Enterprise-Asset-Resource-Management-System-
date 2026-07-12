"""
Department routes — Admin only for CUD, read for all authenticated.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.constants import RoleEnum
from app.models.user import User
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse
from app.schemas.common import PaginatedResponse
from app.services.department_service import DepartmentService

router = APIRouter(prefix="/departments", tags=["Departments"])


@router.get("", response_model=PaginatedResponse[DepartmentResponse], summary="List departments")
async def list_departments(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List active departments. All authenticated users."""
    service = DepartmentService(db)
    depts, total = await service.list_departments(skip=skip, limit=limit)
    return PaginatedResponse(
        items=[service.to_response(d) for d in depts], total=total, skip=skip, limit=limit
    )


@router.post("", response_model=DepartmentResponse, status_code=201, summary="Create department")
async def create_department(
    data: DepartmentCreate,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new department. Admin only."""
    service = DepartmentService(db)
    dept = await service.create_department(data, created_by=current_user.id)
    return service.to_response(dept)


@router.get("/{dept_id}", response_model=DepartmentResponse, summary="Get department")
async def get_department(
    dept_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get department details."""
    service = DepartmentService(db)
    dept = await service.get_department(dept_id)
    return service.to_response(dept)


@router.put("/{dept_id}", response_model=DepartmentResponse, summary="Update department")
async def update_department(
    dept_id: UUID,
    data: DepartmentUpdate,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Update department. Admin only."""
    service = DepartmentService(db)
    dept = await service.update_department(dept_id, data, updated_by=current_user.id)
    return service.to_response(dept)


@router.patch("/{dept_id}/deactivate", response_model=DepartmentResponse, summary="Deactivate department")
async def deactivate_department(
    dept_id: UUID,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Soft-deactivate department. Admin only."""
    service = DepartmentService(db)
    dept = await service.deactivate_department(dept_id, deactivated_by=current_user.id)
    return service.to_response(dept)
