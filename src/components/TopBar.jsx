import { UserCircle } from "lucide-react";
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
  onAccountClick,
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

  const handleAccountClick = () => {
    if (typeof onAccountClick === "function") {
      onAccountClick();
    }
  };

  return (
    <header className="topbar">
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
    </header>
  );
}
