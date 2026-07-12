"""
Asset Category DTOs.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import StatusEnum


class AssetCategoryCreate(BaseModel):
    """Create a new asset category."""
    category_name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None
    icon: str | None = None


class AssetCategoryUpdate(BaseModel):
    """Update asset category fields."""
    category_name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    icon: str | None = None


class AssetCategoryResponse(BaseModel):
    """Asset category details."""
    id: UUID
    category_name: str
    description: str | None = None
    icon: str | None = None
    status: StatusEnum
    created_datetime: datetime | None = None

    model_config = {"from_attributes": True}
