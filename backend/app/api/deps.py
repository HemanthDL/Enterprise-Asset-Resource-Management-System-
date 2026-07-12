"""
FastAPI dependency injection: get_db, get_current_user, role-based access control.
Every endpoint requiring authentication uses get_current_user.
RBAC is enforced via require_roles().
"""

from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_access_token
from app.core.constants import RoleEnum
from app.db.session import get_db
from app.models.user import User
from app.repositories.user_repository import UserRepository

# Bearer token security scheme — extracts token from Authorization header
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    Dependency: decode JWT, lookup user, return User model.
    Raises 401 if token is invalid/expired or user not found/inactive.
    """
    token = credentials.credentials
    payload = decode_access_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id_str = payload.get("sub")
    if not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    try:
        user_id = UUID(user_id_str)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    user_repo = UserRepository(db)
    user = await user_repo.get_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    from app.core.constants import StatusEnum
    if user.status != StatusEnum.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated",
        )

    return user


def require_roles(*roles: RoleEnum):
    """
    Dependency factory: restrict endpoint access to specific roles.

    Usage:
        @router.get("/admin-only", dependencies=[Depends(require_roles(RoleEnum.ADMIN))])
    Or:
        current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER))
    """

    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Insufficient permissions. Required roles: {[r.value for r in roles]}",
            )
        return current_user

    return role_checker
