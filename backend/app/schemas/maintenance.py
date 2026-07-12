"""
Maintenance DTOs: create request, workflow actions, response.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.core.constants import MaintenanceStatusEnum, StatusEnum


class MaintenanceCreate(BaseModel):
    """Raise a maintenance request for an asset."""
    asset_id: UUID
    issue_description: str
    priority: str | None = "MEDIUM"  # LOW, MEDIUM, HIGH, CRITICAL
    attachment_url: str | None = None


class MaintenanceTechnicianAssign(BaseModel):
    """Assign a technician to an approved request."""
    technician_id: UUID


class MaintenanceResolve(BaseModel):
    """Resolve a maintenance request."""
    resolution_notes: str | None = None


class MaintenanceApprovalAction(BaseModel):
    """Action body for approve/reject."""
    comments: str | None = None


class MaintenanceResponse(BaseModel):
    """Maintenance request details."""
    id: UUID
    asset_id: UUID
    asset_tag: str | None = None
    asset_name: str | None = None
    raised_by: UUID
    raiser_name: str | None = None
    issue_description: str | None = None
    priority: str | None = None
    attachment_url: str | None = None
    approval_status: MaintenanceStatusEnum
    approved_by: UUID | None = None
    approver_name: str | None = None
    technician: UUID | None = None
    technician_name: str | None = None
    resolved_date: datetime | None = None
    resolution_notes: str | None = None
    status: StatusEnum
    created_datetime: datetime | None = None

    model_config = {"from_attributes": True}


class MaintenanceHistoryResponse(BaseModel):
    """Maintenance history entry."""
    id: UUID
    maintenance_request_id: UUID
    asset_id: UUID
    action_taken: str | None = None
    performed_by: UUID | None = None
    performer_name: str | None = None
    remarks: str | None = None
    performed_date: datetime | None = None

    model_config = {"from_attributes": True}
