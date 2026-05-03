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
export const safeArray = (value) => (Array.isArray(value) ? value : []);
export const toNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};
export const datesOverlap = (startA, endA, startB, endB) => {
  if (!startA || !endA || !startB || !endB) return false;
  return new Date(startA) < new Date(endB) && new Date(startB) < new Date(endA);
};
export const calculateQuoteTotals = ({ checkin_date, checkout_date, nightly_rate, cleaning_fee, extra_fees, discount, deposit_percent = 30 }) => {
  const nights = calcNights(checkin_date, checkout_date);
  const room_total = nights * toNumber(nightly_rate);
  const total = room_total + toNumber(cleaning_fee) + toNumber(extra_fees) - toNumber(discount);
  const deposit_due = Math.max(0, total * (toNumber(deposit_percent) / 100));
  return { nights, room_total, cleaning_fee: toNumber(cleaning_fee), extra_fees: toNumber(extra_fees), discount: toNumber(discount), total, deposit_due, balance_due: total - deposit_due };
};
export const generateQuoteMessage = (quote, settings = {}) => `Direct Booking Quote\nBusiness: ${settings.business_name || "Host Operations"}\nGuest: ${quote.guest_name || "Guest"}\nProperty: ${quote.property_name || "Property"}\nStay: ${quote.checkin_date || "?"} to ${quote.checkout_date || "?"} (${quote.nights || 0} nights)\nTotal: ${fmtCurrency(quote.total || 0)}\nDeposit Due: ${fmtCurrency(quote.deposit_due || 0)}\nBalance Due: ${fmtCurrency(quote.balance_due || 0)}`;
export const generateSmartMessage = ({ type, tone, guestName, propertyName, checkin, checkout, businessName }) => `${guestName || "Guest"}, ${type}. ${propertyName ? `Property: ${propertyName}.` : ""} ${checkin ? `Check-in: ${checkin}.` : ""} ${checkout ? `Checkout: ${checkout}.` : ""} (${tone} tone)\n- ${businessName || "Host Operations"}`;
export const normalizePhoneForWhatsApp = (phone = "") => String(phone).replace(/[^\d]/g, "");
export const openWhatsAppDraft = ({ phone, text }) => {
  const normalized = normalizePhoneForWhatsApp(phone);
  if (!normalized) return false;
  window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(text || "")}`, "_blank");
  return true;
};
export const openEmailDraft = ({ email, subject, body }) => {
  if (!email) return false;
  window.open(`mailto:${email}?subject=${encodeURIComponent(subject || "")}&body=${encodeURIComponent(body || "")}`);
  return true;
};
export const copyText = async (text = "") => {
  try { await navigator.clipboard.writeText(text); return true; } catch { return false; }
};
export const openPrintDocument = ({ title, bodyHtml, businessName }) => {
  const win = window.open("", "_blank");
  if (!win) return false;
  win.document.write(`<!doctype html><html><head><title>${title}</title><style>body{font-family:Inter,Arial,sans-serif;padding:24px;color:#17212b} .h{background:#0b2d5c;color:#fff;padding:16px;border-radius:8px} table{width:100%;border-collapse:collapse;margin-top:12px}td,th{border:1px solid #d6dde6;padding:8px;text-align:left}</style></head><body><div class='h'><h2>Host Operations</h2><div>Jamaica Airbnb Kit</div><div>${businessName || ""}</div><div>Prepared: ${new Date().toLocaleDateString()}</div></div>${bodyHtml}</body></html>`);
  win.document.close(); win.focus(); win.print(); return true;
};
export const calculateProfitForecast = ({ bookings = [], expenses = [], month, propertyId, taxRate = 0 }) => {
  const scopedBookings = safeArray(bookings).filter((b) => (!propertyId || b.property_id === propertyId) && (!month || (b.checkin_date || "").slice(0,7) === month));
  const confirmed = scopedBookings.filter((b) => (b.booking_status || "") === "Confirmed");
  const confirmed_booking_value = confirmed.reduce((s,b)=>s+bookingTotal(b),0);
  const unpaid_booking_value = confirmed.filter((b)=>b.payment_status!=="Paid").reduce((s,b)=>s+bookingTotal(b),0);
  const projected_gross_revenue = scopedBookings.reduce((s,b)=>s+bookingTotal(b),0);
  const projected_expenses = safeArray(expenses).filter((e)=>(!propertyId||e.property_id===propertyId)&&(!month||(e.expense_date||"").slice(0,7)===month)).reduce((s,e)=>s+toNumber(e.amount),0);
  const estimated_tax_reserve = projected_gross_revenue * (toNumber(taxRate)/100);
  return { projected_gross_revenue, projected_expenses, projected_net_profit: projected_gross_revenue - projected_expenses, confirmed_booking_value, unpaid_booking_value, estimated_fees: projected_gross_revenue*0.03, estimated_tax_reserve };
};
export const calculateHostHealthScore = ({ bookings=[], cleaning=[], maintenance=[], supplies=[], guests=[], damageDeposits=[] }) => {
  const deductions=[]; let score=100;
  const add=(label, count, pts)=>{ if(count>0){ const d=count*pts; score-=d; deductions.push({label,count,points:d}); }};
  add("Urgent maintenance", maintenance.filter((m)=>m.priority==="Urgent"&&m.status!=="Completed").length,10);
  add("Overdue cleaning", cleaning.filter((c)=>(c.cleaning_status||"")!=="Completed"&&c.checkout_date&&new Date(c.checkout_date)<new Date()).length,8);
  add("Out of stock", supplies.filter((s)=>Number(s.current_stock)<=0).length,6);
  add("Low stock", supplies.filter((s)=>Number(s.current_stock)>0&&Number(s.current_stock)<=Number(s.reorder_level||0)).length,4);
  add("Unpaid confirmed", bookings.filter((b)=>b.booking_status==="Confirmed"&&b.payment_status!=="Paid").length,8);
  add("Deposit not collected", damageDeposits.filter((d)=>!d.deposit_collected).length,6);
  add("Unresolved damage", damageDeposits.filter((d)=>d.damage_status&&d.damage_status!=="Resolved").length,6);
  add("Guest follow-up due", guests.filter((g)=>g.follow_up_due).length,4);
  return { score: Math.max(0,score), status: score>=85?"Strong":score>=70?"Watch":"At Risk", deductions };
};
export const buildOwnerReportSummary = ({ bookings=[], expenses=[], maintenance=[], cleaning=[], month, propertyId }) => ({
  revenue: safeArray(bookings).filter((b)=>(!propertyId||b.property_id===propertyId)&&(!month||(b.checkin_date||"").slice(0,7)===month)).reduce((s,b)=>s+bookingTotal(b),0),
  expenses: safeArray(expenses).filter((e)=>(!propertyId||e.property_id===propertyId)&&(!month||(e.expense_date||"").slice(0,7)===month)).reduce((s,e)=>s+toNumber(e.amount),0),
  maintenance_count: safeArray(maintenance).filter((m)=>!propertyId||m.property_id===propertyId).length,
  cleaning_count: safeArray(cleaning).filter((c)=>!propertyId||c.property_id===propertyId).length,
});
export const buildTaxPrepSummary = ({ bookings=[], expenses=[], month, propertyId, taxReservePercent=0, managementFeePercent=0 }) => {
  const gross = safeArray(bookings).filter((b)=>(!propertyId||b.property_id===propertyId)&&(!month||(b.checkin_date||"").slice(0,7)===month)).reduce((s,b)=>s+bookingTotal(b),0);
  const scopedExpenses = safeArray(expenses).filter((e)=>(!propertyId||e.property_id===propertyId)&&(!month||(e.expense_date||"").slice(0,7)===month));
  const deductible = scopedExpenses.reduce((s,e)=>s+toNumber(e.amount),0);
  return { gross_revenue:gross, deductible_expense_total:deductible, management_fees:gross*(toNumber(managementFeePercent)/100), tax_reserve:gross*(toNumber(taxReservePercent)/100), owner_payout_estimate:gross-deductible };
};
