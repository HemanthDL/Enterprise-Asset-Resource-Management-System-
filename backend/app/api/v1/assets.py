"""
Asset routes — registration, search, lifecycle, history.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.constants import RoleEnum, AssetStatusEnum
from app.models.user import User
from app.schemas.asset import AssetCreate, AssetUpdate, AssetStatusChange, AssetResponse
from app.schemas.common import PaginatedResponse, StandardResponse
from app.services.asset_service import AssetService

router = APIRouter(prefix="/assets", tags=["Assets"])


@router.get("", response_model=PaginatedResponse[AssetResponse], summary="List/search assets")
async def list_assets(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    asset_tag: str | None = None,
    serial_number: str | None = None,
    category_id: UUID | None = None,
    current_status: AssetStatusEnum | None = None,
    department_id: UUID | None = None,
    location: str | None = None,
    is_bookable: bool | None = None,
    search: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Search and filter assets. All authenticated users."""
    service = AssetService(db)
    assets, total = await service.search_assets(
        skip=skip, limit=limit,
        asset_tag=asset_tag, serial_number=serial_number,
        category_id=category_id, current_status=current_status,
        department_id=department_id, location=location,
        is_bookable=is_bookable, search=search,
    )
    return PaginatedResponse(
        items=[service.to_response(a) for a in assets], total=total, skip=skip, limit=limit
    )


@router.post("", response_model=AssetResponse, status_code=201, summary="Register asset")
async def register_asset(
    data: AssetCreate,
    current_user: User = Depends(require_roles(RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Register a new asset. Asset Manager only."""
    service = AssetService(db)
    asset = await service.register_asset(data, created_by=current_user.id)
    return service.to_response(asset)


@router.get("/{asset_id}", response_model=AssetResponse, summary="Get asset details")
async def get_asset(
    asset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get asset details with relationships."""
    service = AssetService(db)
    asset = await service.get_asset(asset_id)
    return service.to_response(asset)


@router.put("/{asset_id}", response_model=AssetResponse, summary="Update asset")
async def update_asset(
    asset_id: UUID,
    data: AssetUpdate,
    current_user: User = Depends(require_roles(RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Update asset fields. Asset Manager only."""
    service = AssetService(db)
    asset = await service.update_asset(asset_id, data, updated_by=current_user.id)
    return service.to_response(asset)


@router.patch("/{asset_id}/status", response_model=AssetResponse, summary="Change lifecycle status")
async def change_status(
    asset_id: UUID,
    data: AssetStatusChange,
    current_user: User = Depends(require_roles(RoleEnum.ASSET_MANAGER)),
    db: AsyncSession = Depends(get_db),
):
    """Change asset lifecycle status with transition validation. Asset Manager only."""
    service = AssetService(db)
    asset = await service.change_status(asset_id, data, changed_by=current_user.id)
    return service.to_response(asset)


@router.get("/{asset_id}/history", response_model=StandardResponse, summary="Get asset history")
async def get_asset_history(
    asset_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get status + allocation history for an asset."""
    service = AssetService(db)
    history = await service.get_asset_history(asset_id)

    # Serialize history items
    status_history = [
        {
            "id": str(h.id),
            "old_status": h.old_status.value if h.old_status else None,
            "new_status": h.new_status.value if h.new_status else None,
            "changed_by": str(h.changed_by) if h.changed_by else None,
            "reason": h.reason,
            "changed_on": h.changed_on.isoformat() if h.changed_on else None,
        }
        for h in history["status_history"]
    ]

    from app.services.allocation_service import AllocationService
    alloc_service = AllocationService(db)
    allocation_history = [
        alloc_service.to_response(a).model_dump(mode="json")
        for a in history["allocation_history"]
    ]

    return StandardResponse(
        success=True,
        message="Asset history retrieved",
        data={
            "status_history": status_history,
            "allocation_history": allocation_history,
        },
    )
