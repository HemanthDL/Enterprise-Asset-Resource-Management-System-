"""
Asset service — registration, lifecycle management, search.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AssetStatusEnum, VALID_ASSET_TRANSITIONS, StatusEnum
from app.exceptions.handlers import NotFoundException, BadRequestException, ConflictException
from app.models.asset import Asset
from app.models.asset_status_history import AssetStatusHistory
from app.models.activity_log import ActivityLog
from app.repositories.asset_repository import AssetRepository
from app.repositories.allocation_repository import AllocationRepository
from app.utils.asset_tag_generator import generate_asset_tag
from app.schemas.asset import AssetCreate, AssetUpdate, AssetStatusChange, AssetResponse

logger = logging.getLogger("assetflow.assets")


class AssetService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.asset_repo = AssetRepository(db)
        self.alloc_repo = AllocationRepository(db)

    async def register_asset(self, data: AssetCreate, created_by: UUID) -> Asset:
        """Register a new asset with auto-generated tag."""
        # Check serial number uniqueness
        if data.serial_number:
            existing = await self.asset_repo.get_by_serial(data.serial_number)
            if existing:
                raise ConflictException(message="Serial number already exists")

        # Auto-generate asset tag
        tag = await generate_asset_tag(self.db)

        asset = Asset(
            asset_tag=tag,
            asset_name=data.asset_name,
            category_id=data.category_id,
            serial_number=data.serial_number,
            manufacturer=data.manufacturer,
            model=data.model,
            purchase_date=data.purchase_date,
            purchase_cost=data.purchase_cost,
            asset_condition=data.asset_condition,
            location=data.location,
            department_id=data.department_id,
            is_bookable=data.is_bookable,
            photo_url=data.photo_url,
            warranty_months=data.warranty_months,
            document_url=data.document_url,
            current_status=AssetStatusEnum.AVAILABLE,
            created_by=created_by,
            updated_by=created_by,
        )
        asset = await self.asset_repo.create(asset)

        # Record initial status
        self.db.add(AssetStatusHistory(
            asset_id=asset.id,
            old_status=None,
            new_status=AssetStatusEnum.AVAILABLE,
            changed_by=created_by,
            reason="Asset registered",
            created_by=created_by,
        ))

        self.db.add(ActivityLog(
            user_id=created_by, module="ASSETS", action="REGISTER", record_id=asset.id
        ))
        await self.asset_repo.commit()

        logger.info("Asset registered: %s (%s) by %s", tag, data.asset_name, created_by)
        return asset

    async def get_asset(self, asset_id: UUID) -> Asset:
        """Get asset by ID or raise 404."""
        asset = await self.asset_repo.get_by_id(asset_id)
        if not asset:
            raise NotFoundException(message="Asset not found")
        return asset

    async def search_assets(
        self,
        skip: int = 0,
        limit: int = 20,
        **filters,
    ) -> tuple[list[Asset], int]:
        """Search assets with filters. Returns (assets, total_count)."""
        assets = await self.asset_repo.search_assets(skip=skip, limit=limit, **filters)
        total = await self.asset_repo.count_search(**filters)
        return assets, total

    async def update_asset(self, asset_id: UUID, data: AssetUpdate, updated_by: UUID) -> Asset:
        """Update asset fields (not lifecycle status)."""
        await self.get_asset(asset_id)

        update_data = data.model_dump(exclude_unset=True)
        if not update_data:
            raise BadRequestException(message="No fields to update")

        # Serial number uniqueness check
        if "serial_number" in update_data and update_data["serial_number"]:
            existing = await self.asset_repo.get_by_serial(update_data["serial_number"])
            if existing and existing.id != asset_id:
                raise ConflictException(message="Serial number already exists")

        update_data["updated_by"] = updated_by
        asset = await self.asset_repo.update_fields(asset_id, update_data)

        self.db.add(ActivityLog(
            user_id=updated_by, module="ASSETS", action="UPDATE", record_id=asset_id
        ))
        await self.asset_repo.commit()

        return asset

    async def change_status(self, asset_id: UUID, data: AssetStatusChange, changed_by: UUID) -> Asset:
        """
        Change the lifecycle status of an asset.
        Validates against VALID_ASSET_TRANSITIONS.
        """
        asset = await self.get_asset(asset_id)
        current = asset.current_status
        new = data.new_status

        # Validate transition
        allowed = VALID_ASSET_TRANSITIONS.get(current, set())
        if new not in allowed:
            raise BadRequestException(
                message=f"Invalid status transition: {current.value} → {new.value}",
                detail=f"Allowed transitions from {current.value}: {[s.value for s in allowed]}",
            )

        # Record history
        self.db.add(AssetStatusHistory(
            asset_id=asset_id,
            old_status=current,
            new_status=new,
            changed_by=changed_by,
            reason=data.reason,
            created_by=changed_by,
        ))

        # Update asset status
        update_data = {"current_status": new, "updated_by": changed_by}
        if new == AssetStatusEnum.AVAILABLE:
            update_data["current_holder"] = None
        await self.asset_repo.update_fields(asset_id, update_data)

        self.db.add(ActivityLog(
            user_id=changed_by, module="ASSETS", action=f"STATUS_{current.value}_TO_{new.value}", record_id=asset_id
        ))
        await self.asset_repo.commit()

        logger.info("Asset %s status changed: %s → %s by %s", asset_id, current.value, new.value, changed_by)
        return await self.get_asset(asset_id)

    async def get_asset_history(self, asset_id: UUID) -> dict:
        """Get combined status + allocation history for an asset."""
        await self.get_asset(asset_id)
        status_history = await self.asset_repo.get_status_history(asset_id)
        allocation_history = await self.alloc_repo.get_allocations_by_asset(asset_id)
        return {
            "status_history": status_history,
            "allocation_history": allocation_history,
        }

    def to_response(self, asset: Asset) -> AssetResponse:
        """Convert Asset model to response DTO."""
        holder_name = None
        if asset.holder:
            holder_name = f"{asset.holder.first_name} {asset.holder.last_name or ''}".strip()
        return AssetResponse(
            id=asset.id,
            asset_tag=asset.asset_tag,
            asset_name=asset.asset_name,
            category_id=asset.category_id,
            category_name=asset.category.category_name if asset.category else None,
            serial_number=asset.serial_number,
            manufacturer=asset.manufacturer,
            model=asset.model,
            purchase_date=asset.purchase_date,
            purchase_cost=asset.purchase_cost,
            asset_condition=asset.asset_condition,
            location=asset.location,
            department_id=asset.department_id,
            department_name=asset.department.department_name if asset.department else None,
            is_bookable=asset.is_bookable,
            photo_url=asset.photo_url,
            warranty_months=asset.warranty_months,
            document_url=asset.document_url,
            current_status=asset.current_status,
            current_holder=asset.current_holder,
            current_holder_name=holder_name,
            status=asset.status,
            created_datetime=asset.created_datetime,
        )
