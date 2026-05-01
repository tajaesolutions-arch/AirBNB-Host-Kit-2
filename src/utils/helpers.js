// ============================================================
//  UTILITY HELPERS
// ============================================================

export const uid = (prefix = "ID") =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const calcNights = (checkin, checkout) => {
  if (!checkin || !checkout) return 0;
  const d = (new Date(checkout) - new Date(checkin)) / 86400000;
  return Math.max(0, Math.round(d));
};

export const bookingTotal = (b) => {
  const nights = calcNights(b.checkin_date, b.checkout_date);
  return (Number(b.nightly_rate) || 0) * nights
    + (Number(b.cleaning_fee) || 0)
    + (Number(b.extra_fees) || 0)
    - (Number(b.discounts) || 0);
};

export const fmtCurrency = (amount, currency = "JMD") => {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat("en-JM", {
    style: "currency",
    currency: currency === "USD" ? "USD" : "JMD",
    maximumFractionDigits: 0,
  }).format(n);
};

export const fmtPct = (val) => {
  const n = Number(val) || 0;
  return (n * 100).toFixed(1) + "%";
};

export const fmtDateShort = (d) => {
  if (!d) return "—";
  try {
    return new Date(d + "T00:00:00").toLocaleDateString("en-JM", {
      day: "2-digit", month: "short", year: "numeric",
    });
  } catch { return d; }
};

export const isDirectPlatform = (platform) =>
  ["Direct", "WhatsApp", "Instagram", "Google", "Referral", "Website", "Phone Call", "Past Guest"].includes(platform);

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
  const csv = [keys.join(","), ...data.map(row => keys.map(k => {
    const v = row[k] ?? "";
    return typeof v === "string" && v.includes(",") ? `"${v}"` : v;
  }).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
};

export const bookingStatusChip = (s) => ({
  "Confirmed": "blue", "Checked In": "green",
  "Checked Out": "gray", "Cancelled": "red",
})[s] || "gray";

export const paymentStatusChip = (s) => ({
  "Paid": "green", "Partial": "amber",
  "Unpaid": "red", "Pending": "blue",
})[s] || "gray";

export const cleaningStatusChip = (s) => ({
  "Scheduled": "amber", "In Progress": "blue",
  "Completed": "green", "Issue Found": "red", "Cancelled": "gray",
})[s] || "gray";

export const priorityChip = (p) => ({
  "Low": "gray", "Medium": "amber", "High": "amber", "Urgent": "red",
})[p] || "gray";

export const maintStatusChip = (s) => ({
  "Open": "red", "In Progress": "blue", "Waiting on Vendor": "amber",
  "Completed": "green", "Cancelled": "gray",
})[s] || "gray";

export const leadStatusChip = (s) => ({
  "New": "blue", "Interested": "teal", "Quote Sent": "amber",
  "Follow Up": "amber", "Booked": "green", "Lost": "red", "No Response": "gray",
})[s] || "gray";

export const supplyChip = (s) => ({
  "In Stock": "green", "Low Stock": "amber", "Out of Stock": "red",
})[s] || "gray";
