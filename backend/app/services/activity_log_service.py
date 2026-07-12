"""
Activity log service.
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.activity_log import ActivityLog
from app.repositories.activity_log_repository import ActivityLogRepository
from app.schemas.activity_log import ActivityLogResponse


class ActivityLogService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.log_repo = ActivityLogRepository(db)

    async def list_logs(
        self,
        skip: int = 0,
        limit: int = 20,
        user_id: UUID | None = None,
        module: str | None = None,
        action: str | None = None,
    ) -> tuple[list[ActivityLog], int]:
        """List activity logs with filters."""
        logs = await self.log_repo.get_logs(
            skip=skip, limit=limit, user_id=user_id, module=module, action=action
        )
        total = await self.log_repo.count_logs(
            user_id=user_id, module=module, action=action
        )
        return logs, total

    def to_response(self, log: ActivityLog) -> ActivityLogResponse:
        """Convert to response DTO."""
        user_name = None
        if log.user:
            user_name = f"{log.user.first_name} {log.user.last_name or ''}".strip()
        return ActivityLogResponse(
            id=log.id,
            user_id=log.user_id,
            user_name=user_name,
            module=log.module,
            action=log.action,
            record_id=log.record_id,
            created_datetime=log.created_datetime,
        )
