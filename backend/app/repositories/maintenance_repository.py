"""
Maintenance repository — maintenance requests and history.
"""

from uuid import UUID
from datetime import datetime, timezone, timedelta

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.maintenance_request import MaintenanceRequest
from app.models.maintenance_history import MaintenanceHistory
from app.repositories.base import BaseRepository
from app.core.constants import MaintenanceStatusEnum, StatusEnum


class MaintenanceRepository(BaseRepository[MaintenanceRequest]):

    def __init__(self, db: AsyncSession):
        super().__init__(MaintenanceRequest, db)

    async def count_maintenance_today(self) -> int:
        """Count maintenance requests created or active today."""
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
        today_end = today_start + timedelta(days=1)
        return await self.count(
            filters=[
                MaintenanceRequest.status == StatusEnum.ACTIVE,
                MaintenanceRequest.approval_status.in_([
                    MaintenanceStatusEnum.APPROVED,
                    MaintenanceStatusEnum.TECHNICIAN_ASSIGNED,
                    MaintenanceStatusEnum.IN_PROGRESS,
                ]),
            ]
        )

    async def get_history_for_request(self, request_id: UUID) -> list[MaintenanceHistory]:
        """Get maintenance history for a specific request."""
        result = await self.db.execute(
            select(MaintenanceHistory)
            .where(MaintenanceHistory.maintenance_request_id == request_id)
            .order_by(MaintenanceHistory.performed_date.desc())
        )
        return list(result.scalars().all())

    async def get_history_for_asset(self, asset_id: UUID) -> list[MaintenanceHistory]:
        """Get maintenance history for a specific asset."""
        result = await self.db.execute(
            select(MaintenanceHistory)
            .where(MaintenanceHistory.asset_id == asset_id)
            .order_by(MaintenanceHistory.performed_date.desc())
        )
        return list(result.scalars().all())

    async def create_history_entry(self, entry: MaintenanceHistory) -> MaintenanceHistory:
        """Insert a maintenance history record."""
        self.db.add(entry)
        await self.db.flush()
        await self.db.refresh(entry)
        return entry
