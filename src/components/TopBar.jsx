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
        style={{ padding: 8 }}
        type="button"
      >
        <Menu size={20} />
      </button>

      <div className="topbar-filters">
        <span className="topbar-label">Property</span>

        <select
          value={propFilter}
          onChange={(event) => setPropFilter(event.target.value)}
          style={{
            width: "auto",
            minWidth: 170,
            padding: "6px 10px",
            fontSize: 13,
          }}
        >
          <option value="ALL">All Properties</option>
          {properties.map((property) => (
            <option key={property.property_id} value={property.property_id}>
              {property.property_name}
            </option>
          ))}
        </select>

        <span className="topbar-label" style={{ marginLeft: 6 }}>
          Month
        </span>

        <input
          type="month"
          value={monthFilter}
          onChange={(event) => setMonthFilter(event.target.value)}
          style={{
            width: "auto",
            padding: "6px 10px",
            fontSize: 13,
          }}
        />

        <span className="topbar-label" style={{ marginLeft: 6 }}>
          Currency
        </span>

        <select
          value={selectedCurrency}
          onChange={(event) => updateCurrency(event.target.value)}
          title={getCurrencyHelperText(selectedCurrency)}
          style={{
            width: "auto",
            minWidth: 96,
            padding: "6px 10px",
            fontSize: 13,
          }}
        >
          {SUPPORTED_CURRENCIES.map((currency) => (
            <option key={currency} value={currency}>
              {currency}
            </option>
          ))}
        </select>
      </div>

      <div className="topbar-right">
        <span
          className="chip chip-gray"
          title={getCurrencyHelperText(selectedCurrency)}
        >
          {CURRENCY_DISPLAY_NAMES[selectedCurrency] || selectedCurrency}
        </span>
      </div>
    </header>
  );
}
