"""
Auth routes: signup (public), login (public), me (authenticated).
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.schemas.auth import SignupRequest, LoginRequest, TokenResponse
from app.schemas.user import UserResponse
from app.schemas.common import StandardResponse
from app.services.auth_service import AuthService
from app.services.user_service import UserService

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/signup",
    response_model=StandardResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Employee account",
)
async def signup(data: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Signup creates an Employee account only — no role selection."""
    service = AuthService(db)
    user = await service.signup(data)
    return StandardResponse(
        success=True,
        message="Account created successfully",
        data={"user_id": str(user.id)},
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login and receive JWT",
)
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate and return JWT access token."""
    service = AuthService(db)
    return await service.login(data)


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Get current user profile",
)
async def get_me(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get the authenticated user's profile."""
    service = UserService(db)
    return service.to_response(current_user)
