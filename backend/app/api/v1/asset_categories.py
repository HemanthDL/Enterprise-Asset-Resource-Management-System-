"""
Asset Category routes.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.constants import RoleEnum
from app.models.user import User
from app.schemas.asset_category import AssetCategoryCreate, AssetCategoryUpdate, AssetCategoryResponse
from app.schemas.common import PaginatedResponse
from app.services.asset_category_service import AssetCategoryService

router = APIRouter(prefix="/asset-categories", tags=["Asset Categories"])


@router.get("", response_model=PaginatedResponse[AssetCategoryResponse], summary="List categories")
async def list_categories(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List active asset categories."""
    service = AssetCategoryService(db)
    cats, total = await service.list_categories(skip=skip, limit=limit)
    return PaginatedResponse(
        items=[service.to_response(c) for c in cats], total=total, skip=skip, limit=limit
    )


@router.post("", response_model=AssetCategoryResponse, status_code=201, summary="Create category")
async def create_category(
    data: AssetCategoryCreate,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Create a new asset category. Admin only."""
    service = AssetCategoryService(db)
    cat = await service.create_category(data, created_by=current_user.id)
    return service.to_response(cat)


@router.put("/{cat_id}", response_model=AssetCategoryResponse, summary="Update category")
async def update_category(
    cat_id: UUID,
    data: AssetCategoryUpdate,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """Update an asset category. Admin only."""
    service = AssetCategoryService(db)
    cat = await service.update_category(cat_id, data, updated_by=current_user.id)
    return service.to_response(cat)
