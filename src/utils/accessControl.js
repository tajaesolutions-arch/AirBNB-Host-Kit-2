export const ROLE_PAGE_ACCESS = {
  admin: [
    "dashboard","bookings","guests","cleaning","maintenance","supplies","revenue","leads","owner","tax","sops","messages","settings","smart-tools","account",
  ],
  host: [
    "dashboard","bookings","guests","cleaning","maintenance","supplies","revenue","leads","owner","tax","sops","messages","settings","smart-tools","account",
  ],
  cleaner: ["cleaning", "account"],
  owner: ["owner", "maintenance", "revenue", "account"],
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
  account: "account",
  "my-account": "account",
};

export function normalizePageKey(page) {
  return PAGE_ALIASES[page] || "dashboard";
}

export function isPageAllowedForRole(role, page) {
  const normalizedRole = ROLE_PAGE_ACCESS[role] ? role : "host";
  const normalizedPage = normalizePageKey(page);
  return ROLE_PAGE_ACCESS[normalizedRole].includes(normalizedPage);
}

export function getAllowedNavKeysForRole(role) {
  const normalizedRole = ROLE_PAGE_ACCESS[role] ? role : "host";
  return new Set(ROLE_PAGE_ACCESS[normalizedRole]);
}
