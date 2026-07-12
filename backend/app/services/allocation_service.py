"""
Allocation service — allocate, return, conflict handling, overdue detection.
"""

import logging
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.constants import AssetStatusEnum, AllocationStatusEnum, VALID_ASSET_TRANSITIONS
from app.exceptions.handlers import NotFoundException, ConflictException, BadRequestException
from app.models.asset_allocation import AssetAllocation
from app.models.asset_status_history import AssetStatusHistory
from app.models.activity_log import ActivityLog
from app.models.notification import Notification
from app.repositories.allocation_repository import AllocationRepository
from app.repositories.asset_repository import AssetRepository
from app.repositories.user_repository import UserRepository
from app.schemas.asset_allocation import AllocationCreate, AllocationReturn, AllocationResponse

logger = logging.getLogger("assetflow.allocations")


class AllocationService:

    def __init__(self, db: AsyncSession):
        self.db = db
        self.alloc_repo = AllocationRepository(db)
        self.asset_repo = AssetRepository(db)
        self.user_repo = UserRepository(db)

    async def allocate_asset(self, data: AllocationCreate, allocated_by: UUID) -> AssetAllocation:
        """
        Allocate an asset to an employee/department.
        Prevents double-allocation — if already allocated, returns conflict with current holder info.
        """
        asset = await self.asset_repo.get_by_id(data.asset_id)
        if not asset:
            raise NotFoundException(message="Asset not found")

        # Check if asset is already allocated
        if asset.current_status != AssetStatusEnum.AVAILABLE:
            active_alloc = await self.alloc_repo.find_active_allocation_by_asset(data.asset_id)
            holder_name = "Unknown"
            alloc_id = None
            holder_id = None

            if active_alloc and active_alloc.employee:
                user = await self.user_repo.get_by_id(active_alloc.employee_id)
                if user:
                    holder_name = f"{user.first_name} {user.last_name or ''}".strip()
                holder_id = active_alloc.employee_id
                alloc_id = active_alloc.id

            raise ConflictException(
                message=f"Asset {asset.asset_tag} is currently {asset.current_status.value}",
                detail=f"Currently held by {holder_name}. Use Transfer Request instead.",
                data={
                    "current_holder_id": str(holder_id) if holder_id else None,
                    "current_holder_name": holder_name,
                    "current_allocation_id": str(alloc_id) if alloc_id else None,
                    "suggestion": "Use the Transfer Request endpoint to request this asset.",
                },
            )

        # Validate employee exists
        if data.employee_id:
            employee = await self.user_repo.get_by_id(data.employee_id)
            if not employee:
                raise NotFoundException(message="Employee not found")

        # Create allocation
        allocation = AssetAllocation(
            asset_id=data.asset_id,
            employee_id=data.employee_id,
            department_id=data.department_id,
            expected_return_date=data.expected_return_date,
            allocation_status=AllocationStatusEnum.ALLOCATED,
            created_by=allocated_by,
            updated_by=allocated_by,
        )
        allocation = await self.alloc_repo.create(allocation)

        # Update asset status to ALLOCATED
        self.db.add(AssetStatusHistory(
            asset_id=data.asset_id,
            old_status=AssetStatusEnum.AVAILABLE,
            new_status=AssetStatusEnum.ALLOCATED,
            changed_by=allocated_by,
            reason=f"Allocated to employee/department",
            created_by=allocated_by,
        ))
        await self.asset_repo.update_fields(data.asset_id, {
            "current_status": AssetStatusEnum.ALLOCATED,
            "current_holder": data.employee_id,
            "updated_by": allocated_by,
        })

        # Notify the employee
        if data.employee_id:
            self.db.add(Notification(
                recipient=data.employee_id,
                title="Asset Assigned",
                message=f"Asset {asset.asset_tag} ({asset.asset_name}) has been allocated to you.",
                notification_type="ASSET_ASSIGNED",
                created_by=allocated_by,
            ))

        self.db.add(ActivityLog(
            user_id=allocated_by, module="ALLOCATIONS", action="ALLOCATE", record_id=allocation.id
        ))
        await self.alloc_repo.commit()

        logger.info("Asset %s allocated to %s by %s", data.asset_id, data.employee_id, allocated_by)
        return allocation

    async def return_asset(self, allocation_id: UUID, data: AllocationReturn, returned_by: UUID) -> AssetAllocation:
        """
        Return an allocated asset.
        Updates allocation status, captures condition notes, reverts asset to AVAILABLE.
        """
        allocation = await self.alloc_repo.get_by_id(allocation_id)
        if not allocation:
            raise NotFoundException(message="Allocation not found")

        if allocation.allocation_status != AllocationStatusEnum.ALLOCATED:
            raise BadRequestException(message="This allocation is not in ALLOCATED status")

        now = datetime.now(timezone.utc)

        # Update allocation
        await self.alloc_repo.update_fields(allocation_id, {
            "allocation_status": AllocationStatusEnum.RETURNED,
            "actual_return_date": now,
            "check_in_notes": data.check_in_notes,
            "updated_by": returned_by,
        })

        # Update asset status back to AVAILABLE
        self.db.add(AssetStatusHistory(
            asset_id=allocation.asset_id,
            old_status=AssetStatusEnum.ALLOCATED,
            new_status=AssetStatusEnum.AVAILABLE,
            changed_by=returned_by,
            reason=f"Asset returned. Notes: {data.check_in_notes or 'N/A'}",
            created_by=returned_by,
        ))

        asset_update = {
            "current_status": AssetStatusEnum.AVAILABLE,
            "current_holder": None,
            "updated_by": returned_by,
        }
        if data.asset_condition:
            asset_update["asset_condition"] = data.asset_condition
        await self.asset_repo.update_fields(allocation.asset_id, asset_update)

        self.db.add(ActivityLog(
            user_id=returned_by, module="ALLOCATIONS", action="RETURN", record_id=allocation_id
        ))
        await self.alloc_repo.commit()

        logger.info("Asset returned for allocation %s by %s", allocation_id, returned_by)
        return await self.alloc_repo.get_by_id(allocation_id)

    async def list_allocations(self, skip: int = 0, limit: int = 20) -> tuple[list[AssetAllocation], int]:
        """List all allocations."""
        from app.core.constants import StatusEnum
        allocs = await self.alloc_repo.get_all(
            skip=skip, limit=limit,
            filters=[AssetAllocation.status == StatusEnum.ACTIVE]
        )
        total = await self.alloc_repo.count(
            filters=[AssetAllocation.status == StatusEnum.ACTIVE]
        )
        return allocs, total

    async def get_overdue(self, skip: int = 0, limit: int = 20) -> list[AssetAllocation]:
        """Get overdue allocations."""
        return await self.alloc_repo.get_overdue_allocations(skip=skip, limit=limit)

    def to_response(self, alloc: AssetAllocation) -> AllocationResponse:
        """Convert model to response DTO."""
        asset_tag = None
        asset_name = None
        if alloc.asset:
            asset_tag = alloc.asset.asset_tag
            asset_name = alloc.asset.asset_name
        emp_name = None
        if alloc.employee:
            emp_name = f"{alloc.employee.first_name} {alloc.employee.last_name or ''}".strip()
        dept_name = None
        if alloc.department:
            dept_name = alloc.department.department_name

        return AllocationResponse(
            id=alloc.id,
            asset_id=alloc.asset_id,
            asset_tag=asset_tag,
            asset_name=asset_name,
            employee_id=alloc.employee_id,
            employee_name=emp_name,
            department_id=alloc.department_id,
            department_name=dept_name,
            allocated_date=alloc.allocated_date,
            expected_return_date=alloc.expected_return_date,
            actual_return_date=alloc.actual_return_date,
            allocation_status=alloc.allocation_status,
            check_in_notes=alloc.check_in_notes,
            status=alloc.status,
            created_datetime=alloc.created_datetime,
        )
