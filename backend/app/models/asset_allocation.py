"""
AssetAllocation ORM model — maps to the 'asset_allocations' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum, AllocationStatusEnum


class AssetAllocation(Base):
    __tablename__ = "asset_allocations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    employee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    allocated_date = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    expected_return_date = Column(TIMESTAMP(timezone=True), nullable=True)
    actual_return_date = Column(TIMESTAMP(timezone=True), nullable=True)
    allocation_status = Column(SAEnum(AllocationStatusEnum, name="allocation_status_enum", create_type=False), default=AllocationStatusEnum.ALLOCATED)
    check_in_notes = Column(Text, nullable=True)

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    # Relationships
    asset = relationship("Asset", back_populates="allocations")
    employee = relationship("User", lazy="selectin")
    department = relationship("Department", lazy="selectin")
