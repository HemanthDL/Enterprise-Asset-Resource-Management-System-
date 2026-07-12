"""
User DTOs: response, update, promote.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from app.core.constants import RoleEnum, StatusEnum


class UserResponse(BaseModel):
    """User details — never exposes password_hash."""
    id: UUID
    first_name: str
    last_name: str | None = None
    email: str
    phone: str | None = None
    department_id: UUID | None = None
    department_name: str | None = None
    role: RoleEnum
    status: StatusEnum
    last_login: datetime | None = None
    created_datetime: datetime | None = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    """Update user profile fields."""
    first_name: str | None = Field(None, min_length=1, max_length=100)
    last_name: str | None = Field(None, max_length=100)
    phone: str | None = Field(None, max_length=20)
    department_id: UUID | None = None


class UserPromote(BaseModel):
    """Promote an employee to Department Head or Asset Manager."""
    role: RoleEnum

    model_config = {"json_schema_extra": {"examples": [{"role": "DEPARTMENT_HEAD"}]}}
