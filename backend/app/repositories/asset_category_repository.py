"""
Asset Category repository.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset_category import AssetCategory
from app.repositories.base import BaseRepository
from app.core.constants import StatusEnum


class AssetCategoryRepository(BaseRepository[AssetCategory]):

    def __init__(self, db: AsyncSession):
        super().__init__(AssetCategory, db)

    async def get_by_name(self, name: str) -> AssetCategory | None:
        """Find category by name."""
        result = await self.db.execute(
            select(AssetCategory).where(AssetCategory.category_name == name)
        )
        return result.scalars().first()

    async def get_active_categories(self, skip: int = 0, limit: int = 20) -> list[AssetCategory]:
        """List active categories."""
        return await self.get_all(
            skip=skip, limit=limit, filters=[AssetCategory.status == StatusEnum.ACTIVE]
        )

    async def count_active(self) -> int:
        """Count active categories."""
        return await self.count(filters=[AssetCategory.status == StatusEnum.ACTIVE])
