"""
Asset DTOs: create, update, response, search filters, status change.
"""

from datetime import date, datetime
from decimal import Decimal
from uuid import UUID

from pydantic import BaseModel, Field

from app.core.constants import AssetStatusEnum, StatusEnum


class AssetCreate(BaseModel):
    """Register a new asset."""
    asset_name: str = Field(..., min_length=1, max_length=255)
    category_id: UUID
    serial_number: str | None = Field(None, max_length=100)
    manufacturer: str | None = Field(None, max_length=100)
    model: str | None = Field(None, max_length=100)
    purchase_date: date | None = None
    purchase_cost: Decimal | None = None
    asset_condition: str | None = Field(None, max_length=50)
    location: str | None = Field(None, max_length=255)
    department_id: UUID | None = None
    is_bookable: bool = False
    photo_url: str | None = None
    warranty_months: int | None = None
    document_url: str | None = None


class AssetUpdate(BaseModel):
    """Update asset fields (not status — use status change endpoint)."""
    asset_name: str | None = Field(None, min_length=1, max_length=255)
    category_id: UUID | None = None
    serial_number: str | None = Field(None, max_length=100)
    manufacturer: str | None = Field(None, max_length=100)
    model: str | None = Field(None, max_length=100)
    purchase_date: date | None = None
    purchase_cost: Decimal | None = None
    asset_condition: str | None = Field(None, max_length=50)
    location: str | None = Field(None, max_length=255)
    department_id: UUID | None = None
    is_bookable: bool | None = None
    photo_url: str | None = None
    warranty_months: int | None = None
    document_url: str | None = None


class AssetStatusChange(BaseModel):
    """Change the lifecycle status of an asset."""
    new_status: AssetStatusEnum
    reason: str | None = None


class AssetResponse(BaseModel):
    """Full asset details."""
    id: UUID
    asset_tag: str
    asset_name: str
    category_id: UUID
    category_name: str | None = None
    serial_number: str | None = None
    manufacturer: str | None = None
    model: str | None = None
    purchase_date: date | None = None
    purchase_cost: Decimal | None = None
    asset_condition: str | None = None
    location: str | None = None
    department_id: UUID | None = None
    department_name: str | None = None
    is_bookable: bool = False
    photo_url: str | None = None
    warranty_months: int | None = None
    document_url: str | None = None
    current_status: AssetStatusEnum
    current_holder: UUID | None = None
    current_holder_name: str | None = None
    status: StatusEnum
    created_datetime: datetime | None = None

    model_config = {"from_attributes": True}


class AssetSearchFilters(BaseModel):
    """Search/filter parameters for asset listing."""
    asset_tag: str | None = None
    serial_number: str | None = None
    category_id: UUID | None = None
    current_status: AssetStatusEnum | None = None
    department_id: UUID | None = None
    location: str | None = None
    is_bookable: bool | None = None
    search: str | None = None  # General search across name, tag, serial
