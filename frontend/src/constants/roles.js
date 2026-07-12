// Role enums matching backend
export const ROLES = {
  ADMIN: 'admin',
  ASSET_MANAGER: 'asset_manager',
  DEPARTMENT_HEAD: 'department_head',
  EMPLOYEE: 'employee',
};

export const ROLE_LABELS = {
  [ROLES.ADMIN]: 'Admin',
  [ROLES.ASSET_MANAGER]: 'Asset Manager',
  [ROLES.DEPARTMENT_HEAD]: 'Department Head',
  [ROLES.EMPLOYEE]: 'Employee',
};

// Asset lifecycle statuses
export const ASSET_STATUS = {
  AVAILABLE: 'available',
  ALLOCATED: 'allocated',
  UNDER_MAINTENANCE: 'under_maintenance',
  RESERVED: 'reserved',
  DISPOSED: 'disposed',
  LOST: 'lost',
  RETIRED: 'retired',
};

export const ASSET_STATUS_LABELS = {
  [ASSET_STATUS.AVAILABLE]: 'Available',
  [ASSET_STATUS.ALLOCATED]: 'Allocated',
  [ASSET_STATUS.UNDER_MAINTENANCE]: 'Under Maintenance',
  [ASSET_STATUS.RESERVED]: 'Reserved',
  [ASSET_STATUS.DISPOSED]: 'Disposed',
  [ASSET_STATUS.LOST]: 'Lost',
  [ASSET_STATUS.RETIRED]: 'Retired',
};

export const ASSET_STATUS_COLORS = {
  [ASSET_STATUS.AVAILABLE]: 'success',
  [ASSET_STATUS.ALLOCATED]: 'info',
  [ASSET_STATUS.UNDER_MAINTENANCE]: 'warning',
  [ASSET_STATUS.RESERVED]: 'secondary',
  [ASSET_STATUS.DISPOSED]: 'destructive',
  [ASSET_STATUS.LOST]: 'destructive',
  [ASSET_STATUS.RETIRED]: 'outline',
};

// Asset condition
export const CONDITION = {
  NEW: 'new',
  GOOD: 'good',
  FAIR: 'fair',
  POOR: 'poor',
  DAMAGED: 'damaged',
};

// Allocation status
export const ALLOCATION_STATUS = {
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ALLOCATED: 'allocated',
  RETURNED: 'returned',
};

// Transfer status
export const TRANSFER_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
};

// Booking status
export const BOOKING_STATUS = {
  UPCOMING: 'upcoming',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
};

// Maintenance status
export const MAINTENANCE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
};

export const MAINTENANCE_PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
};

export const PRIORITY_COLORS = {
  [MAINTENANCE_PRIORITY.LOW]: 'secondary',
  [MAINTENANCE_PRIORITY.MEDIUM]: 'info',
  [MAINTENANCE_PRIORITY.HIGH]: 'warning',
  [MAINTENANCE_PRIORITY.CRITICAL]: 'destructive',
};

// Audit statuses
export const AUDIT_STATUS = {
  PLANNED: 'planned',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
};

export const AUDIT_ITEM_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  MISSING: 'missing',
  DAMAGED: 'damaged',
};

// Notification types
export const NOTIFICATION_TYPES = {
  ASSET_ASSIGNED: 'asset_assigned',
  ASSET_RETURNED: 'asset_returned',
  MAINTENANCE_REQUEST: 'maintenance_request',
  MAINTENANCE_APPROVED: 'maintenance_approved',
  MAINTENANCE_REJECTED: 'maintenance_rejected',
  TRANSFER_REQUESTED: 'transfer_requested',
  TRANSFER_APPROVED: 'transfer_approved',
  TRANSFER_REJECTED: 'transfer_rejected',
  BOOKING_CONFIRMED: 'booking_confirmed',
  BOOKING_CANCELLED: 'booking_cancelled',
  OVERDUE_RETURN: 'overdue_return',
  AUDIT_DISCREPANCY: 'audit_discrepancy',
};
