"""
Notification routes.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.notification import NotificationResponse, UnreadCountResponse
from app.schemas.common import StandardResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=list[NotificationResponse], summary="List notifications")
async def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List current user's notifications."""
    service = NotificationService(db)
    notifications = await service.get_notifications(current_user.id, skip=skip, limit=limit)
    return [service.to_response(n) for n in notifications]


@router.get("/unread-count", response_model=UnreadCountResponse, summary="Unread count")
async def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get unread notification count."""
    service = NotificationService(db)
    count = await service.get_unread_count(current_user.id)
    return UnreadCountResponse(unread_count=count)


@router.patch("/{notif_id}/read", response_model=NotificationResponse, summary="Mark as read")
async def mark_read(
    notif_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark a notification as read."""
    service = NotificationService(db)
    notif = await service.mark_read(notif_id, current_user.id)
    return service.to_response(notif)


@router.patch("/read-all", response_model=StandardResponse, summary="Mark all read")
async def mark_all_read(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mark all notifications as read."""
    service = NotificationService(db)
    await service.mark_all_read(current_user.id)
    return StandardResponse(success=True, message="All notifications marked as read")
