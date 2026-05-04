export const ROLE_PERMISSIONS = {
  admin: ["*"],
  host: [
    "dashboard",
    "bookings",
    "guests",
    "cleaning",
    "maintenance",
    "supplies",
    "revenue",
    "leads",
    "owner",
    "tax",
    "sops",
    "messages",
    "settings",
    "account",
  ],
  property_manager: [
    "property-manager",
    "bookings",
    "cleaning",
    "maintenance",
    "supplies",
    "owner",
    "account",
  ],
  cleaner: ["cleaner-portal", "account"],
  owner: ["owner-portal", "account"],
};

export const PAGE_ALIASES = {
  dashboard: "dashboard",
  "property-manager": "property-manager",
  "cleaner-portal": "cleaner-portal",
  "owner-portal": "owner-portal",
  bookings: "bookings",
  "booking-calendar": "bookings",
  guests: "guests",
  "guest-crm": "guests",
  cleaning: "cleaning",
  "cleaning-schedule": "cleaning",
  maintenance: "maintenance",
  "maintenance-tracker": "maintenance",
  supplies: "supplies",
  "supplies-inventory": "supplies",
  revenue: "revenue",
  "revenue-profit": "revenue",
  leads: "leads",
  "direct-leads": "leads",
  "direct-booking": "leads",
  owner: "owner",
  "owner-report": "owner",
  "owner-reports": "owner",
  ownerReport: "owner",
  tax: "tax",
  "tax-reserve": "tax",
  taxReserve: "tax",
  gct: "tax",
  sops: "sops",
  sop: "sops",
  SOPs: "sops",
  SOP: "sops",
  checklists: "sops",
  messages: "messages",
  templates: "messages",
  "guest-messages": "messages",
  settings: "settings",
  "smart-tools": "smart-tools",
  smartTools: "smart-tools",
  "admin-users": "admin-users",
  account: "account",
  "my-account": "account",
};

export function normalizePageKey(page) {
  return PAGE_ALIASES[page] || "dashboard";
}

function normalizeRole(role) {
  return ROLE_PERMISSIONS[role] ? role : "host";
}

export function getDefaultPageForRole(role) {
  const safeRole = normalizeRole(role);
  const pages = ROLE_PERMISSIONS[safeRole];
  if (pages.includes("*")) return "dashboard";

  const firstPage = pages[0] || "dashboard";

  if (firstPage === "property-manager") return "dashboard";
  if (firstPage === "cleaner-portal") return "cleaning";
  if (firstPage === "owner-portal") return "owner";

  return normalizePageKey(firstPage);
}

export function canAccessPage(role, page) {
  const safeRole = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[safeRole];
  if (permissions.includes("*")) return true;

  const normalizedPage = normalizePageKey(page);

  return permissions.some((permission) => {
    if (permission === normalizedPage) return true;

    if (permission === "cleaner-portal" && normalizedPage === "cleaning") return true;
    if (permission === "owner-portal" && normalizedPage === "owner") return true;
    if (permission === "property-manager" && normalizedPage === "dashboard") return true;

    return false;
  });
}

export function getAllowedNavItems(role, navItems = []) {
  const safeRole = normalizeRole(role);
  const permissions = ROLE_PERMISSIONS[safeRole];
  if (permissions.includes("*")) return navItems;

  return navItems.filter((item) => canAccessPage(safeRole, item?.key));
}

export const isPageAllowedForRole = canAccessPage;
export function getAllowedNavKeysForRole(role, navItems = []) {
  return new Set(getAllowedNavItems(role, navItems).map((item) => item.key));
}
