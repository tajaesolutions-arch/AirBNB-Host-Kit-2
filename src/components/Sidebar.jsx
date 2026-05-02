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
  page,
  activePage,
  setPage,
  setActivePage,
  collapsed = false,
  onToggleCollapse,
  mobile = false,
  onClose,
}) {
  const currentPage = page || activePage || "dashboard";

  const handleNavigate = (nextPage) => {
    if (setPage) setPage(nextPage);
    if (setActivePage) setActivePage(nextPage);
    if (mobile && onClose) onClose();
  };

  return (
    <aside
      className={[
        "sidebar",
        collapsed ? "collapsed" : "",
        mobile ? "mobile" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="sidebar-top">
        <div className="sidebar-brand">
          <div className="sidebar-logo-icon">🇯🇲</div>

          <div className="sidebar-brand-text">
            <div className="sidebar-title">Host Operations</div>
            <div className="sidebar-subtitle">Jamaica Airbnb Kit</div>
          </div>
        </div>

        {mobile ? (
          <button className="sidebar-icon-btn" onClick={onClose} title="Close menu">
            <X size={20} />
          </button>
        ) : (
          <button
            className="sidebar-icon-btn"
            onClick={onToggleCollapse}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen size={20} /> : <PanelLeftClose size={20} />}
          </button>
        )}
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <div className="sidebar-section-label">{group.label}</div>

            <div className="sidebar-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.key;

                return (
                  <button
                    key={item.key}
                    className={`sidebar-nav-item ${isActive ? "active" : ""}`}
                    onClick={() => handleNavigate(item.key)}
                    title={collapsed ? item.label : ""}
                  >
                    <Icon size={22} className="sidebar-nav-icon" />
                    <span className="sidebar-nav-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer-note">
        <span>💡</span>
        <p>Add bookings first — the dashboard fills in automatically.</p>
      </div>
    </aside>
  );
}
