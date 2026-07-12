"""
AuditCycle ORM model — maps to the 'audit_cycles' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum, AuditStatusEnum


class AuditCycle(Base):
    __tablename__ = "audit_cycles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_name = Column(String(255), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    location = Column(String(255), nullable=True)
    start_date = Column(Date, nullable=True)
    end_date = Column(Date, nullable=True)
    assigned_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    audit_status = Column(SAEnum(AuditStatusEnum, name="audit_status_enum", create_type=False), default=AuditStatusEnum.OPEN)

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    # Relationships
    department = relationship("Department", lazy="selectin")
    assigner = relationship("User", lazy="selectin")
    audit_assets = relationship("AuditAsset", back_populates="audit_cycle", lazy="selectin")
