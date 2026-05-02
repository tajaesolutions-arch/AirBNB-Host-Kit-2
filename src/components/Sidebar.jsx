import React from "react";
import {
  Home,
  CalendarDays,
  UsersRound,
  Sparkles,
  Wrench,
  Package,
  DollarSign,
  MessageSquare,
  FileText,
  Calculator,
  ClipboardCheck,
  Settings,
  UserCircle,
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { key: "dashboard", label: "Host Dashboard", icon: Home },
      { key: "bookings", label: "Booking Calendar", icon: CalendarDays },
      { key: "guests", label: "Guest CRM", icon: UsersRound },
      { key: "cleaning", label: "Cleaning Schedule", icon: Sparkles },
      { key: "maintenance", label: "Maintenance", icon: Wrench },
      { key: "supplies", label: "Supplies", icon: Package },
    ],
  },
  {
    label: "Finance",
    items: [
      { key: "revenue", label: "Revenue & Profit", icon: DollarSign },
      { key: "leads", label: "Direct Leads", icon: MessageSquare },
      { key: "owner", label: "Owner Report", icon: FileText },
      { key: "tax", label: "Tax Reserve", icon: Calculator },
    ],
  },
  {
    label: "Resources",
    items: [
      { key: "sops", label: "SOP Checklists", icon: ClipboardCheck },
      { key: "messages", label: "Msg Templates", icon: MessageSquare },
      { key: "settings", label: "Settings", icon: Settings },
      { key: "account", label: "My Account", icon: UserCircle },
    ],
  },
];

export default function Sidebar({
  page = "dashboard",
  setPage,
  collapsed = false,
  onToggleCollapse,
  mobile = false,
  onClose,
}) {
  const handleNavigate = (nextPage) => {
    if (setPage) setPage(nextPage);
    if (mobile && onClose) onClose();
  };

  return (
    <aside className={`app-sidebar ${collapsed ? "is-collapsed" : ""} ${mobile ? "is-mobile" : ""}`}>
      <div className="app-sidebar-header">
        <div className="app-sidebar-brand">
          <div className="app-sidebar-logo">🇯🇲</div>

          <div className="app-sidebar-brand-text">
            <div className="app-sidebar-title">Host Operations</div>
            <div className="app-sidebar-subtitle">Jamaica Airbnb Kit</div>
          </div>
        </div>

        {mobile ? (
          <button className="app-sidebar-toggle" onClick={onClose} title="Close menu">
            <X size={19} />
          </button>
        ) : (
          <button
            className="app-sidebar-toggle"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={19} /> : <PanelLeftClose size={19} />}
          </button>
        )}
      </div>

      <nav className="app-sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="app-sidebar-group" key={group.label}>
            <div className="app-sidebar-group-label">{group.label}</div>

            <div className="app-sidebar-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = page === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`app-sidebar-item ${isActive ? "active" : ""}`}
                    onClick={() => handleNavigate(item.key)}
                    title={collapsed ? item.label : ""}
                  >
                    <Icon size={22} className="app-sidebar-icon" />
                    <span className="app-sidebar-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="app-sidebar-note">
        <span>💡</span>
        <p>Add bookings first — the dashboard fills in automatically.</p>
      </div>
    </aside>
  );
}
