/**
 * Role-based access control hook.
 * Provides granular permission checks for UI visibility.
 */
import { useAuth } from '@/contexts/AuthContext';
import { ROLES } from '@/constants/roles';

export function useRoleAccess() {
  const { user, hasRole, hasAnyRole } = useAuth();

  const isAdmin = hasRole(ROLES.ADMIN);
  const isAssetManager = hasRole(ROLES.ASSET_MANAGER);
  const isDepartmentHead = hasRole(ROLES.DEPARTMENT_HEAD);
  const isEmployee = hasRole(ROLES.EMPLOYEE);

  return {
    // Role checks
    isAdmin,
    isAssetManager,
    isDepartmentHead,
    isEmployee,

    // Feature permissions
    canRegisterAsset: isAdmin || isAssetManager,
    canAlterAsset: isAdmin || isAssetManager,
    canAllocateAsset: isAdmin || isAssetManager,
    canApproveTransfer: isAssetManager || isDepartmentHead,
    canApproveMaintenance: isAssetManager,
    canManageOrganization: isAdmin,
    canPromoteUser: isAdmin,
    canViewAllAssets: isAdmin || isAssetManager,
    canViewDeptAssets: isDepartmentHead,
    canViewAudits: isAdmin || isAssetManager,
    canViewReports: isAdmin || isAssetManager || isDepartmentHead,
    canViewActivityLogs: isAdmin,
    canViewOverdueReturns: isAdmin || isAssetManager || isDepartmentHead,
    canManageMaintenanceKanban: isAdmin || isAssetManager,

    // Approval workflow: who needs approval?
    needsApproval: isEmployee || isDepartmentHead,
    // Asset managers don't need approval for their requests
    skipApproval: isAssetManager || isAdmin,

    // Current user info
    userId: user?.id,
    userRole: user?.role,
    userDepartmentId: user?.department_id,
  };
}
