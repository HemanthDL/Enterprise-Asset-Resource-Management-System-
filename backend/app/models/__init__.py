"""
ORM Models package. Import all models here so SQLAlchemy registry sees them.
"""

from app.models.user import User
from app.models.department import Department
from app.models.asset_category import AssetCategory
from app.models.asset import Asset
from app.models.asset_document import AssetDocument
from app.models.asset_status_history import AssetStatusHistory
from app.models.asset_allocation import AssetAllocation
from app.models.transfer_request import TransferRequest
from app.models.resource_booking import ResourceBooking
from app.models.maintenance_request import MaintenanceRequest
from app.models.maintenance_history import MaintenanceHistory
from app.models.audit_cycle import AuditCycle
from app.models.audit_asset import AuditAsset
from app.models.audit_history import AuditHistory
from app.models.notification import Notification
from app.models.activity_log import ActivityLog

__all__ = [
    "User",
    "Department",
    "AssetCategory",
    "Asset",
    "AssetDocument",
    "AssetStatusHistory",
    "AssetAllocation",
    "TransferRequest",
    "ResourceBooking",
    "MaintenanceRequest",
    "MaintenanceHistory",
    "AuditCycle",
    "AuditAsset",
    "AuditHistory",
    "Notification",
    "ActivityLog",
]
