"""
Dashboard routes — KPIs and overdue returns.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.api.deps import get_current_user, require_roles
from app.core.constants import RoleEnum
from app.models.user import User
from app.schemas.dashboard import DashboardKPIs, OverdueReturnItem
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/kpis", response_model=DashboardKPIs, summary="Dashboard KPI cards")
async def get_kpis(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Real-time operational snapshot KPI cards."""
    service = DashboardService(db)
    return await service.get_kpis()


@router.get(
    "/overdue-returns",
    response_model=list[OverdueReturnItem],
    summary="Overdue returns",
)
async def get_overdue_returns(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_roles(RoleEnum.ADMIN, RoleEnum.ASSET_MANAGER, RoleEnum.DEPARTMENT_HEAD)),
    db: AsyncSession = Depends(get_db),
):
    """Overdue returns with days overdue."""
    service = DashboardService(db)
    return await service.get_overdue_returns(skip=skip, limit=limit)
