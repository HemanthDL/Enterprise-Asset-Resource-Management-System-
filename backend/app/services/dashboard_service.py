"""
Dashboard service — KPI aggregation from existing tables.
"""

from datetime import datetime, timezone, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AssetStatusEnum, AllocationStatusEnum
from app.repositories.asset_repository import AssetRepository
from app.repositories.allocation_repository import AllocationRepository
from app.repositories.booking_repository import BookingRepository
from app.repositories.transfer_repository import TransferRepository
from app.repositories.maintenance_repository import MaintenanceRepository
from app.schemas.dashboard import DashboardKPIs, OverdueReturnItem


class DashboardService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.asset_repo = AssetRepository(db)
        self.alloc_repo = AllocationRepository(db)
        self.booking_repo = BookingRepository(db)
        self.transfer_repo = TransferRepository(db)
        self.maint_repo = MaintenanceRepository(db)

    async def get_kpis(self) -> DashboardKPIs:
        """Aggregate KPI data from all modules."""
        return DashboardKPIs(
            assets_available=await self.asset_repo.count_by_status(AssetStatusEnum.AVAILABLE),
            assets_allocated=await self.asset_repo.count_by_status(AssetStatusEnum.ALLOCATED),
            maintenance_today=await self.maint_repo.count_maintenance_today(),
            active_bookings=await self.booking_repo.count_active_bookings(),
            pending_transfers=await self.transfer_repo.count_pending(),
            upcoming_returns=await self.alloc_repo.count_upcoming_returns(days=7),
            overdue_returns=await self.alloc_repo.count_overdue(),
        )

    async def get_overdue_returns(self, skip: int = 0, limit: int = 20) -> list[OverdueReturnItem]:
        """Get detailed overdue return list."""
        allocations = await self.alloc_repo.get_overdue_allocations(skip=skip, limit=limit)
        now = datetime.now(timezone.utc)

        items = []
        for alloc in allocations:
            days_overdue = (now - alloc.expected_return_date).days if alloc.expected_return_date else 0
            emp_name = None
            if alloc.employee:
                emp_name = f"{alloc.employee.first_name} {alloc.employee.last_name or ''}".strip()

            items.append(OverdueReturnItem(
                allocation_id=alloc.id,
                asset_id=alloc.asset_id,
                asset_tag=alloc.asset.asset_tag if alloc.asset else None,
                asset_name=alloc.asset.asset_name if alloc.asset else None,
                employee_id=alloc.employee_id,
                employee_name=emp_name,
                expected_return_date=alloc.expected_return_date,
                days_overdue=days_overdue,
            ))

        return items
