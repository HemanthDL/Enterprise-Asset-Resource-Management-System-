"""
Common schemas used across all modules: pagination, standard response wrapper.
"""

from typing import Generic, TypeVar
from uuid import UUID

from pydantic import BaseModel

T = TypeVar("T")


class PaginationParams(BaseModel):
    """Query parameters for paginated endpoints."""
    skip: int = 0
    limit: int = 20


class PaginatedResponse(BaseModel, Generic[T]):
    """Standard paginated response wrapper."""
    items: list[T]
    total: int
    skip: int
    limit: int


class StandardResponse(BaseModel):
    """Standard API response wrapper."""
    success: bool
    message: str
    data: dict | list | None = None


class IDResponse(BaseModel):
    """Response returning just a UUID after create/update."""
    id: UUID
