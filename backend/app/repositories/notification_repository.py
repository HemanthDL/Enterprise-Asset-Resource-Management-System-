"""
Notification repository.
"""

from uuid import UUID

from sqlalchemy import select, func, update, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.base import BaseRepository
from app.core.constants import StatusEnum


class NotificationRepository(BaseRepository[Notification]):

    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_user_notifications(
        self, user_id: UUID, skip: int = 0, limit: int = 20
    ) -> list[Notification]:
        """Get notifications for a specific user."""
        result = await self.db.execute(
            select(Notification)
            .where(
                and_(
                    Notification.recipient == user_id,
                    Notification.status == StatusEnum.ACTIVE,
                )
            )
            .order_by(Notification.sent_date.desc())
            .offset(skip)
            .limit(limit)
        )
        return list(result.scalars().all())

    async def count_unread(self, user_id: UUID) -> int:
        """Count unread notifications for a user."""
        result = await self.db.execute(
            select(func.count(Notification.id)).where(
                and_(
                    Notification.recipient == user_id,
                    Notification.is_read == False,
                    Notification.status == StatusEnum.ACTIVE,
                )
            )
        )
        return result.scalar_one()

    async def mark_all_read(self, user_id: UUID) -> None:
        """Mark all notifications as read for a user."""
        await self.db.execute(
            update(Notification)
            .where(
                and_(
                    Notification.recipient == user_id,
                    Notification.is_read == False,
                    Notification.status == StatusEnum.ACTIVE,
                )
            )
            .values(is_read=True)
        )
        await self.db.flush()
