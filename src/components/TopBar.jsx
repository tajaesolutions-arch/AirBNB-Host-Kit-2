import { Menu, MoreHorizontal, UserCircle } from "lucide-react";
import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_DISPLAY_NAMES,
  getCurrencyHelperText,
  normalizeCurrency,
} from "../utils/helpers.js";

export default function TopBar({
  monthFilter,
  setMonthFilter,
  propFilter,
  setPropFilter,
  onMenuClick,
  onAccountClick,
  pageTitle = "Dashboard",
}) {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const { properties, settings, setSettings } = useApp();

  const selectedCurrency = normalizeCurrency(settings?.default_currency || "JMD");

  const updateCurrency = (nextCurrency) => {
    const safeCurrency = normalizeCurrency(nextCurrency);
    setSettings((previousSettings) => ({
      ...previousSettings,
      default_currency: safeCurrency,
    }));
  };

  return (
    <header className="topbar">
      <div className="topbar-desktop">
        <div className="topbar-desktop-filters topbar-filters">
          <div className="topbar-filter-group">
            <label className="topbar-label" htmlFor="property-filter">Property</label>
            <select id="property-filter" className="topbar-control topbar-property-select" value={propFilter} onChange={(event) => setPropFilter(event.target.value)}>
              <option value="ALL">All Properties</option>
              {properties?.map((property) => (
                <option key={property.property_id} value={property.property_id}>{property.property_name}</option>
              ))}
            </select>
          </div>

          <div className="topbar-filter-group">
            <label className="topbar-label" htmlFor="month-filter">Month</label>
            <input id="month-filter" className="topbar-control topbar-month-input" type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} />
          </div>

          <div className="topbar-filter-group topbar-currency-group">
            <label className="topbar-label" htmlFor="currency-filter">Currency</label>
            <select id="currency-filter" className="topbar-control topbar-currency-select" value={selectedCurrency} onChange={(event) => updateCurrency(event.target.value)} title={getCurrencyHelperText(selectedCurrency)}>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>{currency}</option>
              ))}
            </select>
          </div>

          <div className="topbar-currency-pill">{CURRENCY_DISPLAY_NAMES[selectedCurrency] || selectedCurrency}</div>

          <button aria-label="Open My Account" className="topbar-account-btn" type="button" onClick={onAccountClick}>
            <UserCircle size={18} />
            <span>My Account</span>
          </button>
        </div>
      </div>

      <div className="mobile-app-header">
        <button type="button" className="topbar-menu-btn" aria-label="Open navigation menu" onClick={onMenuClick}>
          <Menu size={18} />
        </button>

        <div className="mobile-brand">Host Kit</div>

        <div className="mobile-header-actions">
          <button aria-label="Open My Account" className="mobile-account-btn" type="button" onClick={onAccountClick}>
            <UserCircle size={18} />
          </button>
        </div>
      </div>

      <div className="mobile-page-bar">
        <div className="mobile-page-title">{pageTitle}</div>
        <button
          type="button"
          className="mobile-actions-button"
          aria-label="Open page filters"
          aria-expanded={mobileFiltersOpen}
          onClick={() => setMobileFiltersOpen((previousValue) => !previousValue)}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className={`mobile-filter-menu ${mobileFiltersOpen ? "open" : ""}`}>
        <h3>Filters</h3>
        <div className="mobile-filter-grid">
          <div className="topbar-filter-group">
            <label className="topbar-label" htmlFor="mobile-property-filter">Property</label>
            <select id="mobile-property-filter" className="topbar-control" value={propFilter} onChange={(event) => setPropFilter(event.target.value)}>
              <option value="ALL">All Properties</option>
              {properties?.map((property) => (
                <option key={`mobile-${property.property_id}`} value={property.property_id}>{property.property_name}</option>
              ))}
            </select>
          </div>

          <div className="topbar-filter-group">
            <label className="topbar-label" htmlFor="mobile-month-filter">Month</label>
            <input id="mobile-month-filter" className="topbar-control" type="month" value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)} />
          </div>

          <div className="topbar-filter-group">
            <label className="topbar-label" htmlFor="mobile-currency-filter">Currency</label>
            <select id="mobile-currency-filter" className="topbar-control" value={selectedCurrency} onChange={(event) => updateCurrency(event.target.value)}>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={`currency-${currency}`} value={currency}>{currency}</option>
              ))}
            </select>
          </div>
        </div>
        <button type="button" className="mobile-filter-done" onClick={() => setMobileFiltersOpen(false)}>Done</button>
      </div>
    </header>
  );
}
