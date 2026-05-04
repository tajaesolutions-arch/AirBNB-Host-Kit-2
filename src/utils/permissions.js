export const ROLE_PAGE_ACCESS = {
  host: ["*"],
  admin: ["*"],
  property_manager: ["dashboard", "bookings", "guests", "cleaning", "maintenance", "supplies", "leads", "settings", "account"],
  cleaner: ["cleaning", "account", "settings"],
  owner: ["dashboard", "owner", "maintenance", "account", "settings"],
};

export function getAssignedPropertyIds(memberships = []) {
  return [...new Set((memberships || []).filter((m) => m?.active !== false).map((m) => m?.property_id).filter(Boolean))];
}

export function getAssignedPropertyRecordIds(memberships = []) {
  return [...new Set((memberships || []).filter((m) => m?.active !== false).map((m) => m?.property_record_id).filter(Boolean))];
}

export function getEffectiveRole({ user, memberships = [], properties = [] }) {
  const active = memberships.filter((m) => m?.active !== false);
  const roles = new Set(active.map((m) => m?.access_role).filter(Boolean));
  if (roles.has("host") || roles.has("admin")) return "host";
  if (roles.has("property_manager")) return "property_manager";
  if (roles.has("owner")) return "owner";
  if (roles.has("cleaner")) return "cleaner";
  const ownsProperties = Array.isArray(properties) && properties.some((p) => p?.user_id && user?.id && p.user_id === user.id);
  return ownsProperties || active.length === 0 ? "host" : "cleaner";
}

export function getPermissions({ memberships = [], effectiveRole = "host" }) {
  const isHostLike = effectiveRole === "host" || effectiveRole === "admin";
  if (isHostLike) return { role: effectiveRole, isHostLike: true, can_view_financials: true, can_edit_operations: true, can_approve_maintenance: true };
  const rows = memberships.filter((m) => m?.active !== false && (m?.access_role || "") === effectiveRole);
  return {
    role: effectiveRole,
    isHostLike: false,
    can_view_financials: rows.some((m) => m?.can_view_financials),
    can_edit_operations: rows.some((m) => m?.can_edit_operations),
    can_approve_maintenance: rows.some((m) => m?.can_approve_maintenance),
  };
}

export const canAccessPage = (page, permissions = {}) => {
  const allowed = ROLE_PAGE_ACCESS[permissions?.role] || [];
  return allowed.includes("*") || allowed.includes(page);
};
export const canViewFinancials = (permissions) => Boolean(permissions?.isHostLike || permissions?.can_view_financials);
export const canEditOperations = (permissions) => Boolean(permissions?.isHostLike || permissions?.can_edit_operations);
export const canApproveMaintenance = (permissions) => Boolean(permissions?.isHostLike || permissions?.can_approve_maintenance);

export const getDefaultPageForRole = (role) => (role === "cleaner" ? "cleaning" : role === "owner" ? "owner" : "dashboard");

export function filterPropertiesByMembership(properties = [], assignedPropertyIds = [], assignedPropertyRecordIds = [], isHostLike = false) {
  if (isHostLike) return properties;
  const ids = new Set(assignedPropertyIds || []);
  const recIds = new Set(assignedPropertyRecordIds || []);
  return properties.filter((p) => ids.has(p?.property_id) || recIds.has(p?.property_record_id) || recIds.has(p?.id));
}

export function filterRecordsByAssignedProperties(records = [], assignedPropertyIds = [], isHostLike = false) {
  if (isHostLike) return records;
  const ids = new Set(assignedPropertyIds || []);
  return records.filter((r) => ids.has(r?.property_id));
}

export const filterByAssignedProperties = filterRecordsByAssignedProperties;
