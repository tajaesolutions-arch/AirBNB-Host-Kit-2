// ============================================================
//  UTILITY HELPERS
// ============================================================

export const uid = (prefix = "ID") =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;

export const todayISO = () => new Date().toISOString().slice(0, 10);

// ============================================================
//  CURRENCY HELPERS
// ============================================================
// IMPORTANT:
// The app stores all money values internally as JMD.
// These rates are used only for display conversion.
// Update these rates manually when needed.

export const BASE_CURRENCY = "JMD";

export const SUPPORTED_CURRENCIES = ["JMD", "USD", "CAD", "GBP", "EUR"];

export const CURRENCY_LABELS = {
  JMD: "JMD",
  USD: "USD",
  CAD: "CAD",
  GBP: "GBP",
  EUR: "EUR",
};

export const CURRENCY_DISPLAY_NAMES = {
  JMD: "Jamaican Dollar",
  USD: "US Dollar",
  CAD: "Canadian Dollar",
  GBP: "British Pound",
  EUR: "Euro",
};

// Approximate display rates from 1 JMD.
// Example: JMD 155 × 0.00645 ≈ USD 1.00.
export const CURRENCY_RATES_FROM_JMD = {
  JMD: 1,
  USD: 0.00645,
  CAD: 0.00885,
  GBP: 0.00505,
  EUR: 0.0059,
};

export const normalizeCurrency = (currency = BASE_CURRENCY) => {
  const value = String(currency || BASE_CURRENCY).trim().toUpperCase();
  return SUPPORTED_CURRENCIES.includes(value) ? value : BASE_CURRENCY;
};

export const convertFromJMD = (amount, currency = BASE_CURRENCY) => {
  const n = Number(amount) || 0;
  const safeCurrency = normalizeCurrency(currency);
  const rate = CURRENCY_RATES_FROM_JMD[safeCurrency] || 1;

  return n * rate;
};

export const convertToJMD = (amount, currency = BASE_CURRENCY) => {
  const n = Number(amount) || 0;
  const safeCurrency = normalizeCurrency(currency);
  const rate = CURRENCY_RATES_FROM_JMD[safeCurrency] || 1;

  if (rate === 0) return n;

  return n / rate;
};

export const fmtCurrency = (amount, currency = BASE_CURRENCY, options = {}) => {
  const safeCurrency = normalizeCurrency(currency);

  const {
    convert = true,
    minimumFractionDigits,
    maximumFractionDigits,
  } = options;

  const rawAmount = Number(amount) || 0;
  const displayAmount = convert ? convertFromJMD(rawAmount, safeCurrency) : rawAmount;

  const shouldUseDecimals = safeCurrency !== "JMD";

  return new Intl.NumberFormat("en-JM", {
    style: "currency",
    currency: safeCurrency,
    minimumFractionDigits:
      typeof minimumFractionDigits === "number"
        ? minimumFractionDigits
        : shouldUseDecimals
        ? 2
        : 0,
    maximumFractionDigits:
      typeof maximumFractionDigits === "number"
        ? maximumFractionDigits
        : shouldUseDecimals
        ? 2
        : 0,
  }).format(displayAmount);
};

export const getCurrencyHelperText = (currency = BASE_CURRENCY) => {
  const safeCurrency = normalizeCurrency(currency);

  if (safeCurrency === BASE_CURRENCY) {
    return "Base amounts are stored in JMD. You can switch display estimates to supported currencies.";
  }

  return `Displaying converted ${safeCurrency} estimates. Stored amounts remain in JMD.`;
};

// ============================================================
//  DATE / NUMBER HELPERS
// ============================================================

export const calcNights = (checkin, checkout) => {
  if (!checkin || !checkout) return 0;

  const d = (new Date(checkout) - new Date(checkin)) / 86400000;

  return Math.max(0, Math.round(d));
};

export const bookingTotal = (b) => {
  const nights = calcNights(b.checkin_date, b.checkout_date);

  return (
    (Number(b.nightly_rate) || 0) * nights +
    (Number(b.cleaning_fee) || 0) +
    (Number(b.extra_fees) || 0) -
    (Number(b.discounts) || 0)
  );
};

export const fmtPct = (val) => {
  const n = Number(val) || 0;
  return (n * 100).toFixed(1) + "%";
};

export const fmtDateShort = (d) => {
  if (!d) return "—";

  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-JM", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return d;
  }
};

export const isDirectPlatform = (platform) =>
  [
    "Direct",
    "WhatsApp",
    "Instagram",
    "Google",
    "Referral",
    "Website",
    "Phone Call",
    "Past Guest",
  ].includes(platform);

export const supplyStatus = (current, reorder) => {
  if (Number(current) <= 0) return "Out of Stock";
  if (Number(current) <= Number(reorder)) return "Low Stock";
  return "In Stock";
};

export const inSelectedMonth = (dateStr, monthStr) => {
  if (!dateStr || !monthStr) return false;
  return dateStr.slice(0, 7) === monthStr;
};

export const daysInMonth = (monthStr) => {
  if (!monthStr) return 30;

  const [y, m] = monthStr.split("-").map(Number);

  return new Date(y, m, 0).getDate();
};

export const downloadCSV = (filename, data) => {
  if (!data || data.length === 0) return;

  const keys = Object.keys(data[0]);

  const csv = [
    keys.join(","),
    ...data.map((row) =>
      keys
        .map((k) => {
          const v = row[k] ?? "";
          return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
};

// ============================================================
//  CHIP HELPERS
// ============================================================

export const bookingStatusChip = (s) =>
  ({
    Confirmed: "blue",
    "Checked In": "green",
    "Checked Out": "gray",
    Cancelled: "red",
  }[s] || "gray");

export const paymentStatusChip = (s) =>
  ({
    Paid: "green",
    Partial: "amber",
    Unpaid: "red",
    Pending: "blue",
  }[s] || "gray");

export const cleaningStatusChip = (s) =>
  ({
    Scheduled: "amber",
    "In Progress": "blue",
    Completed: "green",
    "Issue Found": "red",
    Cancelled: "gray",
  }[s] || "gray");

export const priorityChip = (p) =>
  ({
    Low: "gray",
    Medium: "amber",
    High: "amber",
    Urgent: "red",
  }[p] || "gray");

export const maintStatusChip = (s) =>
  ({
    Open: "red",
    "In Progress": "blue",
    "Waiting on Vendor": "amber",
    Completed: "green",
    Cancelled: "gray",
  }[s] || "gray");

export const leadStatusChip = (s) =>
  ({
    New: "blue",
    Interested: "teal",
    "Quote Sent": "amber",
    "Follow Up": "amber",
    Booked: "green",
    Lost: "red",
    "No Response": "gray",
  }[s] || "gray");

export const supplyChip = (s) =>
  ({
    "In Stock": "green",
    "Low Stock": "amber",
    "Out of Stock": "red",
  }[s] || "gray");
