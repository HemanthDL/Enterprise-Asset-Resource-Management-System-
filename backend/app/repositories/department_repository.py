"""
Department repository — database access for department operations.
"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.department import Department
from app.repositories.base import BaseRepository
from app.core.constants import StatusEnum


class DepartmentRepository(BaseRepository[Department]):

    def __init__(self, db: AsyncSession):
        super().__init__(Department, db)

    async def get_by_code(self, code: str) -> Department | None:
        """Find department by unique code."""
        result = await self.db.execute(
            select(Department).where(Department.department_code == code)
        )
        return result.scalars().first()

    async def get_active_departments(self, skip: int = 0, limit: int = 20) -> list[Department]:
        """List active departments."""
        return await self.get_all(
            skip=skip, limit=limit, filters=[Department.status == StatusEnum.ACTIVE]
        )

    async def count_active(self) -> int:
        """Count active departments."""
        return await self.count(filters=[Department.status == StatusEnum.ACTIVE])
