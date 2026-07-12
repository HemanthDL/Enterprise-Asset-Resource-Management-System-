"""
Application-wide constants, Python enums mirroring PostgreSQL enums,
and the asset lifecycle transition map.
"""

import enum


# ---------------------------------------------------------------------------
# Enum mirrors of PostgreSQL types
# ---------------------------------------------------------------------------
class StatusEnum(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"


class RoleEnum(str, enum.Enum):
    ADMIN = "ADMIN"
    ASSET_MANAGER = "ASSET_MANAGER"
    DEPARTMENT_HEAD = "DEPARTMENT_HEAD"
    EMPLOYEE = "EMPLOYEE"


class AssetStatusEnum(str, enum.Enum):
    AVAILABLE = "AVAILABLE"
    ALLOCATED = "ALLOCATED"
    RESERVED = "RESERVED"
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE"
    LOST = "LOST"
    RETIRED = "RETIRED"
    DISPOSED = "DISPOSED"


class AllocationStatusEnum(str, enum.Enum):
    ALLOCATED = "ALLOCATED"
    RETURNED = "RETURNED"
    OVERDUE = "OVERDUE"


class TransferStatusEnum(str, enum.Enum):
    REQUESTED = "REQUESTED"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"


class BookingStatusEnum(str, enum.Enum):
    UPCOMING = "UPCOMING"
    ONGOING = "ONGOING"
    COMPLETED = "COMPLETED"
    CANCELLED = "CANCELLED"


class MaintenanceStatusEnum(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    TECHNICIAN_ASSIGNED = "TECHNICIAN_ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"


class AuditStatusEnum(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    CLOSED = "CLOSED"


class VerificationStatusEnum(str, enum.Enum):
    VERIFIED = "VERIFIED"
    MISSING = "MISSING"
    DAMAGED = "DAMAGED"


# ---------------------------------------------------------------------------
# Asset lifecycle valid transitions
# ---------------------------------------------------------------------------
VALID_ASSET_TRANSITIONS: dict[AssetStatusEnum, set[AssetStatusEnum]] = {
    AssetStatusEnum.AVAILABLE: {
        AssetStatusEnum.ALLOCATED,
        AssetStatusEnum.RESERVED,
        AssetStatusEnum.UNDER_MAINTENANCE,
        AssetStatusEnum.LOST,
        AssetStatusEnum.RETIRED,
    },
    AssetStatusEnum.ALLOCATED: {
        AssetStatusEnum.AVAILABLE,
    },
    AssetStatusEnum.RESERVED: {
        AssetStatusEnum.AVAILABLE,
    },
    AssetStatusEnum.UNDER_MAINTENANCE: {
        AssetStatusEnum.AVAILABLE,
    },
    AssetStatusEnum.RETIRED: {
        AssetStatusEnum.DISPOSED,
    },
    # Terminal states — no transitions out
    AssetStatusEnum.LOST: set(),
    AssetStatusEnum.DISPOSED: set(),
}


# ---------------------------------------------------------------------------
# Maintenance workflow valid transitions
# ---------------------------------------------------------------------------
VALID_MAINTENANCE_TRANSITIONS: dict[MaintenanceStatusEnum, set[MaintenanceStatusEnum]] = {
    MaintenanceStatusEnum.PENDING: {
        MaintenanceStatusEnum.APPROVED,
        MaintenanceStatusEnum.REJECTED,
    },
    MaintenanceStatusEnum.APPROVED: {
        MaintenanceStatusEnum.TECHNICIAN_ASSIGNED,
    },
    MaintenanceStatusEnum.TECHNICIAN_ASSIGNED: {
        MaintenanceStatusEnum.IN_PROGRESS,
    },
    MaintenanceStatusEnum.IN_PROGRESS: {
        MaintenanceStatusEnum.RESOLVED,
    },
    # Terminal states
    MaintenanceStatusEnum.REJECTED: set(),
    MaintenanceStatusEnum.RESOLVED: set(),
}


# ---------------------------------------------------------------------------
# Roles that can be promoted to (via Admin)
# ---------------------------------------------------------------------------
PROMOTABLE_ROLES: set[RoleEnum] = {
    RoleEnum.ASSET_MANAGER,
    RoleEnum.DEPARTMENT_HEAD,
}
