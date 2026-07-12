"""
Audit repository — audit cycles and audit assets.
"""

from uuid import UUID

from sqlalchemy import select, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.audit_cycle import AuditCycle
from app.models.audit_asset import AuditAsset
from app.repositories.base import BaseRepository
from app.core.constants import AuditStatusEnum, VerificationStatusEnum, StatusEnum


class AuditRepository(BaseRepository[AuditCycle]):

    def __init__(self, db: AsyncSession):
        super().__init__(AuditCycle, db)

    async def get_audit_assets(self, cycle_id: UUID) -> list[AuditAsset]:
        """Get all audit assets for a cycle."""
        result = await self.db.execute(
            select(AuditAsset).where(AuditAsset.audit_cycle_id == cycle_id)
        )
        return list(result.scalars().all())

    async def get_audit_asset_by_id(self, audit_asset_id: UUID) -> AuditAsset | None:
        """Get a specific audit asset record."""
        result = await self.db.execute(
            select(AuditAsset).where(AuditAsset.id == audit_asset_id)
        )
        return result.scalars().first()

    async def create_audit_asset(self, audit_asset: AuditAsset) -> AuditAsset:
        """Add an asset to an audit cycle."""
        self.db.add(audit_asset)
        await self.db.flush()
        await self.db.refresh(audit_asset)
        return audit_asset

    async def count_total_assets(self, cycle_id: UUID) -> int:
        """Count total assets in a cycle."""
        result = await self.db.execute(
            select(func.count(AuditAsset.id)).where(AuditAsset.audit_cycle_id == cycle_id)
        )
        return result.scalar_one()

    async def count_verified(self, cycle_id: UUID) -> int:
        """Count verified assets in a cycle."""
        result = await self.db.execute(
            select(func.count(AuditAsset.id)).where(
                and_(
                    AuditAsset.audit_cycle_id == cycle_id,
                    AuditAsset.verification_status == VerificationStatusEnum.VERIFIED,
                )
            )
        )
        return result.scalar_one()

    async def count_discrepancies(self, cycle_id: UUID) -> int:
        """Count flagged (missing + damaged) assets in a cycle."""
        result = await self.db.execute(
            select(func.count(AuditAsset.id)).where(
                and_(
                    AuditAsset.audit_cycle_id == cycle_id,
                    AuditAsset.verification_status.in_([
                        VerificationStatusEnum.MISSING,
                        VerificationStatusEnum.DAMAGED,
                    ]),
                )
            )
        )
        return result.scalar_one()

    async def get_flagged_assets(self, cycle_id: UUID) -> list[AuditAsset]:
        """Get all flagged (missing/damaged) assets for discrepancy report."""
        result = await self.db.execute(
            select(AuditAsset).where(
                and_(
                    AuditAsset.audit_cycle_id == cycle_id,
                    AuditAsset.verification_status.in_([
                        VerificationStatusEnum.MISSING,
                        VerificationStatusEnum.DAMAGED,
                    ]),
                )
            )
        )
        return list(result.scalars().all())
