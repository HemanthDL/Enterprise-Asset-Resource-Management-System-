"""
Booking service — time-slot booking with overlap validation.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import BookingStatusEnum, StatusEnum
from app.exceptions.handlers import NotFoundException, ConflictException, BadRequestException
from app.models.resource_booking import ResourceBooking
from app.models.activity_log import ActivityLog
from app.models.notification import Notification
from app.repositories.booking_repository import BookingRepository
from app.repositories.asset_repository import AssetRepository
from app.schemas.resource_booking import BookingCreate, BookingResponse

logger = logging.getLogger("assetflow.bookings")


class BookingService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.booking_repo = BookingRepository(db)
        self.asset_repo = AssetRepository(db)

    async def create_booking(self, data: BookingCreate, booked_by: UUID) -> ResourceBooking:
        """
        Book a shared resource by time slot.
        Validates: asset is bookable, no overlapping bookings.
        """
        asset = await self.asset_repo.get_by_id(data.asset_id)
        if not asset:
            raise NotFoundException(message="Resource not found")

        if not asset.is_bookable:
            raise BadRequestException(
                message="This asset is not a bookable resource",
                detail="Only assets marked as 'bookable' can be reserved.",
            )

        # Check for overlapping bookings
        overlaps = await self.booking_repo.find_overlapping_bookings(
            asset_id=data.asset_id,
            start_dt=data.start_datetime,
            end_dt=data.end_datetime,
        )
        if overlaps:
            existing = overlaps[0]
            raise ConflictException(
                message="Booking overlaps with an existing reservation",
                detail=(
                    f"Conflict with booking from "
                    f"{existing.start_datetime.isoformat()} to {existing.end_datetime.isoformat()}"
                ),
            )

        # Create booking
        booking = ResourceBooking(
            asset_id=data.asset_id,
            booked_by=booked_by,
            department_id=data.department_id,
            start_datetime=data.start_datetime,
            end_datetime=data.end_datetime,
            purpose=data.purpose,
            booking_status=BookingStatusEnum.UPCOMING,
            created_by=booked_by,
            updated_by=booked_by,
        )
        booking = await self.booking_repo.create(booking)

        # Notify
        self.db.add(Notification(
            recipient=booked_by,
            title="Booking Confirmed",
            message=f"Your booking for {asset.asset_name} on {data.start_datetime.isoformat()} has been confirmed.",
            notification_type="BOOKING_CONFIRMED",
            created_by=booked_by,
        ))

        self.db.add(ActivityLog(
            user_id=booked_by, module="BOOKINGS", action="CREATE", record_id=booking.id
        ))
        await self.booking_repo.commit()

        logger.info("Booking created for asset %s by %s", data.asset_id, booked_by)
        return booking

    async def get_booking(self, booking_id: UUID) -> ResourceBooking:
        """Get booking by ID or raise 404."""
        booking = await self.booking_repo.get_by_id(booking_id)
        if not booking:
            raise NotFoundException(message="Booking not found")
        return booking

    async def cancel_booking(self, booking_id: UUID, cancelled_by: UUID) -> ResourceBooking:
        """Cancel a booking."""
        booking = await self.get_booking(booking_id)

        if booking.booking_status not in (BookingStatusEnum.UPCOMING, BookingStatusEnum.ONGOING):
            raise BadRequestException(message="Only upcoming or ongoing bookings can be cancelled")

        await self.booking_repo.update_fields(booking_id, {
            "booking_status": BookingStatusEnum.CANCELLED,
            "updated_by": cancelled_by,
        })

        self.db.add(Notification(
            recipient=booking.booked_by,
            title="Booking Cancelled",
            message=f"Your booking has been cancelled.",
            notification_type="BOOKING_CANCELLED",
            created_by=cancelled_by,
        ))

        self.db.add(ActivityLog(
            user_id=cancelled_by, module="BOOKINGS", action="CANCEL", record_id=booking_id
        ))
        await self.booking_repo.commit()

        return await self.get_booking(booking_id)

    async def list_bookings(self, skip: int = 0, limit: int = 20) -> tuple[list[ResourceBooking], int]:
        """List all bookings."""
        bookings = await self.booking_repo.get_all(
            skip=skip, limit=limit,
            filters=[ResourceBooking.status == StatusEnum.ACTIVE]
        )
        total = await self.booking_repo.count(
            filters=[ResourceBooking.status == StatusEnum.ACTIVE]
        )
        return bookings, total

    async def get_resource_bookings(self, asset_id: UUID, skip: int = 0, limit: int = 50) -> list[ResourceBooking]:
        """Calendar view — all bookings for a resource."""
        return await self.booking_repo.get_bookings_for_resource(asset_id, skip=skip, limit=limit)

    def to_response(self, b: ResourceBooking) -> BookingResponse:
        """Convert model to response DTO."""
        return BookingResponse(
            id=b.id,
            asset_id=b.asset_id,
            asset_tag=b.asset.asset_tag if b.asset else None,
            asset_name=b.asset.asset_name if b.asset else None,
            booked_by=b.booked_by,
            booker_name=f"{b.booker.first_name} {b.booker.last_name or ''}".strip() if b.booker else None,
            department_id=b.department_id,
            department_name=b.department.department_name if b.department else None,
            start_datetime=b.start_datetime,
            end_datetime=b.end_datetime,
            purpose=b.purpose,
            booking_status=b.booking_status,
            status=b.status,
            created_datetime=b.created_datetime,
        )
