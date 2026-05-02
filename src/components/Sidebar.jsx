import {
  CalendarDays,
  Calculator,
  ClipboardCheck,
  DollarSign,
  FileText,
  Home,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  Sparkles,
  Users,
  Wrench,
  X,
  Package,
} from "lucide-react";

const navGroups = [
  {
    label: "Operations",
    items: [
      { id: "dashboard", label: "Host Dashboard", icon: Home },
      { id: "bookings", label: "Booking Calendar", icon: CalendarDays },
      { id: "guests", label: "Guest CRM", icon: Users },
      { id: "cleaning", label: "Cleaning Schedule", icon: Sparkles },
      { id: "maintenance", label: "Maintenance", icon: Wrench },
      { id: "supplies", label: "Supplies", icon: Package },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "revenue", label: "Revenue & Profit", icon: DollarSign },
      { id: "leads", label: "Direct Leads", icon: MessageSquare },
      { id: "owner", label: "Owner Report", icon: FileText },
      { id: "tax", label: "Tax Reserve", icon: Calculator },
    ],
  },
  {
    label: "Resources",
    items: [
      { id: "sops", label: "SOP Checklists", icon: ClipboardCheck },
      { id: "messages", label: "Msg Templates", icon: MessageSquare },
      { id: "settings", label: "Settings", icon: Settings },
    ],
  },
];

export default function Sidebar({
  page,
  setPage,
  collapsed = false,
  onToggleCollapse,
  mobile = false,
  onClose,
}) {
  const handleSelect = (nextPage) => {
    setPage(nextPage);
    if (mobile && onClose) onClose();
  };

  return (
    <aside className={`sidebar ${mobile ? "mobile" : ""}`} aria-label="Host Operations Sidebar">
      <div className="sidebar-logo sidebar-brand">
        <span className="sidebar-logo-mark" aria-hidden="true">🇯🇲</span>

        <div className="sidebar-brand-main">
          <div className="sidebar-logo-title">Host Operations</div>
          <div className="sidebar-logo-sub">Jamaica Airbnb Kit</div>
        </div>

        {mobile ? (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <X aria-hidden="true" />
          </button>
        ) : (
          <button
            type="button"
            className="sidebar-collapse-btn"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen aria-hidden="true" /> : <PanelLeftClose aria-hidden="true" />}
          </button>
        )}
      </div>

      <nav className="sidebar-nav" aria-label="Main navigation">
        {navGroups.map((group) => (
          <div className="sidebar-section" key={group.label}>
            <div className="sidebar-group-label">{group.label}</div>
            <div className="sidebar-section-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = page === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-item ${active ? "active" : ""}`}
                    onClick={() => handleSelect(item.id)}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon className="sidebar-icon" aria-hidden="true" />
                    <span className="sidebar-item-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-tip">
        💡 Add bookings first — the dashboard fills in automatically.
      </div>
    </aside>
  );
}
