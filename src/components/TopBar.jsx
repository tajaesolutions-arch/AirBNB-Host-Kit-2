import { Menu, PanelLeft } from "lucide-react";

export default function TopBar({ onMenuClick, onToggleSidebar }) {
  return (
    <header className="topbar" role="banner">
      <div className="topbar-desktop topbar-shell-only">
        <button
          type="button"
          className="topbar-menu-btn desktop-collapse-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <PanelLeft size={16} />
        </button>
      </div>

      <div className="mobile-app-header">
        <button type="button" className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={18} />
        </button>
        <div className="mobile-brand">Host Kit</div>
      </div>
    </header>
  );
}
