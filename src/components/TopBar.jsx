import { Menu, UserCircle, SlidersHorizontal } from "lucide-react";
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

  const handleAccountClick = () => {
    if (typeof onAccountClick === "function") {
      onAccountClick();
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-mobile-header">
        <button
          type="button"
          className="topbar-menu-btn"
          aria-label="Open navigation menu"
          onClick={onMenuClick}
        >
          <Menu size={18} />
        </button>

        <div className="topbar-mobile-title">Host Kit</div>

        <div className="topbar-mobile-actions">
          <button
            aria-label="Open My Account"
            className="topbar-account-btn topbar-account-btn-mobile"
            type="button"
            onClick={handleAccountClick}
          >
            <UserCircle size={18} />
            <span>My Account</span>
          </button>
        </div>
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

      <div className="topbar-desktop-filters topbar-filters">
        <div className="topbar-filter-group">
          <label className="topbar-label" htmlFor="property-filter">
            Property
          </label>

          <select
            id="property-filter"
            className="topbar-control topbar-property-select"
            value={propFilter}
            onChange={(event) => setPropFilter(event.target.value)}
          >
            <option value="ALL">All Properties</option>

            {properties?.map((property) => (
              <option key={property.property_id} value={property.property_id}>
                {property.property_name}
              </option>
            ))}
          </select>
        </div>

        <div className="topbar-filter-group">
          <label className="topbar-label" htmlFor="month-filter">
            Month
          </label>

          <input
            id="month-filter"
            className="topbar-control topbar-month-input"
            type="month"
            value={monthFilter}
            onChange={(event) => setMonthFilter(event.target.value)}
          />
        </div>

        <div className="topbar-filter-group topbar-currency-group">
          <label className="topbar-label" htmlFor="currency-filter">
            Currency
          </label>

          <select
            id="currency-filter"
            className="topbar-control topbar-currency-select"
            value={selectedCurrency}
            onChange={(event) => updateCurrency(event.target.value)}
            title={getCurrencyHelperText(selectedCurrency)}
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency} value={currency}>
                {currency}
              </option>
            ))}
          </select>
        </div>

        <div className="topbar-currency-pill">
          {CURRENCY_DISPLAY_NAMES[selectedCurrency] || selectedCurrency}
        </div>

        <button
          aria-label="Open My Account"
          className="topbar-account-btn"
          type="button"
          onClick={handleAccountClick}
        >
          <UserCircle size={18} />
          <span>My Account</span>
        </button>
      </div>

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
              onChange={(event) => setPropFilter(event.target.value)}
            >
              <option value="ALL">All Properties</option>
              {properties?.map((property) => (
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
              onChange={(event) => setMonthFilter(event.target.value)}
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
