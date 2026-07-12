"""
Transfer service — request, approve, reject, complete transfers.
"""

import logging
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import (
    TransferStatusEnum, AssetStatusEnum, AllocationStatusEnum, StatusEnum
)
from app.exceptions.handlers import NotFoundException, BadRequestException
from app.models.transfer_request import TransferRequest
from app.models.asset_allocation import AssetAllocation
from app.models.asset_status_history import AssetStatusHistory
from app.models.activity_log import ActivityLog
from app.models.notification import Notification
from app.repositories.transfer_repository import TransferRepository
from app.repositories.asset_repository import AssetRepository
from app.repositories.allocation_repository import AllocationRepository
from app.repositories.user_repository import UserRepository
from app.schemas.transfer_request import TransferCreate, TransferResponse

logger = logging.getLogger("assetflow.transfers")


class TransferService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.transfer_repo = TransferRepository(db)
        self.asset_repo = AssetRepository(db)
        self.alloc_repo = AllocationRepository(db)
        self.user_repo = UserRepository(db)

    async def create_transfer(self, data: TransferCreate, requested_by: UUID) -> TransferRequest:
        """Create a transfer request."""
        asset = await self.asset_repo.get_by_id(data.asset_id)
        if not asset:
            raise NotFoundException(message="Asset not found")

        to_user = await self.user_repo.get_by_id(data.to_employee)
        if not to_user:
            raise NotFoundException(message="Target employee not found")

        # Find current holder
        active_alloc = await self.alloc_repo.find_active_allocation_by_asset(data.asset_id)
        from_employee = requested_by
        if active_alloc and active_alloc.employee_id:
            from_employee = active_alloc.employee_id

        transfer = TransferRequest(
            asset_id=data.asset_id,
            from_employee=from_employee,
            to_employee=data.to_employee,
            reason=data.reason,
            approval_status=TransferStatusEnum.REQUESTED,
            created_by=requested_by,
            updated_by=requested_by,
        )
        transfer = await self.transfer_repo.create(transfer)

        self.db.add(ActivityLog(
            user_id=requested_by, module="TRANSFERS", action="REQUEST", record_id=transfer.id
        ))
        await self.transfer_repo.commit()

        logger.info("Transfer requested for asset %s by %s", data.asset_id, requested_by)
        return transfer

    async def approve_transfer(self, transfer_id: UUID, approved_by: UUID, comments: str | None = None) -> TransferRequest:
        """Approve a transfer request."""
        transfer = await self.transfer_repo.get_by_id(transfer_id)
        if not transfer:
            raise NotFoundException(message="Transfer request not found")

        if transfer.approval_status != TransferStatusEnum.REQUESTED:
            raise BadRequestException(message="Transfer is not in REQUESTED status")

        await self.transfer_repo.update_fields(transfer_id, {
            "approval_status": TransferStatusEnum.APPROVED,
            "approved_by": approved_by,
            "approval_date": datetime.now(timezone.utc),
            "comments": comments,
            "updated_by": approved_by,
        })

        # Notify both parties
        self.db.add(Notification(
            recipient=transfer.to_employee,
            title="Transfer Approved",
            message=f"Transfer request for asset has been approved.",
            notification_type="TRANSFER_APPROVED",
            created_by=approved_by,
        ))

        self.db.add(ActivityLog(
            user_id=approved_by, module="TRANSFERS", action="APPROVE", record_id=transfer_id
        ))
        await self.transfer_repo.commit()

        logger.info("Transfer %s approved by %s", transfer_id, approved_by)
        return await self.transfer_repo.get_by_id(transfer_id)

    async def reject_transfer(self, transfer_id: UUID, rejected_by: UUID, comments: str | None = None) -> TransferRequest:
        """Reject a transfer request."""
        transfer = await self.transfer_repo.get_by_id(transfer_id)
        if not transfer:
            raise NotFoundException(message="Transfer request not found")

        if transfer.approval_status != TransferStatusEnum.REQUESTED:
            raise BadRequestException(message="Transfer is not in REQUESTED status")

        await self.transfer_repo.update_fields(transfer_id, {
            "approval_status": TransferStatusEnum.REJECTED,
            "approved_by": rejected_by,
            "approval_date": datetime.now(timezone.utc),
            "comments": comments,
            "updated_by": rejected_by,
        })

        self.db.add(ActivityLog(
            user_id=rejected_by, module="TRANSFERS", action="REJECT", record_id=transfer_id
        ))
        await self.transfer_repo.commit()

        return await self.transfer_repo.get_by_id(transfer_id)

    async def complete_transfer(self, transfer_id: UUID, completed_by: UUID) -> TransferRequest:
        """Complete an approved transfer — re-allocate the asset."""
        transfer = await self.transfer_repo.get_by_id(transfer_id)
        if not transfer:
            raise NotFoundException(message="Transfer request not found")

        if transfer.approval_status != TransferStatusEnum.APPROVED:
            raise BadRequestException(message="Transfer must be APPROVED before completion")

        # Close old allocation
        old_alloc = await self.alloc_repo.find_active_allocation_by_asset(transfer.asset_id)
        if old_alloc:
            await self.alloc_repo.update_fields(old_alloc.id, {
                "allocation_status": AllocationStatusEnum.RETURNED,
                "actual_return_date": datetime.now(timezone.utc),
                "check_in_notes": f"Transferred to another employee (Transfer #{transfer_id})",
                "updated_by": completed_by,
            })

        # Create new allocation
        new_alloc = AssetAllocation(
            asset_id=transfer.asset_id,
            employee_id=transfer.to_employee,
            allocation_status=AllocationStatusEnum.ALLOCATED,
            created_by=completed_by,
            updated_by=completed_by,
        )
        await self.alloc_repo.create(new_alloc)

        # Update asset holder
        await self.asset_repo.update_fields(transfer.asset_id, {
            "current_holder": transfer.to_employee,
            "updated_by": completed_by,
        })

        # Mark transfer completed
        await self.transfer_repo.update_fields(transfer_id, {
            "approval_status": TransferStatusEnum.COMPLETED,
            "updated_by": completed_by,
        })

        self.db.add(ActivityLog(
            user_id=completed_by, module="TRANSFERS", action="COMPLETE", record_id=transfer_id
        ))
        await self.transfer_repo.commit()

        logger.info("Transfer %s completed by %s", transfer_id, completed_by)
        return await self.transfer_repo.get_by_id(transfer_id)

    async def list_transfers(self, skip: int = 0, limit: int = 20) -> tuple[list[TransferRequest], int]:
        """List all transfer requests."""
        transfers = await self.transfer_repo.get_all(
            skip=skip, limit=limit,
            filters=[TransferRequest.status == StatusEnum.ACTIVE]
        )
        total = await self.transfer_repo.count(
            filters=[TransferRequest.status == StatusEnum.ACTIVE]
        )
        return transfers, total

    def to_response(self, t: TransferRequest) -> TransferResponse:
        """Convert model to response DTO."""
        return TransferResponse(
            id=t.id,
            asset_id=t.asset_id,
            asset_tag=t.asset.asset_tag if t.asset else None,
            asset_name=t.asset.asset_name if t.asset else None,
            from_employee=t.from_employee,
            from_employee_name=f"{t.sender.first_name} {t.sender.last_name or ''}".strip() if t.sender else None,
            to_employee=t.to_employee,
            to_employee_name=f"{t.receiver.first_name} {t.receiver.last_name or ''}".strip() if t.receiver else None,
            reason=t.reason,
            approval_status=t.approval_status,
            approved_by=t.approved_by,
            approver_name=f"{t.approver.first_name} {t.approver.last_name or ''}".strip() if t.approver else None,
            approval_date=t.approval_date,
            comments=t.comments,
            status=t.status,
            created_datetime=t.created_datetime,
        )
