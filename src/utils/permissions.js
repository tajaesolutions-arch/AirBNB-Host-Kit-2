import { ROLE_LABELS, normalizeRole, getDefaultPageForRole as roleDefault, canAccessPage as roleCanAccessPage } from "../config/roles.js";

export { ROLE_LABELS, normalizeRole };

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

export const canAccessPage = (page, permissions = {}) => roleCanAccessPage(permissions?.role, page);
export const getDefaultPageForRole = (role) => roleDefault(role);
