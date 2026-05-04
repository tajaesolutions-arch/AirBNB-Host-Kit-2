export const ROLE_PERMISSIONS = {
  admin: [
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
    "smart-tools",
    "admin-users",
    "account",
  ],
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
  cleaner: ["cleaning", "account"],
  owner: ["owner", "maintenance", "account"],
};

export const PAGE_ALIASES = {
  dashboard: "dashboard",
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
  return ROLE_PERMISSIONS[normalizeRole(role)][0] || "account";
}

export function canAccessPage(role, page) {
  const normalizedPage = normalizePageKey(page);
  return ROLE_PERMISSIONS[normalizeRole(role)].includes(normalizedPage);
}

export function getAllowedNavItems(role) {
  return ROLE_PERMISSIONS[normalizeRole(role)];
}

// Backward-compatible aliases
export const isPageAllowedForRole = canAccessPage;
export function getAllowedNavKeysForRole(role) {
  return new Set(getAllowedNavItems(role));
}
