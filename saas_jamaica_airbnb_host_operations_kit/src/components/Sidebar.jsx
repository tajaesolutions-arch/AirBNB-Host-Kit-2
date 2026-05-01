import {
  Home, Calendar, Users, Sparkles, Wrench, Package,
  DollarSign, MessageSquare, FileText, Calculator,
  ClipboardCheck, MessageCircle, Settings, X,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { id: "dashboard",    label: "Host Dashboard",     icon: Home },
      { id: "bookings",     label: "Booking Calendar",   icon: Calendar },
      { id: "guests",       label: "Guest CRM",          icon: Users },
      { id: "cleaning",     label: "Cleaning Schedule",  icon: Sparkles },
      { id: "maintenance",  label: "Maintenance",        icon: Wrench },
      { id: "supplies",     label: "Supplies",           icon: Package },
    ],
  },
  {
    label: "Finance",
    items: [
      { id: "revenue",      label: "Revenue & Profit",   icon: DollarSign },
      { id: "leads",        label: "Direct Leads",       icon: MessageSquare },
      { id: "owner",        label: "Owner Report",       icon: FileText },
      { id: "tax",          label: "Tax Reserve",        icon: Calculator },
    ],
  },
  {
    label: "Resources",
    items: [
      { id: "sops",         label: "SOP Checklists",     icon: ClipboardCheck },
      { id: "messages",     label: "Msg Templates",      icon: MessageCircle },
      { id: "settings",     label: "Settings",           icon: Settings },
    ],
  },
];

export default function Sidebar({ page, setPage, mobile, onClose }) {
  return (
    <aside className={`sidebar ${mobile ? "open" : ""}`}>
      <div className="sidebar-logo">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div className="sidebar-logo-title">🇯🇲 Host Operations</div>
            <div className="sidebar-logo-sub">Jamaica Airbnb Kit</div>
          </div>
          {mobile && onClose && (
            <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", padding: 4 }}>
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <div className="sidebar-group-label">{group.label}</div>
            {group.items.map(item => {
              const Icon = item.icon;
              const active = page === item.id;
              return (
                <div
                  key={item.id}
                  className={`sidebar-item ${active ? "active" : ""}`}
                  onClick={() => { setPage(item.id); if (onClose) onClose(); }}
                >
                  <Icon size={16} strokeWidth={2} />
                  <span>{item.label}</span>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="sidebar-tip">
        💡 Add bookings first — the dashboard fills in automatically.
      </div>
    </aside>
  );
}
