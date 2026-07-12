"""
AuditHistory ORM model — maps to the 'audit_history' table.
Tracks all entity-level changes for the full audit log.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP, JSONB
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum


class AuditHistory(Base):
    __tablename__ = "audit_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_name = Column(String(100), nullable=False)
    entity_id = Column(UUID(as_uuid=True), nullable=False)
    operation = Column(String(30), nullable=False)
    field_name = Column(String(100), nullable=True)
    old_value = Column(JSONB, nullable=True)
    new_value = Column(JSONB, nullable=True)
    performed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    performed_at = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    remarks = Column(Text, nullable=True)
    ip_address = Column(String(50), nullable=True)

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    # Relationships
    performer = relationship("User", lazy="selectin")
