"""
Asset ORM model — maps to the 'assets' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, Boolean, Integer, Numeric, Date, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum, AssetStatusEnum


class Asset(Base):
    __tablename__ = "assets"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_tag = Column(String(50), unique=True, nullable=False)
    asset_name = Column(String(255), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("asset_categories.id"), nullable=False)
    serial_number = Column(String(100), unique=True, nullable=True)
    manufacturer = Column(String(100), nullable=True)
    model = Column(String(100), nullable=True)
    purchase_date = Column(Date, nullable=True)
    purchase_cost = Column(Numeric(12, 2), nullable=True)
    asset_condition = Column(String(50), nullable=True)
    location = Column(String(255), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    is_bookable = Column(Boolean, default=False)
    photo_url = Column(Text, nullable=True)
    warranty_months = Column(Integer, nullable=True)
    document_url = Column(Text, nullable=True)
    current_status = Column(SAEnum(AssetStatusEnum, name="asset_status_enum", create_type=False), default=AssetStatusEnum.AVAILABLE)
    current_holder = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    # Relationships
    category = relationship("AssetCategory", lazy="selectin")
    department = relationship("Department", lazy="selectin")
    holder = relationship("User", foreign_keys=[current_holder], lazy="selectin")
    allocations = relationship("AssetAllocation", back_populates="asset", lazy="selectin")
    documents = relationship("AssetDocument", back_populates="asset", lazy="selectin")
