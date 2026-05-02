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
      <div className="topbar-inner">
        <div className="topbar-filters">
          <div className="topbar-filter-group">
            <label className="topbar-label" htmlFor="property-filter">
              Property
            </label>

            <select
              id="property-filter"
              className="topbar-select topbar-select-property"
              value={propFilter}
              onChange={(event) => setPropFilter(event.target.value)}
            >
              <option value="all">All Properties</option>

              {properties?.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
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
              className="topbar-input topbar-input-month"
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
              className="topbar-select topbar-select-currency"
              value={selectedCurrency}
              onChange={(event) => updateCurrency(event.target.value)}
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="topbar-currency-pill" title={getCurrencyHelperText(selectedCurrency)}>
          {CURRENCY_DISPLAY_NAMES[selectedCurrency] || selectedCurrency}
        </div>
      </div>
    </header>
  );
}
