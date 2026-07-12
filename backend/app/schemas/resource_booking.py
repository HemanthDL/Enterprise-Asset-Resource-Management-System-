"""
Resource Booking DTOs.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, model_validator

from app.core.constants import BookingStatusEnum, StatusEnum


class BookingCreate(BaseModel):
    """Book a shared resource (room, vehicle, equipment) by time slot."""
    asset_id: UUID
    department_id: UUID | None = None
    start_datetime: datetime
    end_datetime: datetime
    purpose: str | None = None

    @model_validator(mode="after")
    def validate_dates(self):
        if self.end_datetime <= self.start_datetime:
            raise ValueError("end_datetime must be after start_datetime")
        return self


class BookingResponse(BaseModel):
    """Booking details."""
    id: UUID
    asset_id: UUID
    asset_tag: str | None = None
    asset_name: str | None = None
    booked_by: UUID
    booker_name: str | None = None
    department_id: UUID | None = None
    department_name: str | None = None
    start_datetime: datetime
    end_datetime: datetime
    purpose: str | None = None
    booking_status: BookingStatusEnum
    status: StatusEnum
    created_datetime: datetime | None = None

    model_config = {"from_attributes": True}
