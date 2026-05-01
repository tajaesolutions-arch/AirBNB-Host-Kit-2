import { LogOut, Menu, UserCircle } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../auth/AuthContext.jsx";

export default function TopBar({ monthFilter, setMonthFilter, propFilter, setPropFilter, onMenuClick }) {
  const { properties, settings } = useApp();
  const { user, profile, signOut } = useAuth();

  return (
    <header className="topbar">
      <button className="btn-ghost topbar-mobile-btn" onClick={onMenuClick} style={{ padding: 8 }}>
        <Menu size={20} />
      </button>

      <div className="topbar-filters">
        <span className="topbar-label">Property</span>
        <select
          value={propFilter}
          onChange={e => setPropFilter(e.target.value)}
          style={{ width: "auto", minWidth: 170, padding: "6px 10px", fontSize: 13 }}
        >
          <option value="ALL">All Properties</option>
          {properties.map(p => (
            <option key={p.property_id} value={p.property_id}>{p.property_name}</option>
          ))}
        </select>

        <span className="topbar-label" style={{ marginLeft: 6 }}>Month</span>
        <input
          type="month"
          value={monthFilter}
          onChange={e => setMonthFilter(e.target.value)}
          style={{ width: "auto", padding: "6px 10px", fontSize: 13 }}
        />
      </div>

      <div className="topbar-right">
        <span className="chip chip-gray">{settings.default_currency || "JMD"}</span>
        <span className="chip chip-teal" title={user?.email || ""}>
          <UserCircle size={12} /> {profile?.host_name || user?.email || "Host"}
        </span>
        <button className="btn-ghost" onClick={signOut} title="Log out">
          <LogOut size={15} /> Logout
        </button>
      </div>
    </header>
  );
}
