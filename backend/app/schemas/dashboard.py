"""
Dashboard DTOs: KPI cards and overdue return summaries.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DashboardKPIs(BaseModel):
    """Real-time operational snapshot KPI cards."""
    assets_available: int = 0
    assets_allocated: int = 0
    maintenance_today: int = 0
    active_bookings: int = 0
    pending_transfers: int = 0
    upcoming_returns: int = 0
    overdue_returns: int = 0


class OverdueReturnItem(BaseModel):
    """An individual overdue return."""
    allocation_id: UUID
    asset_id: UUID
    asset_tag: str | None = None
    asset_name: str | None = None
    employee_id: UUID | None = None
    employee_name: str | None = None
    expected_return_date: datetime | None = None
    days_overdue: int = 0
