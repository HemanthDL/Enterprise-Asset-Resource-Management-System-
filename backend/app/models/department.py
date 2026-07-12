"""
Department ORM model — maps to the 'departments' table.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, String, Text, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID, TIMESTAMP
from sqlalchemy.orm import relationship

from app.db.base import Base
from app.core.constants import StatusEnum


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_name = Column(String(100), nullable=False)
    department_code = Column(String(20), unique=True, nullable=False)
    parent_department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    description = Column(Text, nullable=True)
    department_head_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    created_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_by = Column(UUID(as_uuid=True), nullable=True)
    updated_datetime = Column(TIMESTAMP(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    updated_by = Column(UUID(as_uuid=True), nullable=True)
    status = Column(SAEnum(StatusEnum, name="status_enum", create_type=False), default=StatusEnum.ACTIVE)

    # Relationships
    parent_department = relationship("Department", remote_side="Department.id", lazy="selectin")
    department_head = relationship("User", foreign_keys=[department_head_id], lazy="selectin")
    users = relationship("User", back_populates="department", foreign_keys="User.department_id", lazy="selectin")
