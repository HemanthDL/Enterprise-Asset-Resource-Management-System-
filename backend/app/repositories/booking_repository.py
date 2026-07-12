"""
Resource booking repository — with overlap detection.
"""

from uuid import UUID
from datetime import datetime

from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.resource_booking import ResourceBooking
from app.repositories.base import BaseRepository
from app.core.constants import BookingStatusEnum, StatusEnum


class BookingRepository(BaseRepository[ResourceBooking]):

    def __init__(self, db: AsyncSession):
        super().__init__(ResourceBooking, db)

    async def find_overlapping_bookings(
        self,
        asset_id: UUID,
        start_dt: datetime,
        end_dt: datetime,
        exclude_id: UUID | None = None,
    ) -> list[ResourceBooking]:
        """
        Find bookings that overlap with the given time range for an asset.
        Overlap: existing.start < new.end AND existing.end > new.start
        """
        conditions = [
            ResourceBooking.asset_id == asset_id,
            ResourceBooking.start_datetime < end_dt,
            ResourceBooking.end_datetime > start_dt,
            ResourceBooking.booking_status.in_([
                BookingStatusEnum.UPCOMING,
                BookingStatusEnum.ONGOING,
            ]),
            ResourceBooking.status == StatusEnum.ACTIVE,
        ]
        if exclude_id:
            conditions.append(ResourceBooking.id != exclude_id)

        result = await self.db.execute(
            select(ResourceBooking).where(and_(*conditions))
        )
        return list(result.scalars().all())

    async def get_bookings_for_resource(
        self, asset_id: UUID, skip: int = 0, limit: int = 50
    ) -> list[ResourceBooking]:
        """Calendar view — get all bookings for a resource."""
        result = await self.db.execute(
            select(ResourceBooking)
            .where(
                and_(
                    ResourceBooking.asset_id == asset_id,
                    ResourceBooking.status == StatusEnum.ACTIVE,
                )
            )
            .order_by(ResourceBooking.start_datetime.asc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_active_bookings(self) -> int:
        """Count currently active (upcoming + ongoing) bookings."""
        return await self.count(
            filters=[
                ResourceBooking.booking_status.in_([
                    BookingStatusEnum.UPCOMING,
                    BookingStatusEnum.ONGOING,
                ]),
                ResourceBooking.status == StatusEnum.ACTIVE,
            ]
        )
