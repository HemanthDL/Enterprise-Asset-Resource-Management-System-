"""
Activity log repository.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog
from app.repositories.base import BaseRepository


class ActivityLogRepository(BaseRepository[ActivityLog]):

    def __init__(self, db: AsyncSession):
        super().__init__(ActivityLog, db)

    async def get_logs(
        self,
        skip: int = 0,
        limit: int = 20,
        user_id: UUID | None = None,
        module: str | None = None,
        action: str | None = None,
    ) -> list[ActivityLog]:
        """Get activity logs with optional filters."""
        filters = []
        if user_id:
            filters.append(ActivityLog.user_id == user_id)
        if module:
            filters.append(ActivityLog.module == module)
        if action:
            filters.append(ActivityLog.action == action)
        return await self.get_all(skip=skip, limit=limit, filters=filters)

    async def count_logs(
        self,
        user_id: UUID | None = None,
        module: str | None = None,
        action: str | None = None,
    ) -> int:
        """Count activity logs with optional filters."""
        filters = []
        if user_id:
            filters.append(ActivityLog.user_id == user_id)
        if module:
            filters.append(ActivityLog.module == module)
        if action:
            filters.append(ActivityLog.action == action)
        return await self.count(filters=filters)
