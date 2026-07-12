"""
MaintenanceRequest ORM model — maps to the 'maintenance_requests' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum, MaintenanceStatusEnum


class MaintenanceRequest(Base):
    __tablename__ = "maintenance_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    raised_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    issue_description = Column(Text, nullable=True)
    priority = Column(String(20), nullable=True)
    attachment_url = Column(Text, nullable=True)
    approval_status = Column(SAEnum(MaintenanceStatusEnum, name="maintenance_status_enum", create_type=False), default=MaintenanceStatusEnum.PENDING)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    technician = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    resolved_date = Column(TIMESTAMP(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    # Relationships
    asset = relationship("Asset", lazy="selectin")
    raiser = relationship("User", foreign_keys=[raised_by], lazy="selectin")
    approver = relationship("User", foreign_keys=[approved_by], lazy="selectin")
    assigned_technician = relationship("User", foreign_keys=[technician], lazy="selectin")
