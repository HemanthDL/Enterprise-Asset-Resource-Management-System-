"""
ResourceBooking ORM model — maps to the 'resource_bookings' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Text, ForeignKey, CheckConstraint, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum, BookingStatusEnum


class ResourceBooking(Base):
    __tablename__ = "resource_bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    booked_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    start_datetime = Column(TIMESTAMP(timezone=True), nullable=False)
    end_datetime = Column(TIMESTAMP(timezone=True), nullable=False)
    purpose = Column(Text, nullable=True)
    booking_status = Column(SAEnum(BookingStatusEnum, name="booking_status_enum", create_type=False), default=BookingStatusEnum.UPCOMING)

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    __table_args__ = (
        CheckConstraint("end_datetime > start_datetime", name="chk_booking_dates"),
    )

    # Relationships
    asset = relationship("Asset", lazy="selectin")
    booker = relationship("User", lazy="selectin")
    department = relationship("Department", lazy="selectin")
