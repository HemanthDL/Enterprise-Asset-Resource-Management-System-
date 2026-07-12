"""
ActivityLog ORM model — maps to the 'activity_logs' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base


class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    module = Column(String(100), nullable=True)
    action = Column(String(100), nullable=True)
    record_id = Column(UUID(as_uuid=True), nullable=True)
    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    user = relationship("User", lazy="selectin")
