"""
Notification service.
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.notification_repository import NotificationRepository
from app.exceptions.handlers import NotFoundException
from app.schemas.notification import NotificationResponse


class NotificationService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.notif_repo = NotificationRepository(db)

    async def get_notifications(self, user_id: UUID, skip: int = 0, limit: int = 20) -> list[Notification]:
        """Get user's notifications."""
        return await self.notif_repo.get_user_notifications(user_id, skip=skip, limit=limit)

    async def get_unread_count(self, user_id: UUID) -> int:
        """Get unread notification count."""
        return await self.notif_repo.count_unread(user_id)

    async def mark_read(self, notif_id: UUID, user_id: UUID) -> Notification:
        """Mark a specific notification as read."""
        notif = await self.notif_repo.get_by_id(notif_id)
        if not notif:
            raise NotFoundException(message="Notification not found")
        if notif.recipient != user_id:
            raise NotFoundException(message="Notification not found")

        await self.notif_repo.update_fields(notif_id, {"is_read": True})
        await self.notif_repo.commit()
        return await self.notif_repo.get_by_id(notif_id)

    async def mark_all_read(self, user_id: UUID) -> None:
        """Mark all notifications as read for a user."""
        await self.notif_repo.mark_all_read(user_id)
        await self.notif_repo.commit()

    def to_response(self, n: Notification) -> NotificationResponse:
        """Convert to response DTO."""
        return NotificationResponse(
            id=n.id,
            recipient=n.recipient,
            title=n.title,
            message=n.message,
            notification_type=n.notification_type,
            is_read=n.is_read,
            sent_date=n.sent_date,
            created_datetime=n.created_datetime,
        )
