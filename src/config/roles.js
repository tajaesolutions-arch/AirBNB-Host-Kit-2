import { LayoutDashboard, CalendarDays, Users, Sparkles, Wrench, Package, BarChart3, MessageSquare, FileText, Calculator, ClipboardList, Settings, Home } from "lucide-react";

export const ROLE_KEYS = {
  ADMIN: "admin",
  PROPERTY_MANAGER: "property_manager",
  HOST: "host",
  OWNER: "owner",
  CLEANER: "cleaner",
  MAINTENANCE: "maintenance",
};

export const ROLE_LABELS = {
  [ROLE_KEYS.ADMIN]: "Admin",
  [ROLE_KEYS.HOST]: "Host",
  [ROLE_KEYS.PROPERTY_MANAGER]: "Property Manager",
  [ROLE_KEYS.OWNER]: "Owner",
  [ROLE_KEYS.CLEANER]: "Cleaner",
  [ROLE_KEYS.MAINTENANCE]: "Maintenance",
};

const NAV = {
  admin: ["dashboard","properties","bookings","guests","cleaning","maintenance","supplies","revenue","leads","owner","tax","sops","messages","settings","users-access","smart-tools","account","owner-dashboard","cleaner-dashboard","maintenance-dashboard","property-manager"],
  host: ["dashboard","properties","bookings","guests","cleaning","maintenance","supplies","revenue","leads","owner","tax","sops","messages","settings"],
  property_manager: ["dashboard","properties","bookings","guests","cleaning","maintenance","supplies","revenue","leads","owner","tax","sops","messages","settings"],
  owner: ["owner-dashboard","bookings","revenue","maintenance","owner","messages"],
  cleaner: ["cleaner-dashboard","cleaning","sops","messages"],
  maintenance: ["maintenance-dashboard","maintenance","sops","messages"],
};

export const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "owner-dashboard", label: "Owner Dashboard", icon: Home },
  { key: "cleaner-dashboard", label: "Cleaner Dashboard", icon: Sparkles },
  { key: "maintenance-dashboard", label: "Maintenance Dashboard", icon: Wrench },
  { key: "properties", label: "Properties", icon: Home },
  { key: "bookings", label: "Booking Calendar", icon: CalendarDays },
  { key: "guests", label: "Guest CRM", icon: Users },
  { key: "cleaning", label: "My Cleaning Tasks", icon: Sparkles },
  { key: "maintenance", label: "My Work Orders", icon: Wrench },
  { key: "supplies", label: "Supplies", icon: Package },
  { key: "revenue", label: "Revenue Summary", icon: BarChart3 },
  { key: "leads", label: "Direct Leads", icon: MessageSquare },
  { key: "owner", label: "Owner Report", icon: FileText },
  { key: "tax", label: "Tax Reserve", icon: Calculator },
  { key: "sops", label: "SOPs", icon: ClipboardList },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "settings", label: "Settings", icon: Settings },
];

export const normalizeRole = (role) => {
  const r = String(role || "").toLowerCase().trim();
  if (r === "admin") return "admin";
  if (r === "host") return "host";
  if (["property_manager", "property manager", "manager", "cohost", "co-host"].includes(r)) return "property_manager";
  if (["cleaner", "cleaning"].includes(r)) return "cleaner";
  if (["owner", "property_owner", "property owner"].includes(r)) return "owner";
  if (["maintenance", "maintenance_crew", "maintenance crew", "vendor", "technician"].includes(r)) return "maintenance";
  return "host";
};

export const getDefaultPageForRole = (role) => ({ admin:"dashboard", host:"dashboard", property_manager:"dashboard", owner:"owner-dashboard", cleaner:"cleaner-dashboard", maintenance:"maintenance-dashboard" }[normalizeRole(role)] || "dashboard");
export const getNavigationForRole = (role) => NAV[normalizeRole(role)] || NAV.host;
export const canAccessPage = (role, pageKey) => normalizeRole(role) === "admin" || getNavigationForRole(role).includes(pageKey) || ["account","smart-tools"].includes(pageKey);
