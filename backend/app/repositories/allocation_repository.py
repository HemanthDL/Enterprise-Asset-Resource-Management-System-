"""
Allocation repository — database access for asset allocation operations.
"""

from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.asset_allocation import AssetAllocation
from app.repositories.base import BaseRepository
from app.core.constants import AllocationStatusEnum, StatusEnum


class AllocationRepository(BaseRepository[AssetAllocation]):

    def __init__(self, db: AsyncSession):
        super().__init__(AssetAllocation, db)

    async def find_active_allocation_by_asset(self, asset_id: UUID) -> AssetAllocation | None:
        """Find the current active allocation for an asset (ALLOCATED status)."""
        result = await self.db.execute(
            select(AssetAllocation).where(
                and_(
                    AssetAllocation.asset_id == asset_id,
                    AssetAllocation.allocation_status == AllocationStatusEnum.ALLOCATED,
                    AssetAllocation.status == StatusEnum.ACTIVE,
                )
            )
        )
        return result.scalars().first()

    async def get_overdue_allocations(self, skip: int = 0, limit: int = 20) -> list[AssetAllocation]:
        """Find allocations past their expected return date."""
        now = datetime.now(timezone.utc)
        result = await self.db.execute(
            select(AssetAllocation)
            .where(
                and_(
                    AssetAllocation.allocation_status == AllocationStatusEnum.ALLOCATED,
                    AssetAllocation.expected_return_date.isnot(None),
                    AssetAllocation.expected_return_date < now,
                    AssetAllocation.status == StatusEnum.ACTIVE,
                )
            )
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_overdue(self) -> int:
        """Count overdue allocations."""
        now = datetime.now(timezone.utc)
        return await self.count(
            filters=[
                AssetAllocation.allocation_status == AllocationStatusEnum.ALLOCATED,
                AssetAllocation.expected_return_date.isnot(None),
                AssetAllocation.expected_return_date < now,
                AssetAllocation.status == StatusEnum.ACTIVE,
            ]
        )

    async def get_allocations_by_asset(self, asset_id: UUID) -> list[AssetAllocation]:
        """Get allocation history for a specific asset."""
        result = await self.db.execute(
            select(AssetAllocation)
            .where(AssetAllocation.asset_id == asset_id)
            .order_by(AssetAllocation.allocated_date.desc())
        )
        return list(result.scalars().all())

    async def count_upcoming_returns(self, days: int = 7) -> int:
        """Count allocations with return dates within the next N days."""
        now = datetime.now(timezone.utc)
        from datetime import timedelta
        future = now + timedelta(days=days)
        return await self.count(
            filters=[
                AssetAllocation.allocation_status == AllocationStatusEnum.ALLOCATED,
                AssetAllocation.expected_return_date.isnot(None),
                AssetAllocation.expected_return_date >= now,
                AssetAllocation.expected_return_date <= future,
                AssetAllocation.status == StatusEnum.ACTIVE,
            ]
        )
