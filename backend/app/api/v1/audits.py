"""
Audit routes — create, add assets, verify, close, discrepancy report.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.constants import RoleEnum
from app.models.user import User
from app.schemas.audit import (
    AuditCycleCreate, AuditAssetAdd, AuditAssetVerify,
    AuditCycleResponse, AuditAssetResponse, DiscrepancyReport,
)
from app.schemas.common import PaginatedResponse, StandardResponse
from app.services.audit_service import AuditService

router = APIRouter(prefix="/audits", tags=["Audits"])


@router.get("", response_model=PaginatedResponse[AuditCycleResponse], summary="List audit cycles")
async def list_cycles(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """List all audit cycles. Admin and Asset Manager."""
    service = AuditService(db)
    cycles, total = await service.list_cycles(skip=skip, limit=limit)
    items = [await service.to_response(c) for c in cycles]
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.post("", response_model=AuditCycleResponse, status_code=201, summary="Create audit cycle")
async def create_cycle(
    data: AuditCycleCreate,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new audit cycle."""
    service = AuditService(db)
    cycle = await service.create_cycle(data, created_by=current_user.id)
    return await service.to_response(cycle)


@router.get("/{cycle_id}", response_model=AuditCycleResponse, summary="Get audit cycle")
async def get_cycle(
    cycle_id: UUID,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Get audit cycle details with counts."""
    service = AuditService(db)
    cycle = await service.get_cycle(cycle_id)
    return await service.to_response(cycle)


@router.post("/{cycle_id}/assets", response_model=StandardResponse, summary="Add assets to cycle")
async def add_assets(
    cycle_id: UUID,
    data: AuditAssetAdd,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Add assets and assign auditor to an audit cycle."""
    service = AuditService(db)
    created = await service.add_assets(cycle_id, data, added_by=current_user.id)
    return StandardResponse(
        success=True,
        message=f"{len(created)} assets added to audit cycle",
    )


@router.patch("/{cycle_id}/verify", response_model=AuditAssetResponse, summary="Verify asset")
async def verify_asset(
    cycle_id: UUID,
    data: AuditAssetVerify,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Auditor verifies an asset in a cycle."""
    service = AuditService(db)
    audit_asset = await service.verify_asset(cycle_id, data, verified_by=current_user.id)
    return service._audit_asset_response(audit_asset)


@router.patch("/{cycle_id}/close", response_model=AuditCycleResponse, summary="Close audit cycle")
async def close_cycle(
    cycle_id: UUID,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Close audit cycle — locks it and updates affected asset statuses."""
    service = AuditService(db)
    cycle = await service.close_cycle(cycle_id, closed_by=current_user.id)
    return await service.to_response(cycle)


@router.get("/{cycle_id}/discrepancies", response_model=DiscrepancyReport, summary="Discrepancy report")
async def get_discrepancy_report(
    cycle_id: UUID,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Auto-generated discrepancy report for flagged items."""
    service = AuditService(db)
    return await service.get_discrepancy_report(cycle_id)


@router.get("/{cycle_id}/assets", response_model=list[AuditAssetResponse], summary="List assets in cycle")
async def list_cycle_assets(
    cycle_id: UUID,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """List all assets assigned to an audit cycle."""
    service = AuditService(db)
    assets = await service.audit_repo.get_audit_assets(cycle_id)
    return [service._audit_asset_response(a) for a in assets]
