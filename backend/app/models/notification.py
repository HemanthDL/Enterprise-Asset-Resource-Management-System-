"""
Notification ORM model — maps to the 'notifications' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, Boolean, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    recipient = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    title = Column(String(255), nullable=True)
    message = Column(Text, nullable=True)
    notification_type = Column(String(100), nullable=True)
    is_read = Column(Boolean, default=False)
    sent_date = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    # Relationships
    recipient_user = relationship("User", lazy="selectin")
