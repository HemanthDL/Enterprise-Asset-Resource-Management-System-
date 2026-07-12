"""
User service — user management, role promotion.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import RoleEnum, StatusEnum, PROMOTABLE_ROLES
from app.exceptions.handlers import NotFoundException, BadRequestException, ForbiddenException
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserResponse, UserUpdate, UserPromote

logger = logging.getLogger("assetflow.users")


class UserService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def get_user_by_id(self, user_id: UUID) -> User:
        """Get user by ID or raise 404."""
        user = await self.user_repo.get_by_id(user_id)
        if not user:
            raise NotFoundException(message="User not found")
        return user

    async def list_users(
        self,
        skip: int = 0,
        limit: int = 20,
        department_id: UUID | None = None,
        role: str | None = None,
    ) -> tuple[list[User], int]:
        """List active users with optional filters. Returns (users, total_count)."""
        users = await self.user_repo.get_active_users(
            skip=skip, limit=limit, department_id=department_id, role=role
        )
        total = await self.user_repo.count_active_users(
            department_id=department_id, role=role
        )
        return users, total

    async def update_user(self, user_id: UUID, data: UserUpdate, updated_by: UUID) -> User:
        """Update user profile fields."""
        user = await self.get_user_by_id(user_id)

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise BadRequestException(message="No fields to update")

        update_data["updated_by"] = updated_by
        user = await self.user_repo.update_fields(user_id, update_data)
        await self.user_repo.commit()

        logger.info("User %s updated by %s", user_id, updated_by)
        return user

    async def promote_user(self, user_id: UUID, data: UserPromote, promoted_by: UUID) -> User:
        """
        Promote an Employee to Department Head or Asset Manager.
        Only Admin can do this, and only from the Employee Directory.
        """
        user = await self.get_user_by_id(user_id)

        if data.role not in PROMOTABLE_ROLES and data.role != RoleEnum.EMPLOYEE:
            raise BadRequestException(
                message=f"Cannot promote to role: {data.role.value}",
                detail="Valid roles for promotion: ASSET_MANAGER, DEPARTMENT_HEAD, EMPLOYEE",
            )

        if data.role == user.role:
            raise BadRequestException(message=f"User already has role {data.role.value}")

        old_role = user.role
        await self.user_repo.update_fields(user_id, {
            "role": data.role,
            "updated_by": promoted_by,
        })

        # Log activity
        self.db.add(ActivityLog(
            user_id=promoted_by,
            module="USERS",
            action=f"PROMOTE_{old_role.value}_TO_{data.role.value}",
            record_id=user_id,
        ))
        await self.user_repo.commit()

        logger.info(
            "User %s promoted from %s to %s by %s",
            user_id, old_role.value, data.role.value, promoted_by,
        )
        return await self.get_user_by_id(user_id)

    async def deactivate_user(self, user_id: UUID, deactivated_by: UUID) -> User:
        """Soft-deactivate a user."""
        user = await self.get_user_by_id(user_id)
        if user.status == StatusEnum.INACTIVE:
            raise BadRequestException(message="User is already deactivated")

        await self.user_repo.update_fields(user_id, {
            "status": StatusEnum.INACTIVE,
            "updated_by": deactivated_by,
        })

        self.db.add(ActivityLog(
            user_id=deactivated_by,
            module="USERS",
            action="DEACTIVATE",
            record_id=user_id,
        ))
        await self.user_repo.commit()

        logger.info("User %s deactivated by %s", user_id, deactivated_by)
        return await self.get_user_by_id(user_id)

    def to_response(self, user: User) -> UserResponse:
        """Convert User model to response DTO."""
        return UserResponse(
            id=user.id,
            first_name=user.first_name,
            last_name=user.last_name,
            email=user.email,
            phone=user.phone,
            department_id=user.department_id,
            department_name=user.department.department_name if user.department else None,
            role=user.role,
            status=user.status,
            last_login=user.last_login,
            created_datetime=user.created_datetime,
        )
