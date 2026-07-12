"""
Generic base repository providing async CRUD operations.
All domain-specific repositories extend this.
"""

from typing import TypeVar, Generic, Type
from uuid import UUID

from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.base import Base
from app.core.constants import StatusEnum

ModelType = TypeVar("ModelType", bound=Base)


class BaseRepository(Generic[ModelType]):
    """Generic async CRUD repository using SQLAlchemy."""

    def __init__(self, model: Type[ModelType], db: AsyncSession):
        self.model = model
        self.db = db

    async def get_by_id(self, record_id: UUID) -> ModelType | None:
        """Fetch a single record by primary key."""
        result = await self.db.execute(
            select(self.model).where(self.model.id == record_id)
        )
        return result.scalars().first()

    async def get_all(
        self,
        skip: int = 0,
        limit: int = 20,
        filters: list | None = None,
    ) -> list[ModelType]:
        """Fetch records with optional filtering and pagination."""
        query = select(self.model)
        if filters:
            for condition in filters:
                query = query.where(condition)
        query = query.offset(skip).limit(limit)
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def count(self, filters: list | None = None) -> int:
        """Count records with optional filtering."""
        query = select(func.count(self.model.id))
        if filters:
            for condition in filters:
                query = query.where(condition)
        result = await self.db.execute(query)
        return result.scalar_one()

    async def create(self, obj: ModelType) -> ModelType:
        """Insert a new record."""
        self.db.add(obj)
        await self.db.flush()
        await self.db.refresh(obj)
        return obj

    async def update_fields(self, record_id: UUID, data: dict) -> ModelType | None:
        """Update specific fields on a record."""
        await self.db.execute(
            update(self.model).where(self.model.id == record_id).values(**data)
        )
        await self.db.flush()
        return await self.get_by_id(record_id)

    async def soft_delete(self, record_id: UUID) -> ModelType | None:
        """Soft-delete by setting status to INACTIVE."""
        return await self.update_fields(record_id, {"status": StatusEnum.INACTIVE})

    async def commit(self) -> None:
        """Commit the current transaction."""
        await self.db.commit()

    async def rollback(self) -> None:
        """Rollback the current transaction."""
        await self.db.rollback()
