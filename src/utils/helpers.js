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


export const parseICSDate = (value = "") => {
  const raw = String(value || "").trim().replace(/^.*:/, "");
  if (!raw) return "";
  if (/^\d{8}$/.test(raw)) return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
  if (/^\d{8}T/.test(raw)) return `${raw.slice(0,4)}-${raw.slice(4,6)}-${raw.slice(6,8)}`;
  return raw.slice(0,10);
};
export const parseICSCalendar = (icsText = "") => {
  const events=[]; let current=null;
  String(icsText||"").split(/
?
/).forEach((line)=>{
    if (line==='BEGIN:VEVENT') current={};
    else if (line==='END:VEVENT' && current){events.push({external_uid:current.UID||uid('ICS'),summary:current.SUMMARY||'Imported Calendar Hold',checkin_date:parseICSDate(current.DTSTART),checkout_date:parseICSDate(current.DTEND)});current=null;}
    else if (current && line.includes(':')){const [k,...rest]=line.split(':'); current[k.split(';')[0]]=rest.join(':');}
  });
  return events;
};
export const datesOverlap = (s1,e1,s2,e2) => !!(s1&&e1&&s2&&e2) && new Date(s1) < new Date(e2) && new Date(s2) < new Date(e1);
export const calculateQuoteTotal = (quote={}) => {const nights=calcNights(quote.checkin_date, quote.checkout_date); const subtotal=(Number(quote.nightly_rate)||0)*nights + (Number(quote.cleaning_fee)||0) + (Number(quote.extra_fees)||0); const discount=Number(quote.discount)||0; const total=Math.max(0,subtotal-discount); const depositDue=Number(quote.deposit_amount)||0; return {nights, subtotal, discount, total, depositDue, balanceDue:Math.max(0,total-depositDue)};};
export const generateQuoteMessage=(quote={})=>{const t=calculateQuoteTotal(quote); return `Hi ${quote.guest_name||'Guest'}!\nQuote for ${quote.checkin_date||''} to ${quote.checkout_date||''} (${t.nights} nights):\nNightly: ${fmtCurrency(quote.nightly_rate||0)}\nCleaning: ${fmtCurrency(quote.cleaning_fee||0)}\nExtra: ${fmtCurrency(quote.extra_fees||0)}\nDiscount: ${fmtCurrency(t.discount||0)}\nTotal: ${fmtCurrency(t.total||0)}\nDeposit due: ${fmtCurrency(t.depositDue||0)}\nBalance: ${fmtCurrency(t.balanceDue||0)}\nPayment deadline: ${quote.payment_deadline||'TBD'}.`;};
export const generateSmartGuestMessage=({template_type='checkin',tone='Friendly',guest_name='Guest',property_name='your villa'}={})=>`${tone} Smart Draft\nHi ${guest_name}, this is your ${template_type.replace('_',' ')} update for ${property_name}. Let us know if you need anything.`;
export const calculateGuestLTVScore=(guest,bookings=[])=>{const gBookings=bookings.filter(b=>b.guest_id===guest.guest_id||b.guest_name===guest.guest_name); const totalSpent=gBookings.reduce((s,b)=>s+bookingTotal(b),0); const bookingCount=gBookings.length; const lastStay=gBookings.map(b=>b.checkout_date).sort().slice(-1)[0]||''; let score=0; if(totalSpent>200000) score+=40; if(bookingCount>1) score+=20; if(guest?.review_left) score+=15; if(guest?.direct_followup_sent) score+=15; if(lastStay && ((Date.now()-new Date(lastStay).getTime())/86400000)<=180) score+=10; return {score,totalSpent,bookingCount,lastStay};};
export const getRepeatGuestCandidates=(guests=[],bookings=[])=>guests.filter(g=>!!(g.email||g.phone)).filter(g=>{const ltv=calculateGuestLTVScore(g,bookings); return ltv.bookingCount>0 && ltv.score>=30;});
export const getSmartAlerts=(data={})=>{const alerts=[]; const now=new Date(); (data.supplies||[]).forEach(s=>{if(Number(s.current_quantity)<=0) alerts.push({alert_type:"Out of stock",severity:"red",title:`${s.item_name} is out of stock`}); else if(Number(s.current_quantity)<=Number(s.reorder_level||0)) alerts.push({alert_type:"Low stock",severity:"amber",title:`${s.item_name} is low stock`});}); (data.bookings||[]).forEach(b=>{if(["Unpaid","Partial","Pending"].includes(b.payment_status)) alerts.push({alert_type:"Unpaid booking",severity:"red",title:`${b.guest_name} payment pending`}); const ci=new Date(b.checkin_date); if((ci-now)/86400000<=3 && (ci-now)/86400000>=0) alerts.push({alert_type:"Upcoming check-in",severity:"blue",title:`Check-in: ${b.guest_name}`});}); return alerts;};
export const calculateProfitForecast=(data={})=>{const bookings=(data.bookings||[]).filter(b=>String(b.checkin_date||"").slice(0,7)===data.month); const gross=bookings.reduce((s,b)=>s+bookingTotal(b),0); const confirmed=bookings.filter(b=>b.booking_status==="Confirmed").reduce((s,b)=>s+bookingTotal(b),0); const pending=bookings.filter(b=>["Unpaid","Partial","Pending"].includes(b.payment_status)).reduce((s,b)=>s+bookingTotal(b),0); const expenses=(data.expenses||[]).filter(e=>String(e.expense_date||"").slice(0,7)===data.month).reduce((s,e)=>s+Number(e.amount||0),0); const mg=gross*Number(data.settings?.management_fee_percentage||0); const pf=gross*Number(data.settings?.platform_fee_percentage||0); const tax=gross*Number(data.settings?.tax_reserve_percentage||0); const totalExp=expenses+mg+pf+tax; return {projectedGrossRevenue:gross,projectedExpenses:totalExp,projectedNetProfit:gross-totalExp,projectedOccupancy:0,confirmedBookingValue:confirmed,pendingUnpaidValue:pending};};
export const calculateHostHealthScore=(data={})=>{let score=100; const deductions=[]; const add=(pts,label,page)=>{if(pts>0){score-=pts; deductions.push({points:pts,label,page});}}; add((data.maintenance||[]).filter(x=>x.priority==="Urgent"&&x.status!=="Completed").length*10,"Urgent maintenance open","maintenance"); add((data.supplies||[]).filter(s=>Number(s.current_quantity)<=0).length*6,"Out-of-stock supplies","supplies"); add((data.bookings||[]).filter(b=>["Unpaid","Partial","Pending"].includes(b.payment_status)).length*8,"Unpaid bookings","bookings"); score=Math.max(0,score); const status=score>=90?"Excellent":score>=75?"Healthy":score>=55?"Needs Attention":"At Risk"; return {score,status,deductions,actions:deductions.slice(0,3)};};
export const calculateTaxPrepPack=(payload={})=>{const month=payload.month; const gross=(payload.bookings||[]).filter(b=>String(b.checkin_date||"").slice(0,7)===month).reduce((s,b)=>s+bookingTotal(b),0); const deductible=(payload.expenses||[]).filter(e=>String(e.expense_date||"").slice(0,7)===month).reduce((s,e)=>s+Number(e.amount||0),0); const management_fees=gross*0.1; const tax_reserve=gross*0.15; return {month,gross_revenue:gross,deductible_expenses:deductible,management_fees,tax_reserve,owner_payout:gross-deductible-management_fees-tax_reserve};};
export const getPricingNotesForDateRange=(notes=[], propertyId, start, end)=>notes.filter(n=>(!propertyId||n.property_id===propertyId)&&datesOverlap(n.start_date,n.end_date,start,end));
