export const ROLE_LABELS = {
  host_admin: "Host Admin",
  property_manager: "Property Manager",
  cleaner: "Cleaner",
  owner: "Property Owner",
};

export const ROLE_NAVIGATION = {
  host_admin: ["dashboard","bookings","guests","cleaning","maintenance","supplies","revenue","leads","owner","team-access","settings","account"],
  property_manager: ["dashboard","bookings","guests","cleaning","maintenance","supplies","revenue","owner","account"],
  cleaner: ["cleaner-portal","cleaner-completed","account"],
  owner: ["owner-portal","owner-properties","owner-bookings","owner-revenue","owner-maintenance","owner","account"],
};

export function canAccessPage(role, pageKey) {
  return Boolean(role && ROLE_NAVIGATION[role]?.includes(pageKey));
}

export function canAccessRecord({ role, propertyId, allowedPropertyIds }) {
  if (role === "host_admin") return true;
  if (!propertyId) return false;
  return Array.isArray(allowedPropertyIds) && allowedPropertyIds.includes(propertyId);
}

export function getDefaultPageForRole(role) {
  if (role === "cleaner") return "cleaner-portal";
  if (role === "owner") return "owner-portal";
  return "dashboard";
}
