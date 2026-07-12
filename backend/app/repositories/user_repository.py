"""
User repository — database access for user operations.
"""

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user import User
from app.repositories.base import BaseRepository


class UserRepository(BaseRepository[User]):

    def __init__(self, db: AsyncSession):
        super().__init__(User, db)

    async def get_by_email(self, email: str) -> User | None:
        """Find user by email address."""
        result = await self.db.execute(
            select(User).where(User.email == email)
        )
        return result.scalars().first()

    async def get_active_users(
        self, skip: int = 0, limit: int = 20, department_id: UUID | None = None, role: str | None = None
    ) -> list[User]:
        """List active users with optional department/role filter."""
        from app.core.constants import StatusEnum
        filters = [User.status == StatusEnum.ACTIVE]
        if department_id:
            filters.append(User.department_id == department_id)
        if role:
            filters.append(User.role == role)
        return await self.get_all(skip=skip, limit=limit, filters=filters)

    async def count_active_users(
        self, department_id: UUID | None = None, role: str | None = None
    ) -> int:
        """Count active users with optional filters."""
        from app.core.constants import StatusEnum
        filters = [User.status == StatusEnum.ACTIVE]
        if department_id:
            filters.append(User.department_id == department_id)
        if role:
            filters.append(User.role == role)
        return await self.count(filters=filters)
