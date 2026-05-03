import { Menu, UserCircle, SlidersHorizontal, MoreHorizontal } from "lucide-react";
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
  const app = useApp();
  const properties = Array.isArray(app?.properties) ? app.properties : [];
  const settings = app?.settings ?? { default_currency: "JMD" };
  const setSettings = typeof app?.setSettings === "function" ? app.setSettings : null;

  const selectedCurrency = normalizeCurrency(settings?.default_currency || "JMD");

  const updateCurrency = (nextCurrency) => {
    const safeCurrency = normalizeCurrency(nextCurrency);

    if (!setSettings) return;

    setSettings((previousSettings) => ({
      ...(previousSettings ?? {}),
      default_currency: safeCurrency,
    }));
  };

  const handleMenuClick = () => {
    if (typeof onMenuClick === "function") onMenuClick();
  };

  const handleAccountClick = () => {
    if (typeof onAccountClick === "function") onAccountClick();
  };

  const handlePropertyFilterChange = (event) => {
    if (typeof setPropFilter === "function") setPropFilter(event.target.value);
  };

  const handleMonthFilterChange = (event) => {
    if (typeof setMonthFilter === "function") setMonthFilter(event.target.value);
  };

  return (
    <header className="topbar">
      <div className="mobile-app-header">
        <button type="button" className="topbar-menu-btn" aria-label="Open navigation menu" onClick={handleMenuClick}>
          <Menu size={18} />
        </button>

        <div className="mobile-brand">Host Kit</div>

        <div className="mobile-header-actions">
          <button aria-label="Open My Account" className="mobile-account-btn" type="button" onClick={handleAccountClick}>
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
          aria-controls="mobile-filter-panel"
          onClick={() => setMobileFiltersOpen((previousValue) => !previousValue)}
        >
          <MoreHorizontal size={18} />
        </button>
      </div>

      <div className="topbar-desktop-filters topbar-filters">
        <div className="topbar-filter-group">
          <label className="topbar-label" htmlFor="property-filter">
            Property
          </label>
          <select
            id="property-filter"
            className="topbar-control topbar-property-select"
            value={propFilter}
            onChange={handlePropertyFilterChange}
          >
            <option value="ALL">All Properties</option>
            {properties.map((property) => (
              <option key={property.property_id} value={property.property_id}>
                {property.property_name}
              </option>
            ))}
          </select>
        </div>

        <div className="topbar-filter-group">
          <label className="topbar-label" htmlFor="month-filter">Month</label>
          <input id="month-filter" className="topbar-control topbar-month-input" type="month" value={monthFilter} onChange={handleMonthFilterChange} />
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

        <button aria-label="Open My Account" className="topbar-account-btn" type="button" onClick={handleAccountClick}>
          <UserCircle size={18} />
          <span>My Account</span>
        </button>
      </div>

      <button
        type="button"
        className="mobile-filter-toggle"
        onClick={() => setMobileFiltersOpen((previousValue) => !previousValue)}
        aria-expanded={mobileFiltersOpen}
        aria-controls="mobile-filter-panel"
      >
        <SlidersHorizontal size={16} />
        <span>Filters</span>
      </button>

      <div
        id="mobile-filter-panel"
        className={`topbar-mobile-filters ${mobileFiltersOpen ? "open" : ""}`}
      >
        <div className="mobile-filter-grid">
          <div className="topbar-filter-group">
            <label className="topbar-label" htmlFor="mobile-property-filter">
              Property
            </label>
            <select
              id="mobile-property-filter"
              className="topbar-control topbar-property-select"
              value={propFilter}
              onChange={handlePropertyFilterChange}
            >
              <option value="ALL">All Properties</option>
              {properties.map((property) => (
                <option key={`mobile-${property.property_id}`} value={property.property_id}>
                  {property.property_name}
                </option>
              ))}
            </select>
          </div>

          <div className="topbar-filter-group">
            <label className="topbar-label" htmlFor="mobile-month-filter">
              Month
            </label>
            <input
              id="mobile-month-filter"
              className="topbar-control topbar-month-input"
              type="month"
              value={monthFilter}
              onChange={handleMonthFilterChange}
            />
          </div>

          <div className="topbar-filter-group topbar-currency-group">
            <label className="topbar-label" htmlFor="mobile-currency-filter">
              Currency
            </label>
            <select
              id="mobile-currency-filter"
              className="topbar-control topbar-currency-select"
              value={selectedCurrency}
              onChange={(event) => updateCurrency(event.target.value)}
              title={getCurrencyHelperText(selectedCurrency)}
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={`mobile-${currency}`} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </header>
  );
}
