"""
Asset Category service — category CRUD.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.handlers import NotFoundException, ConflictException, BadRequestException
from app.models.asset_category import AssetCategory
from app.models.activity_log import ActivityLog
from app.core.constants import StatusEnum
from app.repositories.asset_category_repository import AssetCategoryRepository
from app.schemas.asset_category import AssetCategoryCreate, AssetCategoryUpdate, AssetCategoryResponse

logger = logging.getLogger("assetflow.categories")


class AssetCategoryService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.cat_repo = AssetCategoryRepository(db)

    async def create_category(self, data: AssetCategoryCreate, created_by: UUID) -> AssetCategory:
        """Create a new asset category."""
        existing = await self.cat_repo.get_by_name(data.category_name)
        if existing:
            raise ConflictException(message="Category name already exists")

        category = AssetCategory(
            category_name=data.category_name,
            description=data.description,
            icon=data.icon,
            created_by=created_by,
            updated_by=created_by,
        )
        category = await self.cat_repo.create(category)

        self.db.add(ActivityLog(
            user_id=created_by, module="ASSET_CATEGORIES", action="CREATE", record_id=category.id
        ))
        await self.cat_repo.commit()

        logger.info("Category created: %s by %s", data.category_name, created_by)
        return category

    async def get_category(self, cat_id: UUID) -> AssetCategory:
        """Get category by ID or raise 404."""
        cat = await self.cat_repo.get_by_id(cat_id)
        if not cat:
            raise NotFoundException(message="Asset category not found")
        return cat

    async def list_categories(self, skip: int = 0, limit: int = 20) -> tuple[list[AssetCategory], int]:
        """List active categories."""
        cats = await self.cat_repo.get_active_categories(skip=skip, limit=limit)
        total = await self.cat_repo.count_active()
        return cats, total

    async def update_category(self, cat_id: UUID, data: AssetCategoryUpdate, updated_by: UUID) -> AssetCategory:
        """Update category fields."""
        await self.get_category(cat_id)

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise BadRequestException(message="No fields to update")

        if "category_name" in update_data:
            existing = await self.cat_repo.get_by_name(update_data["category_name"])
            if existing and existing.id != cat_id:
                raise ConflictException(message="Category name already exists")

        update_data["updated_by"] = updated_by
        cat = await self.cat_repo.update_fields(cat_id, update_data)

        self.db.add(ActivityLog(
            user_id=updated_by, module="ASSET_CATEGORIES", action="UPDATE", record_id=cat_id
        ))
        await self.cat_repo.commit()

        return cat

    def to_response(self, cat: AssetCategory) -> AssetCategoryResponse:
        """Convert model to response DTO."""
        return AssetCategoryResponse(
            id=cat.id,
            category_name=cat.category_name,
            description=cat.description,
            icon=cat.icon,
            status=cat.status,
            created_datetime=cat.created_datetime,
        )
