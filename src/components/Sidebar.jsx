import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Sparkles,
  Wrench,
  Package,
  BarChart3,
  Building2,
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
import { canAccessPage, ROLE_LABELS } from "../utils/permissions.js";

const NAV_ITEMS = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "bookings", label: "Booking Calendar", icon: CalendarDays },
  { key: "property-manager", label: "Property Manager", icon: Building2 },
  { key: "cleaner-portal", label: "Cleaner Portal", icon: Sparkles },
  { key: "owner-portal", label: "Owner Portal", icon: Home },
  { key: "guests", label: "Guest CRM", icon: Users },
  { key: "cleaning", label: "Cleaning Schedule", icon: Sparkles },
  { key: "maintenance", label: "Maintenance", icon: Wrench },
  { key: "supplies", label: "Supplies", icon: Package },
  { key: "revenue", label: "Revenue & Profit", icon: BarChart3 },
  { key: "leads", label: "Direct Leads", icon: MessageSquare },
  { key: "owner", label: "Owner Report", icon: FileText },
  { key: "tax", label: "Tax Reserve", icon: Calculator },
  { key: "sops", label: "SOPs", icon: ClipboardList },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "smart-tools", label: "Smart Tools", icon: WandSparkles },
  { key: "users-access", label: "Users & Access", icon: ShieldCheck },
  { key: "account", label: "My Account", icon: Users },
];

export default function Sidebar({ page, setPage, collapsed = false, onToggleCollapse, mobile = false, onClose, role = "host", permissions, assignedPropertyCount = 0 }) {
  const perm = permissions || { role };
  const allowedNavItems = NAV_ITEMS.filter((item) => canAccessPage(item.key, perm));

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
      <div style={{padding:12,borderTop:"1px solid #e5e7eb",fontSize:12}} title={collapsed?`Logged in as ${ROLE_LABELS[role]||role}`:undefined}>{collapsed?"●":<><div><strong>Logged in as {ROLE_LABELS[role]||role}</strong></div><div>{assignedPropertyCount} properties</div></>}</div>
    </aside>
  );
}
