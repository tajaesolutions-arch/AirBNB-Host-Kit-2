import { Menu, UserCircle, MoreHorizontal, Bell, PanelLeft } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_DISPLAY_NAMES,
  getCurrencyHelperText,
  normalizeCurrency,
} from "../utils/helpers.js";

export default function TopBar({ monthFilter, setMonthFilter, propFilter, setPropFilter, onMenuClick, onAccountClick, pageTitle = "Dashboard", onToggleSidebar }) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const app = useApp();
  const properties = Array.isArray(app?.properties) ? app.properties : [];
  const settings = app?.settings ?? { default_currency: "JMD" };
  const setSettings = typeof app?.setSettings === "function" ? app.setSettings : null;
  const selectedCurrency = normalizeCurrency(settings?.default_currency || "JMD");
  const updateCurrency = (nextCurrency) => setSettings && setSettings((p) => ({ ...(p ?? {}), default_currency: normalizeCurrency(nextCurrency) }));

  return (
    <header className="topbar">
      <div className="desktop-top-header">
        <div className="desktop-brand-wrap">
          <button type="button" className="topbar-menu-btn desktop-collapse-btn" onClick={onToggleSidebar} aria-label="Toggle sidebar"><PanelLeft size={16} /></button>
          <div>
            <div className="desktop-brand-title">AirBNB Host Kit</div>
            <div className="desktop-brand-subtitle">Short-term rental operations dashboard</div>
          </div>
        </div>
        <div className="desktop-header-actions">
          <button type="button" className="icon-btn" aria-label="Notifications"><Bell size={16}/></button>
          <button aria-label="Open My Account" className="topbar-account-btn" type="button" onClick={onAccountClick}><UserCircle size={18} /><span>My Account</span></button>
        </div>
      </div>

      <div className="mobile-app-header"><button type="button" className="topbar-menu-btn" onClick={onMenuClick}><Menu size={18} /></button><div className="mobile-brand">Host Kit</div><button className="mobile-account-btn" type="button" onClick={onAccountClick}><UserCircle size={18} /></button></div>
      <div className="mobile-page-bar"><div className="mobile-page-title">{pageTitle}</div><button type="button" className="mobile-actions-button" onClick={() => setMobileFiltersOpen((p) => !p)}><MoreHorizontal size={18} /></button></div>

      <div className="topbar-desktop-filters topbar-filters">
        <select id="property-filter" className="topbar-control topbar-property-select" value={propFilter} onChange={(e)=>setPropFilter?.(e.target.value)}><option value="ALL">All Properties</option>{properties.map((property)=><option key={property.property_id} value={property.property_id}>{property.property_name}</option>)}</select>
        <input id="month-filter" className="topbar-control topbar-month-input" type="month" value={monthFilter} onChange={(e)=>setMonthFilter?.(e.target.value)} />
        <select id="currency-filter" className="topbar-control topbar-currency-select" value={selectedCurrency} onChange={(e)=>updateCurrency(e.target.value)} title={getCurrencyHelperText(selectedCurrency)}>{SUPPORTED_CURRENCIES.map((currency)=><option key={currency} value={currency}>{currency}</option>)}</select>
        <div className="topbar-currency-pill">{CURRENCY_DISPLAY_NAMES[selectedCurrency] || selectedCurrency}</div>
      </div>

      <div id="mobile-filter-panel" className={`mobile-filter-menu ${mobileFiltersOpen ? "open" : ""}`}>
        <div className="mobile-filter-grid"><select className="topbar-control" value={propFilter} onChange={(e)=>setPropFilter?.(e.target.value)}><option value="ALL">All Properties</option>{properties.map((property)=><option key={`mobile-${property.property_id}`} value={property.property_id}>{property.property_name}</option>)}</select><input className="topbar-control" type="month" value={monthFilter} onChange={(e)=>setMonthFilter?.(e.target.value)} /><select className="topbar-control" value={selectedCurrency} onChange={(e)=>updateCurrency(e.target.value)}>{SUPPORTED_CURRENCIES.map((currency)=><option key={`mobile-${currency}`} value={currency}>{currency}</option>)}</select></div>
      </div>
    </header>
  );
}
