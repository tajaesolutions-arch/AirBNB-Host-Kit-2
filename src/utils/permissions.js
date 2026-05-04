export const ROLE_LABELS = {
  host: "Host / Admin",
  property_manager: "Property Manager",
  cleaner: "Cleaner",
  owner: "Owner",
};

export const ROLE_PAGE_ACCESS = {
  host: ["*"],
  admin: ["*"],
  property_manager: ["dashboard", "property-manager", "bookings", "guests", "cleaning", "maintenance", "supplies", "leads", "settings", "account", "revenue"],
  cleaner: ["cleaner-portal", "cleaning", "account"],
  owner: ["owner-portal", "owner", "maintenance", "account", "settings", "dashboard", "revenue"],
};

export function normalizeRole(role) {
  const r = String(role || "").toLowerCase();
  if (["admin", "host"].includes(r)) return "host";
  if (["property_manager", "property manager", "manager"].includes(r)) return "property_manager";
  if (["cleaner"].includes(r)) return "cleaner";
  if (["owner"].includes(r)) return "owner";
  return "";
}

export function getAssignedPropertyIds(memberships = []) { return [...new Set(memberships.filter((m) => m?.active !== false).map((m) => m?.property_id).filter(Boolean))]; }
export function getAssignedPropertyRecordIds(memberships = []) { return [...new Set(memberships.filter((m) => m?.active !== false).map((m) => m?.property_record_id).filter(Boolean))]; }

export function getAvailableRoles({ memberships = [], profile, user, properties = [] }) {
  const roles = new Set();
  memberships.filter((m) => m?.active !== false).forEach((m) => { const r = normalizeRole(m?.access_role); if (r) roles.add(r); });
  const profileRole = normalizeRole(profile?.role || user?.user_metadata?.role);
  if (profileRole === "host") roles.add("host");
  const ownsProperties = properties.some((p) => p?.user_id && p?.user_id === user?.id);
  if (ownsProperties) roles.add("host");
  return Array.from(roles);
}

export function getPermissions({ memberships = [], effectiveRole = "host" }) {
  const isHostLike = effectiveRole === "host" || effectiveRole === "admin";
  if (isHostLike) return { role: effectiveRole, isHostLike: true, can_view_financials: true, can_edit_operations: true, can_approve_maintenance: true };
  const rows = memberships.filter((m) => normalizeRole(m?.access_role) === effectiveRole && m?.active !== false);
  return { role: effectiveRole, isHostLike: false, can_view_financials: rows.some((m) => m?.can_view_financials), can_edit_operations: rows.some((m) => m?.can_edit_operations), can_approve_maintenance: rows.some((m) => m?.can_approve_maintenance) };
}

export const canAccessPage = (page, permissions = {}) => {
  if (page === "revenue") return Boolean(permissions?.isHostLike || permissions?.can_view_financials);
  const allowed = ROLE_PAGE_ACCESS[permissions?.role] || [];
  return allowed.includes("*") || allowed.includes(page);
};
export const getDefaultPageForRole = (role) => (role === "cleaner" ? "cleaner-portal" : role === "owner" ? "owner-portal" : role === "property_manager" ? "property-manager" : "dashboard");
