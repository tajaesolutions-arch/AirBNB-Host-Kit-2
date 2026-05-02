import { useEffect, useRef, useState } from "react";
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
  const safeProperties = Array.isArray(properties) ? properties : [];

  const normalizedProperties = safeProperties
    .map((property, index) => ({
      ...property,
      property_id: property?.property_id || property?.id || `property-${index}`,
      property_name: property?.property_name || property?.name || `Property ${index + 1}`,
    }))
    .filter((property) => Boolean(property.property_id));


  const [isMobileFiltersCollapsed, setIsMobileFiltersCollapsed] = useState(false);
  const lastScrollYRef = useRef(0);

  useEffect(() => {
    const COLLAPSE_AT_Y = 64;
    const EXPAND_NEAR_TOP_AT_Y = 20;
    const EXPAND_SCROLL_UP_DELTA = 18;

    const onScroll = () => {
      if (window.innerWidth > 768) {
        setIsMobileFiltersCollapsed(false);
        lastScrollYRef.current = window.scrollY;
        return;
      }

      const currentY = window.scrollY;
      const delta = currentY - lastScrollYRef.current;

      setIsMobileFiltersCollapsed((previous) => {
        if (!previous && currentY > COLLAPSE_AT_Y && delta > 0) {
          return true;
        }

        if (previous && (currentY <= EXPAND_NEAR_TOP_AT_Y || delta <= -EXPAND_SCROLL_UP_DELTA)) {
          return false;
        }

        return previous;
      });

      lastScrollYRef.current = currentY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const selectedCurrency = normalizeCurrency(settings?.default_currency || "JMD");

  const updateCurrency = (nextCurrency) => {
    const safeCurrency = normalizeCurrency(nextCurrency);

    setSettings((previousSettings) => ({
      ...previousSettings,
      default_currency: safeCurrency,
    }));
  };

  return (
    <header className={`topbar ${isMobileFiltersCollapsed ? "mobile-filters-collapsed" : ""}`}>
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
          {normalizedProperties.map((property) => (
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
