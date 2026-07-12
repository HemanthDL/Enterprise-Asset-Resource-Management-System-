"""
Activity Log DTOs.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ActivityLogResponse(BaseModel):
    """Activity log entry."""
    id: UUID
    user_id: UUID | None = None
    user_name: str | None = None
    module: str | None = None
    action: str | None = None
    record_id: UUID | None = None
    created_datetime: datetime | None = None

    model_config = {"from_attributes": True}
