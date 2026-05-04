export const ROLE_PAGE_ACCESS = {
  host: ["*"],
  admin: ["*"],
  property_manager: ["dashboard", "bookings", "guests", "cleaning", "maintenance", "supplies", "leads", "account"],
  cleaner: ["cleaning", "account"],
  owner: ["dashboard", "owner", "maintenance", "account"],
};

export function getEffectiveRole(memberships = [], user, properties = []) {
  const active = Array.isArray(memberships) ? memberships.filter((m) => m?.active !== false) : [];
  const roles = new Set(active.map((m) => m?.access_role).filter(Boolean));
  if (roles.has("host") || roles.has("admin")) return "host";
  if (roles.has("property_manager")) return "property_manager";
  if (roles.has("owner")) return "owner";
  if (roles.has("cleaner")) return "cleaner";
  const ownsProperties = Array.isArray(properties) && properties.some((p) => p?.user_id && user?.id && p.user_id === user.id);
  return ownsProperties || active.length === 0 ? "host" : "cleaner";
}

export function getPermissions(memberships = [], role = "host") {
  const isHostLike = role === "host" || role === "admin";
  if (isHostLike) return { role, isHostLike: true, can_view_financials: true, can_edit_operations: true, can_approve_maintenance: true };
  const rows = memberships.filter((m) => m?.active !== false && m?.access_role === role);
  return {
    role,
    isHostLike: false,
    can_view_financials: rows.some((m) => m?.can_view_financials),
    can_edit_operations: rows.some((m) => m?.can_edit_operations),
    can_approve_maintenance: rows.some((m) => m?.can_approve_maintenance),
  };
}

export const canAccessPage = (page, permissions) => (ROLE_PAGE_ACCESS[permissions?.role] || []).includes("*") || (ROLE_PAGE_ACCESS[permissions?.role] || []).includes(page);
export const canViewFinancials = (permissions) => Boolean(permissions?.isHostLike || permissions?.can_view_financials);
export const canEditOperations = (permissions) => Boolean(permissions?.isHostLike || permissions?.can_edit_operations);
export const canApproveMaintenance = (permissions) => Boolean(permissions?.isHostLike || permissions?.can_approve_maintenance);

export function filterByAssignedProperties(records = [], assignedPropertyIds = []) {
  if (!assignedPropertyIds?.length) return records;
  return records.filter((r) => assignedPropertyIds.includes(r?.property_id));
}

export function filterPropertiesByMembership(properties = [], assignedPropertyIds = [], isHostLike = false) {
  if (isHostLike || !assignedPropertyIds?.length) return properties;
  return properties.filter((p) => assignedPropertyIds.includes(p?.property_id));
}
