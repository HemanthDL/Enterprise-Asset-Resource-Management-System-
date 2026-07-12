"""
Department DTOs: create, update, response.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import StatusEnum


class DepartmentCreate(BaseModel):
    """Create a new department."""
    department_name: str = Field(..., min_length=1, max_length=100)
    department_code: str = Field(..., min_length=1, max_length=20)
    parent_department_id: UUID | None = None
    description: str | None = None
    department_head_id: UUID | None = None


class DepartmentUpdate(BaseModel):
    """Update department fields."""
    department_name: str | None = Field(None, min_length=1, max_length=100)
    department_code: str | None = Field(None, min_length=1, max_length=20)
    parent_department_id: UUID | None = None
    description: str | None = None
    department_head_id: UUID | None = None


class DepartmentResponse(BaseModel):
    """Department details."""
    id: UUID
    department_name: str
    department_code: str
    parent_department_id: UUID | None = None
    description: str | None = None
    department_head_id: UUID | None = None
    department_head_name: str | None = None
    status: StatusEnum
    created_datetime: datetime | None = None

    model_config = {"from_attributes": True}
