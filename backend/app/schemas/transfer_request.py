"""
Transfer Request DTOs.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.core.constants import TransferStatusEnum, StatusEnum


class TransferCreate(BaseModel):
    """Request a transfer of an asset from current holder to another employee."""
    asset_id: UUID
    to_employee: UUID
    reason: str | None = None


class TransferApproval(BaseModel):
    """Approve or reject a transfer request."""
    comments: str | None = None


class TransferResponse(BaseModel):
    """Transfer request details."""
    id: UUID
    asset_id: UUID
    asset_tag: str | None = None
    asset_name: str | None = None
    from_employee: UUID
    from_employee_name: str | None = None
    to_employee: UUID
    to_employee_name: str | None = None
    reason: str | None = None
    approval_status: TransferStatusEnum
    approved_by: UUID | None = None
    approver_name: str | None = None
    approval_date: datetime | None = None
    comments: str | None = None
    status: StatusEnum
    created_datetime: datetime | None = None

    model_config = {"from_attributes": True}
