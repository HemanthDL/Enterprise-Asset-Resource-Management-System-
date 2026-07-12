"""
AssetStatusHistory ORM model — maps to the 'asset_status_history' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum, AssetStatusEnum


class AssetStatusHistory(Base):
    __tablename__ = "asset_status_history"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    old_status = Column(SAEnum(AssetStatusEnum, name="asset_status_enum", create_type=False), nullable=True)
    new_status = Column(SAEnum(AssetStatusEnum, name="asset_status_enum", create_type=False), nullable=True)
    changed_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    reason = Column(Text, nullable=True)
    changed_on = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    # Relationships
    asset = relationship("Asset", lazy="selectin")
    changer = relationship("User", lazy="selectin")
