"""
Maintenance routes — raise, approve, reject, assign, start, resolve.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.constants import RoleEnum
from app.models.user import User
from app.schemas.maintenance import (
    MaintenanceCreate, MaintenanceTechnicianAssign,
    MaintenanceResolve, MaintenanceApprovalAction, MaintenanceResponse,
)
from app.schemas.common import PaginatedResponse
from app.services.maintenance_service import MaintenanceService

router = APIRouter(prefix="/maintenance", tags=["Maintenance"])


@router.get("", response_model=PaginatedResponse[MaintenanceResponse], summary="List requests")
async def list_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all maintenance requests."""
    service = MaintenanceService(db)
    requests, total = await service.list_requests(skip=skip, limit=limit)
    return PaginatedResponse(
        items=[service.to_response(r) for r in requests], total=total, skip=skip, limit=limit
    )


@router.post("", response_model=MaintenanceResponse, status_code=201, summary="Raise request")
async def raise_request(
    data: MaintenanceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Raise a maintenance request. All authenticated users."""
    service = MaintenanceService(db)
    request = await service.raise_request(data, raised_by=current_user.id)
    return service.to_response(request)


@router.get("/{request_id}", response_model=MaintenanceResponse, summary="Get request details")
async def get_request(
    request_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get maintenance request details."""
    service = MaintenanceService(db)
    request = await service.get_request(request_id)
    return service.to_response(request)


@router.patch("/{request_id}/approve", response_model=MaintenanceResponse, summary="Approve")
async def approve_request(
    request_id: UUID,
    data: MaintenanceApprovalAction | None = None,
    current_user: User = Depends(require_roles(RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Approve a maintenance request. Asset Manager only."""
    service = MaintenanceService(db)
    comments = data.comments if data else None
    request = await service.approve_request(request_id, approved_by=current_user.id, comments=comments)
    return service.to_response(request)


@router.patch("/{request_id}/reject", response_model=MaintenanceResponse, summary="Reject")
async def reject_request(
    request_id: UUID,
    data: MaintenanceApprovalAction | None = None,
    current_user: User = Depends(require_roles(RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Reject a maintenance request. Asset Manager only."""
    service = MaintenanceService(db)
    comments = data.comments if data else None
    request = await service.reject_request(request_id, rejected_by=current_user.id, comments=comments)
    return service.to_response(request)


@router.patch("/{request_id}/assign", response_model=MaintenanceResponse, summary="Assign technician")
async def assign_technician(
    request_id: UUID,
    data: MaintenanceTechnicianAssign,
    current_user: User = Depends(require_roles(RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Assign a technician to an approved request. Asset Manager only."""
    service = MaintenanceService(db)
    request = await service.assign_technician(request_id, data, assigned_by=current_user.id)
    return service.to_response(request)


@router.patch("/{request_id}/start", response_model=MaintenanceResponse, summary="Start maintenance")
async def start_maintenance(
    request_id: UUID,
    current_user: User = Depends(require_roles(RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Mark maintenance as in progress. Asset Manager only."""
    service = MaintenanceService(db)
    request = await service.start_maintenance(request_id, started_by=current_user.id)
    return service.to_response(request)


@router.patch("/{request_id}/resolve", response_model=MaintenanceResponse, summary="Resolve")
async def resolve_request(
    request_id: UUID,
    data: MaintenanceResolve,
    current_user: User = Depends(require_roles(RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Resolve maintenance. Asset reverts to AVAILABLE. Asset Manager only."""
    service = MaintenanceService(db)
    request = await service.resolve_request(request_id, data, resolved_by=current_user.id)
    return service.to_response(request)
