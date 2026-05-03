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

// ============================================================
//  ICAL + MASTER CALENDAR HELPERS
// ============================================================

export const parseICalEvents = (icsText = "") => {
  const text = String(icsText || "");
  const chunks = text.split("BEGIN:VEVENT").slice(1);

  return chunks
    .map((chunk) => {
      const event = {};
      chunk.split(/\r?\n/).forEach((line) => {
        const [rawKey, ...valueParts] = line.split(":");
        if (!rawKey || valueParts.length === 0) return;
        const key = rawKey.split(";")[0];
        const value = valueParts.join(":").trim();
        if (key === "UID") event.uid = value;
        if (key === "SUMMARY") event.summary = value;
        if (key === "DESCRIPTION") event.description = value;
        if (key === "DTSTART") event.start = value.slice(0, 8);
        if (key === "DTEND") event.end = value.slice(0, 8);
      });
      return event;
    })
    .filter((event) => event.start && event.end);
};

export const parseICSDate = (value = "") => {
  const raw = String(value || "").trim();

  if (!raw) return "";

  const datePart = raw.slice(0, 8);

  if (!/^\d{8}$/.test(datePart)) return "";

  const year = datePart.slice(0, 4);
  const month = datePart.slice(4, 6);
  const day = datePart.slice(6, 8);

  return `${year}-${month}-${day}`;
};

export const parseICSCalendar = (icsText = "") => {
  const events = [];
  let current = null;

  const normalizedLines = String(icsText || "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n");

  normalizedLines.forEach((rawLine) => {
    const line = String(rawLine || "").trim();

    if (!line) return;

    if (line === "BEGIN:VEVENT") {
      current = {};
      return;
    }

    if (line === "END:VEVENT") {
      if (current) {
        events.push({
          event_id: current.uid || `ICS-${Date.now()}-${events.length + 1}`,
          external_uid: current.uid || "",
          summary: current.summary || "Imported Calendar Event",
          guest_name: current.summary || "Imported Calendar Hold",
          checkin_date: current.dtstart || "",
          checkout_date: current.dtend || "",
          source_status: "Imported",
        });
      }

      current = null;
      return;
    }

    if (!current) return;

    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) return;

    const rawKey = line.slice(0, separatorIndex);
    const value = line.slice(separatorIndex + 1).trim();
    const key = rawKey.split(";")[0].toUpperCase();

    if (key === "UID") {
      current.uid = value;
    }

    if (key === "SUMMARY") {
      current.summary = value;
    }

    if (key === "DTSTART") {
      current.dtstart = parseICSDate(value);
    }

    if (key === "DTEND") {
      current.dtend = parseICSDate(value);
    }
  });

  return events.filter((event) => event.checkin_date && event.checkout_date);
};

const iCalDateToISO = (raw = "") => {
  if (!raw || raw.length < 8) return "";
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const buildCalendarEventId = (event, propertyId, platform) => {
  const uidPart = String(event?.uid || "").trim();
  const startPart = String(event?.start || "").trim();
  const endPart = String(event?.end || "").trim();
  const propPart = String(propertyId || "").trim();
  const platformPart = String(platform || "").trim();

  if (uidPart) {
    return `CAL-${platformPart}-${propPart}-${uidPart}`
      .replace(/\s+/g, "-")
      .toUpperCase();
  }

  if (startPart || endPart || propPart) {
    return `CAL-${platformPart}-${propPart}-${startPart}-${endPart}`
      .replace(/\s+/g, "-")
      .toUpperCase();
  }

  return uid("CAL");
};

export const normalizeCalendarEvent = (event, propertyId, platform = "Blocked") => ({
  event_id: buildCalendarEventId(event, propertyId, platform),
  property_id: propertyId || "",
  platform,
  title: event.summary || `${platform} event`,
  checkin_date: iCalDateToISO(event.start),
  checkout_date: iCalDateToISO(event.end),
  source_uid: event.uid || "",
  source_description: event.description || "",
});

export const detectCalendarConflicts = (bookings = []) => {
  const rows = bookings.filter(
    (booking) => booking.property_id && booking.checkin_date && booking.checkout_date
  );
  const conflicts = [];

  rows.forEach((a, index) => {
    rows.slice(index + 1).forEach((b) => {
      if (a.property_id !== b.property_id) return;
      const overlaps =
        new Date(a.checkin_date) < new Date(b.checkout_date) &&
        new Date(b.checkin_date) < new Date(a.checkout_date);

      if (overlaps) {
        conflicts.push({
          type: "overlap",
          property_id: a.property_id,
          booking_a: a.booking_id || a.event_id,
          booking_b: b.booking_id || b.event_id,
        });
      }
    });
  });

  return conflicts;
};

export const getCalendarSourceLabel = (platform = "") =>
  ({
    Airbnb: "Airbnb iCal",
    Vrbo: "Vrbo iCal",
    "Booking.com": "Booking.com iCal",
    Direct: "Direct",
    Blocked: "Manual Block",
  }[platform] || platform || "Unknown");

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
