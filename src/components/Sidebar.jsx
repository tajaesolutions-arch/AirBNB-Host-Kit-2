import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Sparkles,
  Wrench,
  Package,
  BarChart3,
  Home,
  MessageSquare,
  FileText,
  Calculator,
  ClipboardList,
  Settings,
  WandSparkles,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { canAccessPage, normalizeRole, ROLE_LABELS } from "../utils/permissions.js";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["host", "property_manager"] },
  { key: "owner-dashboard", label: "Owner Dashboard", icon: Home, roles: ["owner"] },
  { key: "cleaner-dashboard", label: "Cleaner Dashboard", icon: Sparkles, roles: ["cleaner"] },
  { key: "maintenance-dashboard", label: "Maintenance Dashboard", icon: Wrench, roles: ["maintenance"] },
  { key: "bookings", label: "Booking Calendar", icon: CalendarDays, roles: ["host", "property_manager", "owner"] },
  { key: "guests", label: "Guest CRM", icon: Users, roles: ["host", "property_manager"] },
  { key: "cleaning", label: "Cleaning Schedule", icon: Sparkles, roles: ["host", "property_manager", "cleaner"] },
  { key: "maintenance", label: "Maintenance Tracker", icon: Wrench, roles: ["host", "property_manager", "owner", "maintenance"] },
  { key: "supplies", label: "Supplies", icon: Package, roles: ["host", "property_manager"] },
  { key: "revenue", label: "Revenue Summary", icon: BarChart3, roles: ["host", "property_manager", "owner"] },
  { key: "leads", label: "Direct Leads", icon: MessageSquare, roles: ["host", "property_manager"] },
  { key: "owner", label: "Owner Report", icon: FileText, roles: ["host", "property_manager", "owner"] },
  { key: "tax", label: "Tax Reserve", icon: Calculator, roles: ["host", "property_manager"] },
  { key: "sops", label: "SOPs", icon: ClipboardList, roles: ["host", "property_manager", "cleaner", "maintenance"] },
  { key: "messages", label: "Messages", icon: MessageSquare, roles: ["host", "property_manager", "owner", "cleaner", "maintenance"] },
  { key: "settings", label: "Settings", icon: Settings, roles: ["host", "property_manager", "owner", "cleaner", "maintenance"] },
  { key: "smart-tools", label: "Smart Tools", icon: WandSparkles, roles: ["host", "property_manager"] },
  { key: "users-access", label: "Users & Access", icon: ShieldCheck, roles: ["host", "property_manager"] },
  { key: "account", label: "My Account", icon: Users, roles: ["host", "property_manager", "owner", "cleaner", "maintenance"] },
];

export default function Sidebar({ page, setPage, collapsed = false, onToggleCollapse, mobile = false, onClose, role = "host", permissions, assignedPropertyCount = 0 }) {
  const normalizedRole = normalizeRole(role) || "host";
  const perm = permissions || { role: normalizedRole };
  const allowedNavItems = NAV_ITEMS.filter((item) => (!item.roles || item.roles.includes(normalizedRole)) && canAccessPage(item.key, perm));

  const handleNavigate = (nextPage) => {
    if (typeof setPage === "function") setPage(nextPage);
    if (mobile && typeof onClose === "function") onClose();
  };

  return (
    <aside className={`sidebar ${collapsed ? "is-collapsed" : ""} ${mobile ? "sidebar-mobile is-mobile mobile" : ""}`}>
      <div className="sidebar-brand">
        <div className="sidebar-brand-main">
          <div className="sidebar-brand-mark" aria-hidden="true">HK</div>
          {!collapsed && <div className="sidebar-brand-copy"><div className="sidebar-brand-title">Host Kit</div><div className="sidebar-brand-subtitle">AirBNB Host Kit</div></div>}
        </div>
        {mobile ? <button type="button" className="sidebar-collapse-btn" onClick={onClose} aria-label="Close sidebar"><X size={18} /></button> : <button type="button" className="sidebar-collapse-btn" onClick={onToggleCollapse} aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>}
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {allowedNavItems.map((item) => {
          const Icon = item.icon;
          const active = page === item.key;
          return (
            <button key={item.key} type="button" className={`sidebar-nav-item ${active ? "active" : ""}`} onClick={() => handleNavigate(item.key)} title={collapsed ? item.label : undefined}>
              <Icon size={18} />
              {!collapsed && <span className="sidebar-item-label">{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div style={{padding:12,borderTop:"1px solid #e5e7eb",fontSize:12}} title={collapsed?`Logged in as ${ROLE_LABELS[normalizedRole]||normalizedRole}`:undefined}>{collapsed?"●":<><div><strong>Logged in as {ROLE_LABELS[normalizedRole]||normalizedRole}</strong></div><div>{assignedPropertyCount} properties</div></>}</div>
    </aside>
  );
}
