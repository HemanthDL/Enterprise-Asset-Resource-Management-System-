"""
Transfer request repository.
"""

from uuid import UUID

from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.transfer_request import TransferRequest
from app.repositories.base import BaseRepository
from app.core.constants import TransferStatusEnum, StatusEnum


class TransferRepository(BaseRepository[TransferRequest]):

    def __init__(self, db: AsyncSession):
        super().__init__(TransferRequest, db)

    async def get_pending_transfers(self, skip: int = 0, limit: int = 20) -> list[TransferRequest]:
        """List all pending transfer requests."""
        return await self.get_all(
            skip=skip,
            limit=limit,
            filters=[
                TransferRequest.approval_status == TransferStatusEnum.REQUESTED,
                TransferRequest.status == StatusEnum.ACTIVE,
            ],
        )

    async def count_pending(self) -> int:
        """Count pending transfer requests."""
        return await self.count(
            filters=[
                TransferRequest.approval_status == TransferStatusEnum.REQUESTED,
                TransferRequest.status == StatusEnum.ACTIVE,
            ]
        )

    async def get_transfers_for_asset(self, asset_id: UUID) -> list[TransferRequest]:
        """Get all transfer requests for an asset."""
        result = await self.db.execute(
            select(TransferRequest)
            .where(TransferRequest.asset_id == asset_id)
            .order_by(TransferRequest.created_datetime.desc())
        )
        return list(result.scalars().all())
