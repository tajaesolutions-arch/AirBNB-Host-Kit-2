function normalizeMemberships(memberships) {
  return Array.isArray(memberships) ? memberships.filter(Boolean) : [];
}

export function getAssignedPropertyIds(memberships, role) {
  const safeRole = String(role || "").toLowerCase();
  if (safeRole === "admin" || safeRole === "host") return ["*"];

  const ids = new Set(
    normalizeMemberships(memberships)
      .filter((m) => m.active !== false)
      .map((m) => m.property_id)
      .filter(Boolean)
  );

  return [...ids];
}

export function filterByAssignedProperties(records, assignedPropertyIds) {
  const rows = Array.isArray(records) ? records : [];
  const ids = Array.isArray(assignedPropertyIds) ? assignedPropertyIds : [];
  if (ids.includes("*")) return rows;
  if (ids.length === 0) return [];

  const allowed = new Set(ids);
  return rows.filter((row) => row && allowed.has(row.property_id));
}

function hasFlag(memberships, propertyId, flagName) {
  if (!propertyId) return false;
  return normalizeMemberships(memberships).some(
    (m) => m.active !== false && m.property_id === propertyId && Boolean(m[flagName])
  );
}

export function canViewFinancials(memberships, propertyId) {
  return hasFlag(memberships, propertyId, "can_view_financials");
}

export function canEditOperations(memberships, propertyId) {
  return hasFlag(memberships, propertyId, "can_edit_operations");
}

export function canApproveMaintenance(memberships, propertyId) {
  return hasFlag(memberships, propertyId, "can_approve_maintenance");
}
