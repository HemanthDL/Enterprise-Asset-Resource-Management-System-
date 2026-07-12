"""
AssetCategory ORM model — maps to the 'asset_categories' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP

from app.db.base import Base
from app.core.constants import StatusEnum


class AssetCategory(Base):
    __tablename__ = "asset_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(255), nullable=True)

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)
