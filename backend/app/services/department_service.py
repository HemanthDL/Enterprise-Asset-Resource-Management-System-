"""
Department service — department CRUD and management.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.exceptions.handlers import NotFoundException, BadRequestException, ConflictException
from app.models.department import Department
from app.models.activity_log import ActivityLog
from app.core.constants import StatusEnum
from app.repositories.department_repository import DepartmentRepository
from app.schemas.department import DepartmentCreate, DepartmentUpdate, DepartmentResponse

logger = logging.getLogger("assetflow.departments")


class DepartmentService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.dept_repo = DepartmentRepository(db)

    async def create_department(self, data: DepartmentCreate, created_by: UUID) -> Department:
        """Create a new department."""
        existing = await self.dept_repo.get_by_code(data.department_code)
        if existing:
            raise ConflictException(
                message="Department code already exists",
                detail=f"Code '{data.department_code}' is taken",
            )

        dept = Department(
            department_name=data.department_name,
            department_code=data.department_code,
            parent_department_id=data.parent_department_id,
            description=data.description,
            department_head_id=data.department_head_id,
            created_by=created_by,
            updated_by=created_by,
        )
        dept = await self.dept_repo.create(dept)

        self.db.add(ActivityLog(
            user_id=created_by, module="DEPARTMENTS", action="CREATE", record_id=dept.id
        ))
        await self.dept_repo.commit()

        logger.info("Department created: %s by %s", data.department_code, created_by)
        return dept

    async def get_department(self, dept_id: UUID) -> Department:
        """Get department by ID or raise 404."""
        dept = await self.dept_repo.get_by_id(dept_id)
        if not dept:
            raise NotFoundException(message="Department not found")
        return dept

    async def list_departments(self, skip: int = 0, limit: int = 20) -> tuple[list[Department], int]:
        """List active departments."""
        depts = await self.dept_repo.get_active_departments(skip=skip, limit=limit)
        total = await self.dept_repo.count_active()
        return depts, total

    async def update_department(self, dept_id: UUID, data: DepartmentUpdate, updated_by: UUID) -> Department:
        """Update department fields."""
        dept = await self.get_department(dept_id)

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise BadRequestException(message="No fields to update")

        # Check code uniqueness if changing
        if "department_code" in update_data:
            existing = await self.dept_repo.get_by_code(update_data["department_code"])
            if existing and existing.id != dept_id:
                raise ConflictException(message="Department code already exists")

        update_data["updated_by"] = updated_by
        dept = await self.dept_repo.update_fields(dept_id, update_data)

        self.db.add(ActivityLog(
            user_id=updated_by, module="DEPARTMENTS", action="UPDATE", record_id=dept_id
        ))
        await self.dept_repo.commit()

        logger.info("Department %s updated by %s", dept_id, updated_by)
        return dept

    async def deactivate_department(self, dept_id: UUID, deactivated_by: UUID) -> Department:
        """Soft-deactivate a department."""
        dept = await self.get_department(dept_id)
        if dept.status == StatusEnum.INACTIVE:
            raise BadRequestException(message="Department is already inactive")

        await self.dept_repo.update_fields(dept_id, {
            "status": StatusEnum.INACTIVE,
            "updated_by": deactivated_by,
        })

        self.db.add(ActivityLog(
            user_id=deactivated_by, module="DEPARTMENTS", action="DEACTIVATE", record_id=dept_id
        ))
        await self.dept_repo.commit()

        logger.info("Department %s deactivated by %s", dept_id, deactivated_by)
        return await self.get_department(dept_id)

    def to_response(self, dept: Department) -> DepartmentResponse:
        """Convert Department model to response DTO."""
        head_name = None
        if dept.department_head:
            head_name = f"{dept.department_head.first_name} {dept.department_head.last_name or ''}".strip()
        return DepartmentResponse(
            id=dept.id,
            department_name=dept.department_name,
            department_code=dept.department_code,
            parent_department_id=dept.parent_department_id,
            description=dept.description,
            department_head_id=dept.department_head_id,
            department_head_name=head_name,
            status=dept.status,
            created_datetime=dept.created_datetime,
        )
