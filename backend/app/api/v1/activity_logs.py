"""
Activity log routes — Admin only.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import require_roles
from app.core.constants import RoleEnum
from app.models.user import User
from app.schemas.activity_log import ActivityLogResponse
from app.schemas.common import PaginatedResponse
from app.services.activity_log_service import ActivityLogService

router = APIRouter(prefix="/activity-logs", tags=["Activity Logs"])


@router.get("", response_model=PaginatedResponse[ActivityLogResponse], summary="List activity logs")
async def list_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    user_id: UUID | None = None,
    module: str | None = None,
    action: str | None = None,
    current_user: User = Depends(require_roles(RoleEnum.ADMIN)),
    db: AsyncSession = Depends(get_db),
):
    """List all activity logs. Admin only."""
    service = ActivityLogService(db)
    logs, total = await service.list_logs(
        skip=skip, limit=limit, user_id=user_id, module=module, action=action
    )
    return PaginatedResponse(
        items=[service.to_response(log) for log in logs], total=total, skip=skip, limit=limit
    )
