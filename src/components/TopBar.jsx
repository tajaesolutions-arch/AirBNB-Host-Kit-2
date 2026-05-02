import { Menu } from "lucide-react";
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
}) {
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
      <button
        className="btn-ghost topbar-mobile-btn"
        onClick={onMenuClick}
        type="button"
        aria-label="Open sidebar menu"
      >
        <Menu size={20} />
      </button>

      <div className="topbar-filters">
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
            {properties.map((property) => (
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

        <div className="topbar-filter-group">
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
      </div>

      <div className="topbar-right">
        <span
          className="chip chip-gray topbar-currency-chip"
          title={getCurrencyHelperText(selectedCurrency)}
        >
          {CURRENCY_DISPLAY_NAMES[selectedCurrency] || selectedCurrency}
        </span>
      </div>
    </header>
  );
}
