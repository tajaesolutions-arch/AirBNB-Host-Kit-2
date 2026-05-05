import { NAV_BY_ROLE } from "../config/navigation.js";
import { normalizeRole } from "../config/roles.js";

const roleIn = (role, allowed) => allowed.includes(normalizeRole(role));

export function getPermissionsForRole(role) {
  const normalizedRole = normalizeRole(role);
  return {
    role: normalizedRole,
    canViewDashboard: roleIn(normalizedRole, ["admin", "host", "property_manager", "owner"]),
    canManageWorkspace: roleIn(normalizedRole, ["admin", "host", "property_manager"]),
    canApproveUsers: roleIn(normalizedRole, ["admin", "host", "property_manager", "owner"]),
    canViewFinancials: roleIn(normalizedRole, ["admin", "host", "property_manager", "owner"]),
    canViewOwnerReports: roleIn(normalizedRole, ["admin", "host", "property_manager", "owner"]),
    canManageProperties: roleIn(normalizedRole, ["admin", "host", "property_manager", "owner"]),
    canManageBookings: roleIn(normalizedRole, ["admin", "host", "property_manager", "owner"]),
    canManageCleaning: roleIn(normalizedRole, ["admin", "host", "property_manager"]),
    canManageMaintenance: roleIn(normalizedRole, ["admin", "host", "property_manager", "owner"]),
    canViewAssignedCleaningTasks: normalizedRole === "cleaner",
    canViewAssignedMaintenanceWorkOrders: normalizedRole === "maintenance",
    canViewAssignedOwnerProperties: normalizedRole === "owner",
    canManageSupplies: roleIn(normalizedRole, ["admin", "host", "property_manager", "cleaner"]),
    canViewGuestCRM: roleIn(normalizedRole, ["admin", "host", "property_manager"]),
    canViewSettings: true,
  };
}

export function canAccessRoute(role, pageKey) {
  const normalizedRole = normalizeRole(role);
  const allowed = NAV_BY_ROLE[normalizedRole] || [];
  return allowed.includes(pageKey);
}
