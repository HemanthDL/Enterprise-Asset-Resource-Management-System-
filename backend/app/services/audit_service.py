"""
Audit service — create cycles, assign auditors, verify, close, discrepancy report.
"""

import logging
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AuditStatusEnum, VerificationStatusEnum, AssetStatusEnum, StatusEnum
from app.exceptions.handlers import NotFoundException, BadRequestException
from app.models.audit_cycle import AuditCycle
from app.models.audit_asset import AuditAsset
from app.models.asset_status_history import AssetStatusHistory
from app.models.activity_log import ActivityLog
from app.models.notification import Notification
from app.repositories.audit_repository import AuditRepository
from app.repositories.asset_repository import AssetRepository
from app.schemas.audit import (
    AuditCycleCreate, AuditAssetAdd, AuditAssetVerify,
    AuditCycleResponse, AuditAssetResponse, DiscrepancyReport,
)

logger = logging.getLogger("assetflow.audits")


class AuditService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.audit_repo = AuditRepository(db)
        self.asset_repo = AssetRepository(db)

    async def create_cycle(self, data: AuditCycleCreate, created_by: UUID) -> AuditCycle:
        """Create a new audit cycle."""
        cycle = AuditCycle(
            audit_name=data.audit_name,
            department_id=data.department_id,
            location=data.location,
            start_date=data.start_date,
            end_date=data.end_date,
            assigned_by=created_by,
            audit_status=AuditStatusEnum.OPEN,
            created_by=created_by,
            updated_by=created_by,
        )
        cycle = await self.audit_repo.create(cycle)

        self.db.add(ActivityLog(
            user_id=created_by, module="AUDITS", action="CREATE_CYCLE", record_id=cycle.id
        ))
        await self.audit_repo.commit()

        logger.info("Audit cycle created: %s by %s", data.audit_name, created_by)
        return cycle

    async def get_cycle(self, cycle_id: UUID) -> AuditCycle:
        """Get cycle by ID or 404."""
        cycle = await self.audit_repo.get_by_id(cycle_id)
        if not cycle:
            raise NotFoundException(message="Audit cycle not found")
        return cycle

    async def list_cycles(self, skip: int = 0, limit: int = 20) -> tuple[list[AuditCycle], int]:
        """List all audit cycles."""
        cycles = await self.audit_repo.get_all(
            skip=skip, limit=limit,
            filters=[AuditCycle.status == StatusEnum.ACTIVE]
        )
        total = await self.audit_repo.count(
            filters=[AuditCycle.status == StatusEnum.ACTIVE]
        )
        return cycles, total

    async def add_assets(self, cycle_id: UUID, data: AuditAssetAdd, added_by: UUID) -> list[AuditAsset]:
        """Add assets and assign auditor to an audit cycle."""
        cycle = await self.get_cycle(cycle_id)

        if cycle.audit_status == AuditStatusEnum.CLOSED:
            raise BadRequestException(message="Cannot add assets to a closed audit cycle")

        # Update cycle to IN_PROGRESS if still OPEN
        if cycle.audit_status == AuditStatusEnum.OPEN:
            await self.audit_repo.update_fields(cycle_id, {
                "audit_status": AuditStatusEnum.IN_PROGRESS,
                "updated_by": added_by,
            })

        created = []
        for asset_id in data.asset_ids:
            audit_asset = AuditAsset(
                audit_cycle_id=cycle_id,
                asset_id=asset_id,
                auditor=data.auditor_id,
                created_by=added_by,
                updated_by=added_by,
            )
            audit_asset = await self.audit_repo.create_audit_asset(audit_asset)
            created.append(audit_asset)

        self.db.add(ActivityLog(
            user_id=added_by, module="AUDITS", action="ADD_ASSETS", record_id=cycle_id
        ))
        await self.audit_repo.commit()

        return created

    async def verify_asset(self, cycle_id: UUID, data: AuditAssetVerify, verified_by: UUID) -> AuditAsset:
        """Auditor verifies a specific asset in a cycle."""
        cycle = await self.get_cycle(cycle_id)

        if cycle.audit_status == AuditStatusEnum.CLOSED:
            raise BadRequestException(message="Audit cycle is closed and immutable")

        audit_asset = await self.audit_repo.get_audit_asset_by_id(data.audit_asset_id)
        if not audit_asset:
            raise NotFoundException(message="Audit asset record not found")

        if audit_asset.audit_cycle_id != cycle_id:
            raise BadRequestException(message="Asset does not belong to this audit cycle")

        # Update verification
        from sqlalchemy import update
        await self.db.execute(
            update(AuditAsset)
            .where(AuditAsset.id == data.audit_asset_id)
            .values(
                verification_status=data.verification_status,
                remarks=data.remarks,
                verified_date=datetime.now(timezone.utc),
                updated_by=verified_by,
            )
        )
        await self.db.flush()

        self.db.add(ActivityLog(
            user_id=verified_by, module="AUDITS", action="VERIFY_ASSET", record_id=data.audit_asset_id
        ))
        await self.audit_repo.commit()

        logger.info("Asset %s verified as %s in cycle %s", data.audit_asset_id, data.verification_status.value, cycle_id)
        return await self.audit_repo.get_audit_asset_by_id(data.audit_asset_id)

    async def close_cycle(self, cycle_id: UUID, closed_by: UUID) -> AuditCycle:
        """
        Close an audit cycle — locks the cycle.
        Updates affected asset statuses (e.g., LOST for confirmed missing).
        """
        cycle = await self.get_cycle(cycle_id)

        if cycle.audit_status == AuditStatusEnum.CLOSED:
            raise BadRequestException(message="Audit cycle is already closed")

        # Get all flagged assets and update their status
        flagged = await self.audit_repo.get_flagged_assets(cycle_id)
        for audit_asset in flagged:
            if audit_asset.verification_status == VerificationStatusEnum.MISSING:
                asset = await self.asset_repo.get_by_id(audit_asset.asset_id)
                if asset:
                    self.db.add(AssetStatusHistory(
                        asset_id=audit_asset.asset_id,
                        old_status=asset.current_status,
                        new_status=AssetStatusEnum.LOST,
                        changed_by=closed_by,
                        reason="Confirmed missing during audit",
                        created_by=closed_by,
                    ))
                    await self.asset_repo.update_fields(audit_asset.asset_id, {
                        "current_status": AssetStatusEnum.LOST,
                        "updated_by": closed_by,
                    })

                    self.db.add(Notification(
                        recipient=asset.current_holder or closed_by,
                        title="Audit Discrepancy",
                        message=f"Asset {asset.asset_tag} confirmed missing during audit.",
                        notification_type="AUDIT_DISCREPANCY",
                        created_by=closed_by,
                    ))

        # Close the cycle
        await self.audit_repo.update_fields(cycle_id, {
            "audit_status": AuditStatusEnum.CLOSED,
            "updated_by": closed_by,
        })

        self.db.add(ActivityLog(
            user_id=closed_by, module="AUDITS", action="CLOSE_CYCLE", record_id=cycle_id
        ))
        await self.audit_repo.commit()

        logger.info("Audit cycle %s closed by %s", cycle_id, closed_by)
        return await self.get_cycle(cycle_id)

    async def get_discrepancy_report(self, cycle_id: UUID) -> DiscrepancyReport:
        """Auto-generate discrepancy report for a cycle."""
        cycle = await self.get_cycle(cycle_id)
        audit_assets = await self.audit_repo.get_audit_assets(cycle_id)

        total = len(audit_assets)
        verified = sum(1 for a in audit_assets if a.verification_status == VerificationStatusEnum.VERIFIED)
        missing = sum(1 for a in audit_assets if a.verification_status == VerificationStatusEnum.MISSING)
        damaged = sum(1 for a in audit_assets if a.verification_status == VerificationStatusEnum.DAMAGED)
        unverified = sum(1 for a in audit_assets if a.verification_status is None)

        flagged = [a for a in audit_assets if a.verification_status in (VerificationStatusEnum.MISSING, VerificationStatusEnum.DAMAGED)]
        flagged_responses = [self._audit_asset_response(a) for a in flagged]

        return DiscrepancyReport(
            audit_cycle_id=cycle_id,
            audit_name=cycle.audit_name,
            total_assets=total,
            verified=verified,
            missing=missing,
            damaged=damaged,
            unverified=unverified,
            flagged_items=flagged_responses,
        )

    def _audit_asset_response(self, a: AuditAsset) -> AuditAssetResponse:
        """Convert AuditAsset to response DTO."""
        return AuditAssetResponse(
            id=a.id,
            audit_cycle_id=a.audit_cycle_id,
            asset_id=a.asset_id,
            asset_tag=a.asset.asset_tag if a.asset else None,
            asset_name=a.asset.asset_name if a.asset else None,
            auditor=a.auditor,
            auditor_name=f"{a.auditor_user.first_name} {a.auditor_user.last_name or ''}".strip() if a.auditor_user else None,
            verification_status=a.verification_status,
            remarks=a.remarks,
            verified_date=a.verified_date,
        )

    async def to_response(self, cycle: AuditCycle) -> AuditCycleResponse:
        """Convert AuditCycle to response DTO with counts."""
        total = await self.audit_repo.count_total_assets(cycle.id)
        verified = await self.audit_repo.count_verified(cycle.id)
        discrepancies = await self.audit_repo.count_discrepancies(cycle.id)

        return AuditCycleResponse(
            id=cycle.id,
            audit_name=cycle.audit_name,
            department_id=cycle.department_id,
            department_name=cycle.department.department_name if cycle.department else None,
            location=cycle.location,
            start_date=cycle.start_date,
            end_date=cycle.end_date,
            assigned_by=cycle.assigned_by,
            assigner_name=f"{cycle.assigner.first_name} {cycle.assigner.last_name or ''}".strip() if cycle.assigner else None,
            audit_status=cycle.audit_status,
            status=cycle.status,
            created_datetime=cycle.created_datetime,
            total_assets=total,
            verified_count=verified,
            discrepancy_count=discrepancies,
        )
