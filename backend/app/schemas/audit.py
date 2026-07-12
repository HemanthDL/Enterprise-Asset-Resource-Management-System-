"""
Audit DTOs: create cycle, add assets, verify, discrepancy report, response.
"""

from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel

from app.core.constants import AuditStatusEnum, VerificationStatusEnum, StatusEnum


class AuditCycleCreate(BaseModel):
    """Create an audit cycle."""
    audit_name: str
    department_id: UUID | None = None
    location: str | None = None
    start_date: date
    end_date: date


class AuditAssetAdd(BaseModel):
    """Add assets and assign auditor to an audit cycle."""
    asset_ids: list[UUID]
    auditor_id: UUID


class AuditAssetVerify(BaseModel):
    """Auditor verifies a specific asset in a cycle."""
    audit_asset_id: UUID
    verification_status: VerificationStatusEnum
    remarks: str | None = None


class AuditCycleResponse(BaseModel):
    """Audit cycle details."""
    id: UUID
    audit_name: str | None = None
    department_id: UUID | None = None
    department_name: str | None = None
    location: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    assigned_by: UUID | None = None
    assigner_name: str | None = None
    audit_status: AuditStatusEnum
    status: StatusEnum
    created_datetime: datetime | None = None
    total_assets: int = 0
    verified_count: int = 0
    discrepancy_count: int = 0

    model_config = {"from_attributes": True}


class AuditAssetResponse(BaseModel):
    """Individual asset verification record."""
    id: UUID
    audit_cycle_id: UUID
    asset_id: UUID
    asset_tag: str | None = None
    asset_name: str | None = None
    auditor: UUID | None = None
    auditor_name: str | None = None
    verification_status: VerificationStatusEnum | None = None
    remarks: str | None = None
    verified_date: datetime | None = None

    model_config = {"from_attributes": True}


class DiscrepancyReport(BaseModel):
    """Auto-generated discrepancy report for flagged items."""
    audit_cycle_id: UUID
    audit_name: str | None = None
    total_assets: int
    verified: int
    missing: int
    damaged: int
    unverified: int
    flagged_items: list[AuditAssetResponse]
