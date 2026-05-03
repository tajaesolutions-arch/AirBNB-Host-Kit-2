import { Menu, PanelLeft } from "lucide-react";

export default function TopBar({
  onMenuClick,
  pageTitle = "Dashboard",
  onToggleSidebar,
}) {

  return (
    <header className="topbar">
      <div className="topbar-desktop simple-topbar">
        <div className="topbar-page-context">
          <button type="button" className="topbar-menu-btn desktop-collapse-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar"><PanelLeft size={16} /></button>
          <h1 className="topbar-page-title">{pageTitle}</h1>
        </div>
      </div>

      <div className="mobile-app-header simple-mobile-header">
        <button type="button" className="topbar-menu-btn" onClick={onMenuClick}>
          <Menu size={18} />
        </button>
        <div className="mobile-page-title">{pageTitle}</div>
      </div>
    </header>
  );
}
