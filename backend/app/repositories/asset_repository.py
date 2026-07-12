"""
Asset repository — database access for asset CRUD and search.
"""

from uuid import UUID

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset import Asset
from app.models.asset_status_history import AssetStatusHistory
from app.repositories.base import BaseRepository
from app.core.constants import StatusEnum, AssetStatusEnum


class AssetRepository(BaseRepository[Asset]):

    def __init__(self, db: AsyncSession):
        super().__init__(Asset, db)

    async def get_by_tag(self, tag: str) -> Asset | None:
        """Find asset by unique tag."""
        result = await self.db.execute(
            select(Asset).where(Asset.asset_tag == tag)
        )
        return result.scalars().first()

    async def get_by_serial(self, serial: str) -> Asset | None:
        """Find asset by serial number."""
        result = await self.db.execute(
            select(Asset).where(Asset.serial_number == serial)
        )
        return result.scalars().first()

    async def search_assets(
        self,
        skip: int = 0,
        limit: int = 20,
        asset_tag: str | None = None,
        serial_number: str | None = None,
        category_id: UUID | None = None,
        current_status: AssetStatusEnum | None = None,
        department_id: UUID | None = None,
        location: str | None = None,
        is_bookable: bool | None = None,
        search: str | None = None,
    ) -> list[Asset]:
        """Search assets with multiple filter criteria."""
        filters = [Asset.status == StatusEnum.ACTIVE]

        if asset_tag:
            filters.append(Asset.asset_tag.ilike(f"%{asset_tag}%"))
        if serial_number:
            filters.append(Asset.serial_number.ilike(f"%{serial_number}%"))
        if category_id:
            filters.append(Asset.category_id == category_id)
        if current_status:
            filters.append(Asset.current_status == current_status)
        if department_id:
            filters.append(Asset.department_id == department_id)
        if location:
            filters.append(Asset.location.ilike(f"%{location}%"))
        if is_bookable is not None:
            filters.append(Asset.is_bookable == is_bookable)
        if search:
            filters.append(
                or_(
                    Asset.asset_name.ilike(f"%{search}%"),
                    Asset.asset_tag.ilike(f"%{search}%"),
                    Asset.serial_number.ilike(f"%{search}%"),
                )
            )

        return await self.get_all(skip=skip, limit=limit, filters=filters)

    async def count_search(
        self,
        asset_tag: str | None = None,
        serial_number: str | None = None,
        category_id: UUID | None = None,
        current_status: AssetStatusEnum | None = None,
        department_id: UUID | None = None,
        location: str | None = None,
        is_bookable: bool | None = None,
        search: str | None = None,
    ) -> int:
        """Count assets matching search criteria."""
        filters = [Asset.status == StatusEnum.ACTIVE]

        if asset_tag:
            filters.append(Asset.asset_tag.ilike(f"%{asset_tag}%"))
        if serial_number:
            filters.append(Asset.serial_number.ilike(f"%{serial_number}%"))
        if category_id:
            filters.append(Asset.category_id == category_id)
        if current_status:
            filters.append(Asset.current_status == current_status)
        if department_id:
            filters.append(Asset.department_id == department_id)
        if location:
            filters.append(Asset.location.ilike(f"%{location}%"))
        if is_bookable is not None:
            filters.append(Asset.is_bookable == is_bookable)
        if search:
            filters.append(
                or_(
                    Asset.asset_name.ilike(f"%{search}%"),
                    Asset.asset_tag.ilike(f"%{search}%"),
                    Asset.serial_number.ilike(f"%{search}%"),
                )
            )

        return await self.count(filters=filters)

    async def count_by_status(self, asset_status: AssetStatusEnum) -> int:
        """Count assets with a specific lifecycle status."""
        return await self.count(
            filters=[Asset.status == StatusEnum.ACTIVE, Asset.current_status == asset_status]
        )

    async def get_status_history(self, asset_id: UUID) -> list[AssetStatusHistory]:
        """Get status change history for an asset."""
        result = await self.db.execute(
            select(AssetStatusHistory)
            .where(AssetStatusHistory.asset_id == asset_id)
            .order_by(AssetStatusHistory.changed_on.desc())
        )
        return list(result.scalars().all())
