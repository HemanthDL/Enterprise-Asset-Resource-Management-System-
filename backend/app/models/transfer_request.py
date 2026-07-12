"""
TransferRequest ORM model — maps to the 'transfer_requests' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum, TransferStatusEnum


class TransferRequest(Base):
    __tablename__ = "transfer_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    from_employee = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    to_employee = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    reason = Column(Text, nullable=True)
    approval_status = Column(SAEnum(TransferStatusEnum, name="transfer_status_enum", create_type=False), default=TransferStatusEnum.REQUESTED)
    approved_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    approval_date = Column(TIMESTAMP(timezone=True), nullable=True)
    comments = Column(Text, nullable=True)

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    # Relationships
    asset = relationship("Asset", lazy="selectin")
    sender = relationship("User", foreign_keys=[from_employee], lazy="selectin")
    receiver = relationship("User", foreign_keys=[to_employee], lazy="selectin")
    approver = relationship("User", foreign_keys=[approved_by], lazy="selectin")
