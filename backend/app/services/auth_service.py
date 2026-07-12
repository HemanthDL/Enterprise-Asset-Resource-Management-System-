"""
Authentication service — signup, login, JWT management.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.core.constants import RoleEnum
from app.exceptions.handlers import BadRequestException, UnauthorizedException
from app.models.user import User
from app.models.activity_log import ActivityLog
from app.repositories.user_repository import UserRepository
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse

logger = logging.getLogger("assetflow.auth")


class AuthService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.user_repo = UserRepository(db)

    async def signup(self, data: SignupRequest) -> User:
        """
        Create a new Employee account.
        Signup ONLY creates Employee role — no role selection at signup.
        """
        # Check if email already exists
        existing = await self.user_repo.get_by_email(data.email)
        if existing:
            raise BadRequestException(
                message="An account with this email already exists",
                detail=f"Email {data.email} is already registered",
            )

        # Create user with Employee role
        user = User(
            first_name=data.first_name,
            last_name=data.last_name,
            email=data.email,
            password_hash=hash_password(data.password),
            phone=data.phone,
            role=RoleEnum.EMPLOYEE,
        )
        user = await self.user_repo.create(user)
        await self.user_repo.commit()

        logger.info("New employee account created: %s", data.email)
        return user

    async def login(self, data: LoginRequest) -> TokenResponse:
        """
        Authenticate user and return JWT token.
        """
        user = await self.user_repo.get_by_email(data.email)
        if not user:
            raise UnauthorizedException(message="Invalid email or password")

        if not verify_password(data.password, user.password_hash):
            raise UnauthorizedException(message="Invalid email or password")

        from app.core.constants import StatusEnum
        if user.status != StatusEnum.ACTIVE:
            raise UnauthorizedException(message="Account is deactivated")

        # Update last login
        await self.user_repo.update_fields(user.id, {"last_login": datetime.now(timezone.utc)})

        # Log the activity
        self.db.add(ActivityLog(
            user_id=user.id,
            module="AUTH",
            action="LOGIN",
            record_id=user.id,
        ))
        await self.user_repo.commit()

        # Create JWT
        token = create_access_token(
            data={"sub": str(user.id), "role": user.role.value}
        )

        logger.info("User logged in: %s", data.email)
        return TokenResponse(access_token=token)
