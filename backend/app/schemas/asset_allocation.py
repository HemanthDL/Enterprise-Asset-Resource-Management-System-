"""
Asset Allocation DTOs: allocate, return, response.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.core.constants import AllocationStatusEnum, StatusEnum


class AllocationCreate(BaseModel):
    """Allocate an asset to an employee/department."""
    asset_id: UUID
    employee_id: UUID | None = None
    department_id: UUID | None = None
    expected_return_date: datetime | None = None


class AllocationReturn(BaseModel):
    """Return an allocated asset."""
    check_in_notes: str | None = None
    asset_condition: str | None = None


class AllocationResponse(BaseModel):
    """Allocation details."""
    id: UUID
    asset_id: UUID
    asset_tag: str | None = None
    asset_name: str | None = None
    employee_id: UUID | None = None
    employee_name: str | None = None
    department_id: UUID | None = None
    department_name: str | None = None
    allocated_date: datetime | None = None
    expected_return_date: datetime | None = None
    actual_return_date: datetime | None = None
    allocation_status: AllocationStatusEnum
    check_in_notes: str | None = None
    status: StatusEnum
    created_datetime: datetime | None = None

    model_config = {"from_attributes": True}


class AllocationConflict(BaseModel):
    """Returned when asset is already allocated — includes current holder info."""
    message: str
    current_holder_id: UUID
    current_holder_name: str
    current_allocation_id: UUID
    suggestion: str = "Use the Transfer Request endpoint to request this asset."
