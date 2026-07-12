"""
Notification DTOs.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    """Notification details."""
    id: UUID
    recipient: UUID | None = None
    title: str | None = None
    message: str | None = None
    notification_type: str | None = None
    is_read: bool = False
    sent_date: datetime | None = None
    created_datetime: datetime | None = None

    model_config = {"from_attributes": True}


class UnreadCountResponse(BaseModel):
    """Count of unread notifications."""
    unread_count: int
