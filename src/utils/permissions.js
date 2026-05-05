export const ROLE_LABELS = {
  host: "Host",
  property_manager: "Property Manager",
  owner: "Property Owner",
  cleaner: "Cleaner",
  maintenance: "Maintenance Crew",
};

export const ROLE_HOME_PAGE = {
  host: "dashboard",
  property_manager: "dashboard",
  owner: "owner-dashboard",
  cleaner: "cleaner-dashboard",
  maintenance: "maintenance-dashboard",
};

export const ROLE_PAGE_ACCESS = {
  host: ["dashboard", "bookings", "guests", "cleaning", "maintenance", "supplies", "revenue", "leads", "owner", "tax", "sops", "messages", "settings", "account", "smart-tools", "users-access"],
  admin: ["*"],
  property_manager: ["dashboard", "bookings", "guests", "cleaning", "maintenance", "supplies", "revenue", "leads", "owner", "tax", "sops", "messages", "settings", "account", "smart-tools", "users-access"],
  owner: ["owner-dashboard", "owner", "bookings", "maintenance", "revenue", "messages", "settings", "account"],
  cleaner: ["cleaner-dashboard", "cleaning", "sops", "messages", "settings", "account"],
  maintenance: ["maintenance-dashboard", "maintenance", "sops", "messages", "settings", "account"],
};

export function normalizeRole(role) {
  const r = String(role || "").toLowerCase().trim();
  if (["admin", "host"].includes(r)) return "host";
  if (["property_manager", "property manager", "manager", "cohost", "co-host"].includes(r)) return "property_manager";
  if (["cleaner", "cleaning"].includes(r)) return "cleaner";
  if (["owner", "property_owner", "property owner"].includes(r)) return "owner";
  if (["maintenance", "maintenance_crew", "maintenance crew", "vendor", "technician"].includes(r)) return "maintenance";
  return "";
}

export function getAssignedPropertyIds(memberships = []) { return [...new Set(memberships.filter((m) => m?.active !== false).map((m) => m?.property_id).filter(Boolean))]; }
export function getAssignedPropertyRecordIds(memberships = []) { return [...new Set(memberships.filter((m) => m?.active !== false).map((m) => m?.property_record_id).filter(Boolean))]; }

export function getAvailableRoles({ memberships = [], profile, user, properties = [] }) {
  const roles = new Set();
  memberships.filter((m) => m?.active !== false).forEach((m) => { const r = normalizeRole(m?.access_role); if (r) roles.add(r); });
  const profileRole = normalizeRole(profile?.role || user?.user_metadata?.role || user?.user_metadata?.requested_role);
  if (profileRole) roles.add(profileRole);
  const ownsProperties = properties.some((p) => p?.user_id && p?.user_id === user?.id);
  if (ownsProperties) roles.add("host");
  if (!roles.size) roles.add("host");
  return Array.from(roles);
}

export function getPermissions({ memberships = [], effectiveRole = "host" }) {
  const role = normalizeRole(effectiveRole) || "host";
  const isHostLike = role === "host";
  if (isHostLike) return { role, isHostLike: true, can_view_financials: true, can_edit_operations: true, can_approve_maintenance: true };
  if (role === "property_manager") return { role, isHostLike: false, can_view_financials: true, can_edit_operations: true, can_approve_maintenance: true };
  if (role === "owner") return { role, isHostLike: false, can_view_financials: true, can_edit_operations: false, can_approve_maintenance: false };
  const rows = memberships.filter((m) => normalizeRole(m?.access_role) === role && m?.active !== false);
  return { role, isHostLike: false, can_view_financials: rows.some((m) => m?.can_view_financials), can_edit_operations: rows.some((m) => m?.can_edit_operations), can_approve_maintenance: rows.some((m) => m?.can_approve_maintenance) };
}

export const canAccessPage = (page, permissions = {}) => {
  const role = normalizeRole(permissions?.role) || "host";
  if (page === "revenue") return Boolean(permissions?.isHostLike || permissions?.can_view_financials || role === "property_manager" || role === "owner");
  const allowed = ROLE_PAGE_ACCESS[role] || [];
  return allowed.includes("*") || allowed.includes(page);
};
export const getDefaultPageForRole = (role) => ROLE_HOME_PAGE[normalizeRole(role) || "host"] || "dashboard";
