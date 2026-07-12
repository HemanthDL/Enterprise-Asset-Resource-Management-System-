"""
AuditAsset ORM model — maps to the 'audit_assets' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum, VerificationStatusEnum


class AuditAsset(Base):
    __tablename__ = "audit_assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_cycle_id = Column(UUID(as_uuid=True), ForeignKey("audit_cycles.id"), nullable=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=True)
    auditor = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    verification_status = Column(SAEnum(VerificationStatusEnum, name="verification_status_enum", create_type=False), nullable=True)
    remarks = Column(Text, nullable=True)
    verified_date = Column(TIMESTAMP(timezone=True), nullable=True)

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    # Relationships
    audit_cycle = relationship("AuditCycle", back_populates="audit_assets")
    asset = relationship("Asset", lazy="selectin")
    auditor_user = relationship("User", lazy="selectin")
