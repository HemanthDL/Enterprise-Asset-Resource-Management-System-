"""
Transfer routes — request, approve, reject, complete.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query, Body
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.constants import RoleEnum
from app.models.user import User
from app.schemas.transfer_request import TransferCreate, TransferApproval, TransferResponse
from app.schemas.common import PaginatedResponse
from app.services.transfer_service import TransferService

router = APIRouter(prefix="/transfers", tags=["Transfer Requests"])


@router.get("", response_model=PaginatedResponse[TransferResponse], summary="List transfers")
async def list_transfers(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER, RoleEnum.DEPARTMENT_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """List all transfer requests."""
    service = TransferService(db)
    transfers, total = await service.list_transfers(skip=skip, limit=limit)
    return PaginatedResponse(
        items=[service.to_response(t) for t in transfers], total=total, skip=skip, limit=limit
    )


@router.post("", response_model=TransferResponse, status_code=201, summary="Request transfer")
async def request_transfer(
    data: TransferCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Request a transfer of an asset. All authenticated users."""
    service = TransferService(db)
    transfer = await service.create_transfer(data, requested_by=current_user.id)
    return service.to_response(transfer)


@router.patch("/{transfer_id}/approve", response_model=TransferResponse, summary="Approve transfer")
async def approve_transfer(
    transfer_id: UUID,
    data: TransferApproval | None = Body(None),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER, RoleEnum.DEPARTMENT_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """Approve a transfer request."""
    service = TransferService(db)
    comments = data.comments if data else None
    transfer = await service.approve_transfer(transfer_id, approved_by=current_user.id, comments=comments)
    return service.to_response(transfer)


@router.patch("/{transfer_id}/reject", response_model=TransferResponse, summary="Reject transfer")
async def reject_transfer(
    transfer_id: UUID,
    data: TransferApproval | None = Body(None),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER, RoleEnum.DEPARTMENT_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """Reject a transfer request."""
    service = TransferService(db)
    comments = data.comments if data else None
    transfer = await service.reject_transfer(transfer_id, rejected_by=current_user.id, comments=comments)
    return service.to_response(transfer)


@router.patch("/{transfer_id}/complete", response_model=TransferResponse, summary="Complete transfer")
async def complete_transfer(
    transfer_id: UUID,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Complete an approved transfer — re-allocate the asset."""
    service = TransferService(db)
    transfer = await service.complete_transfer(transfer_id, completed_by=current_user.id)
    return service.to_response(transfer)
