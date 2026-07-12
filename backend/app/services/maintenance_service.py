"""
Maintenance service — raise, approve, assign, resolve with asset status auto-updates.
"""

import logging
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import (
    MaintenanceStatusEnum, AssetStatusEnum, VALID_MAINTENANCE_TRANSITIONS, StatusEnum
)
from app.exceptions.handlers import NotFoundException, BadRequestException
from app.models.maintenance_request import MaintenanceRequest
from app.models.maintenance_history import MaintenanceHistory
from app.models.asset_status_history import AssetStatusHistory
from app.models.activity_log import ActivityLog
from app.models.notification import Notification
from app.repositories.maintenance_repository import MaintenanceRepository
from app.repositories.asset_repository import AssetRepository
from app.schemas.maintenance import (
    MaintenanceCreate, MaintenanceTechnicianAssign, MaintenanceResolve, MaintenanceResponse
)

logger = logging.getLogger("assetflow.maintenance")


class MaintenanceService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.maint_repo = MaintenanceRepository(db)
        self.asset_repo = AssetRepository(db)

    async def raise_request(self, data: MaintenanceCreate, raised_by: UUID) -> MaintenanceRequest:
        """Raise a maintenance request for an asset."""
        asset = await self.asset_repo.get_by_id(data.asset_id)
        if not asset:
            raise NotFoundException(message="Asset not found")

        request = MaintenanceRequest(
            asset_id=data.asset_id,
            raised_by=raised_by,
            issue_description=data.issue_description,
            priority=data.priority,
            attachment_url=data.attachment_url,
            approval_status=MaintenanceStatusEnum.PENDING,
            created_by=raised_by,
            updated_by=raised_by,
        )
        request = await self.maint_repo.create(request)

        # Log history
        self.db.add(MaintenanceHistory(
            maintenance_request_id=request.id,
            asset_id=data.asset_id,
            action_taken="Maintenance request raised",
            performed_by=raised_by,
            created_by=raised_by,
        ))

        self.db.add(ActivityLog(
            user_id=raised_by, module="MAINTENANCE", action="RAISE", record_id=request.id
        ))
        await self.maint_repo.commit()

        logger.info("Maintenance request raised for asset %s by %s", data.asset_id, raised_by)
        return request

    async def _validate_transition(self, request: MaintenanceRequest, target: MaintenanceStatusEnum) -> None:
        """Validate maintenance workflow transition."""
        current = request.approval_status
        allowed = VALID_MAINTENANCE_TRANSITIONS.get(current, set())
        if target not in allowed:
            raise BadRequestException(
                message=f"Invalid transition: {current.value} → {target.value}",
                detail=f"Allowed from {current.value}: {[s.value for s in allowed]}",
            )

    async def approve_request(self, request_id: UUID, approved_by: UUID, comments: str | None = None) -> MaintenanceRequest:
        """Approve a maintenance request — asset flips to UNDER_MAINTENANCE."""
        request = await self.maint_repo.get_by_id(request_id)
        if not request:
            raise NotFoundException(message="Maintenance request not found")

        await self._validate_transition(request, MaintenanceStatusEnum.APPROVED)

        await self.maint_repo.update_fields(request_id, {
            "approval_status": MaintenanceStatusEnum.APPROVED,
            "approved_by": approved_by,
            "updated_by": approved_by,
        })

        # Auto-update asset status to UNDER_MAINTENANCE
        asset = await self.asset_repo.get_by_id(request.asset_id)
        if asset and asset.current_status == AssetStatusEnum.AVAILABLE:
            self.db.add(AssetStatusHistory(
                asset_id=request.asset_id,
                old_status=asset.current_status,
                new_status=AssetStatusEnum.UNDER_MAINTENANCE,
                changed_by=approved_by,
                reason="Maintenance request approved",
                created_by=approved_by,
            ))
            await self.asset_repo.update_fields(request.asset_id, {
                "current_status": AssetStatusEnum.UNDER_MAINTENANCE,
                "updated_by": approved_by,
            })

        self.db.add(MaintenanceHistory(
            maintenance_request_id=request_id,
            asset_id=request.asset_id,
            action_taken=f"Request approved. {comments or ''}",
            performed_by=approved_by,
            created_by=approved_by,
        ))

        self.db.add(Notification(
            recipient=request.raised_by,
            title="Maintenance Approved",
            message="Your maintenance request has been approved.",
            notification_type="MAINTENANCE_APPROVED",
            created_by=approved_by,
        ))

        self.db.add(ActivityLog(
            user_id=approved_by, module="MAINTENANCE", action="APPROVE", record_id=request_id
        ))
        await self.maint_repo.commit()

        logger.info("Maintenance %s approved by %s", request_id, approved_by)
        return await self.maint_repo.get_by_id(request_id)

    async def reject_request(self, request_id: UUID, rejected_by: UUID, comments: str | None = None) -> MaintenanceRequest:
        """Reject a maintenance request."""
        request = await self.maint_repo.get_by_id(request_id)
        if not request:
            raise NotFoundException(message="Maintenance request not found")

        await self._validate_transition(request, MaintenanceStatusEnum.REJECTED)

        await self.maint_repo.update_fields(request_id, {
            "approval_status": MaintenanceStatusEnum.REJECTED,
            "approved_by": rejected_by,
            "updated_by": rejected_by,
        })

        self.db.add(MaintenanceHistory(
            maintenance_request_id=request_id,
            asset_id=request.asset_id,
            action_taken=f"Request rejected. {comments or ''}",
            performed_by=rejected_by,
            created_by=rejected_by,
        ))

        self.db.add(Notification(
            recipient=request.raised_by,
            title="Maintenance Rejected",
            message="Your maintenance request has been rejected.",
            notification_type="MAINTENANCE_REJECTED",
            created_by=rejected_by,
        ))

        self.db.add(ActivityLog(
            user_id=rejected_by, module="MAINTENANCE", action="REJECT", record_id=request_id
        ))
        await self.maint_repo.commit()

        return await self.maint_repo.get_by_id(request_id)

    async def assign_technician(self, request_id: UUID, data: MaintenanceTechnicianAssign, assigned_by: UUID) -> MaintenanceRequest:
        """Assign a technician to an approved request."""
        request = await self.maint_repo.get_by_id(request_id)
        if not request:
            raise NotFoundException(message="Maintenance request not found")

        await self._validate_transition(request, MaintenanceStatusEnum.TECHNICIAN_ASSIGNED)

        await self.maint_repo.update_fields(request_id, {
            "approval_status": MaintenanceStatusEnum.TECHNICIAN_ASSIGNED,
            "technician": data.technician_id,
            "updated_by": assigned_by,
        })

        self.db.add(MaintenanceHistory(
            maintenance_request_id=request_id,
            asset_id=request.asset_id,
            action_taken=f"Technician assigned: {data.technician_id}",
            performed_by=assigned_by,
            created_by=assigned_by,
        ))

        self.db.add(ActivityLog(
            user_id=assigned_by, module="MAINTENANCE", action="ASSIGN_TECHNICIAN", record_id=request_id
        ))
        await self.maint_repo.commit()

        return await self.maint_repo.get_by_id(request_id)

    async def start_maintenance(self, request_id: UUID, started_by: UUID) -> MaintenanceRequest:
        """Mark maintenance as in progress."""
        request = await self.maint_repo.get_by_id(request_id)
        if not request:
            raise NotFoundException(message="Maintenance request not found")

        await self._validate_transition(request, MaintenanceStatusEnum.IN_PROGRESS)

        await self.maint_repo.update_fields(request_id, {
            "approval_status": MaintenanceStatusEnum.IN_PROGRESS,
            "updated_by": started_by,
        })

        self.db.add(MaintenanceHistory(
            maintenance_request_id=request_id,
            asset_id=request.asset_id,
            action_taken="Maintenance work started",
            performed_by=started_by,
            created_by=started_by,
        ))

        self.db.add(ActivityLog(
            user_id=started_by, module="MAINTENANCE", action="START", record_id=request_id
        ))
        await self.maint_repo.commit()

        return await self.maint_repo.get_by_id(request_id)

    async def resolve_request(self, request_id: UUID, data: MaintenanceResolve, resolved_by: UUID) -> MaintenanceRequest:
        """Resolve maintenance — asset reverts to AVAILABLE."""
        request = await self.maint_repo.get_by_id(request_id)
        if not request:
            raise NotFoundException(message="Maintenance request not found")

        await self._validate_transition(request, MaintenanceStatusEnum.RESOLVED)

        now = datetime.now(timezone.utc)
        await self.maint_repo.update_fields(request_id, {
            "approval_status": MaintenanceStatusEnum.RESOLVED,
            "resolved_date": now,
            "resolution_notes": data.resolution_notes,
            "updated_by": resolved_by,
        })

        # Revert asset to AVAILABLE
        asset = await self.asset_repo.get_by_id(request.asset_id)
        if asset and asset.current_status == AssetStatusEnum.UNDER_MAINTENANCE:
            self.db.add(AssetStatusHistory(
                asset_id=request.asset_id,
                old_status=AssetStatusEnum.UNDER_MAINTENANCE,
                new_status=AssetStatusEnum.AVAILABLE,
                changed_by=resolved_by,
                reason="Maintenance resolved",
                created_by=resolved_by,
            ))
            await self.asset_repo.update_fields(request.asset_id, {
                "current_status": AssetStatusEnum.AVAILABLE,
                "updated_by": resolved_by,
            })

        self.db.add(MaintenanceHistory(
            maintenance_request_id=request_id,
            asset_id=request.asset_id,
            action_taken=f"Maintenance resolved. {data.resolution_notes or ''}",
            performed_by=resolved_by,
            created_by=resolved_by,
        ))

        self.db.add(ActivityLog(
            user_id=resolved_by, module="MAINTENANCE", action="RESOLVE", record_id=request_id
        ))
        await self.maint_repo.commit()

        logger.info("Maintenance %s resolved by %s", request_id, resolved_by)
        return await self.maint_repo.get_by_id(request_id)

    async def get_request(self, request_id: UUID) -> MaintenanceRequest:
        """Get request by ID or 404."""
        request = await self.maint_repo.get_by_id(request_id)
        if not request:
            raise NotFoundException(message="Maintenance request not found")
        return request

    async def list_requests(self, skip: int = 0, limit: int = 20) -> tuple[list[MaintenanceRequest], int]:
        """List all maintenance requests."""
        requests = await self.maint_repo.get_all(
            skip=skip, limit=limit,
            filters=[MaintenanceRequest.status == StatusEnum.ACTIVE]
        )
        total = await self.maint_repo.count(
            filters=[MaintenanceRequest.status == StatusEnum.ACTIVE]
        )
        return requests, total

    def to_response(self, r: MaintenanceRequest) -> MaintenanceResponse:
        """Convert model to response DTO."""
        return MaintenanceResponse(
            id=r.id,
            asset_id=r.asset_id,
            asset_tag=r.asset.asset_tag if r.asset else None,
            asset_name=r.asset.asset_name if r.asset else None,
            raised_by=r.raised_by,
            raiser_name=f"{r.raiser.first_name} {r.raiser.last_name or ''}".strip() if r.raiser else None,
            issue_description=r.issue_description,
            priority=r.priority,
            attachment_url=r.attachment_url,
            approval_status=r.approval_status,
            approved_by=r.approved_by,
            approver_name=f"{r.approver.first_name} {r.approver.last_name or ''}".strip() if r.approver else None,
            technician=r.technician,
            technician_name=f"{r.assigned_technician.first_name} {r.assigned_technician.last_name or ''}".strip() if r.assigned_technician else None,
            resolved_date=r.resolved_date,
            resolution_notes=r.resolution_notes,
            status=r.status,
            created_datetime=r.created_datetime,
        )
