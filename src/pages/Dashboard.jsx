import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { Chip, PageHeader } from "../components/index.jsx";
import {
  bookingRevenueInMonth,
  fmtCurrency,
  fmtPct,
  fmtDateShort,
  paymentStatusChip,
  cleaningStatusChip,
  supplyChip,
  normalizeCurrency,
} from "../utils/helpers.js";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Package,
  CheckCircle2,
  PlusCircle,
  ReceiptText,
  Circle,
  ChevronDown,
  ChevronUp,
  Megaphone,
} from "lucide-react";

const SETUP_PROGRESS_STORAGE_KEY = "jak_dashboard_setup_progress";
const SETUP_CHECKLIST_OPEN_STORAGE_KEY = "jak_setup_checklist_open";
const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeSettings = (value) => (value && typeof value === "object" ? value : {});
const DIRECT_CHANNELS = ["WhatsApp", "Instagram", "Direct", "Google", "Referral", "Website", "Phone Call", "Past Guest"];

function toDateOnly(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}
function toISODate(date) {
  return date.toISOString().slice(0, 10);
}
function getLookbackRange(mode, customStartDate, customEndDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (mode === "CUSTOM") {
    const start = toDateOnly(customStartDate);
    const end = toDateOnly(customEndDate);
    return { startDate: start ? toISODate(start) : "", endDate: end ? toISODate(end) : "", isCustom: true, isValid: Boolean(start && end && start <= end) };
  }
  const days = Number(mode) || 30;
  const start = new Date(today);
  start.setDate(today.getDate() - (days - 1));
  return { startDate: toISODate(start), endDate: toISODate(today), isCustom: false, isValid: true };
}
function isDateInRange(value, startDate, endDate) {
  if (!value || !startDate || !endDate) return false;
  const date = toDateOnly(value);
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (!date || !start || !end) return false;
  return date >= start && date <= end;
}
function bookingOverlapsRange(booking, startDate, endDate) {
  const checkin = toDateOnly(booking.checkin_date);
  const checkout = toDateOnly(booking.checkout_date);
  const start = toDateOnly(startDate);
  const end = toDateOnly(endDate);
  if (!checkin || !checkout || !start || !end) return false;
  return checkin <= end && checkout >= start;
}
const parseDateSafe = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};
const formatLongDate = (value) => {
  const date = toDateOnly(value);
  return date
    ? new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(date)
    : "—";
};

function loadSetupProgress() { try { const raw = localStorage.getItem(SETUP_PROGRESS_STORAGE_KEY); const p = raw ? JSON.parse(raw) : {}; const s = p && typeof p === "object" && !Array.isArray(p) ? p : {}; const n = (v) => (v === true ? { done: true, skipped: false } : v && typeof v === "object" ? { done: v.done === true, skipped: v.skipped === true } : { done: false, skipped: false }); return { businessInfo: n(s.businessInfo), team: n(s.team), operations: n(s.operations), fees: n(s.fees ?? s.reviewedFees), backup: n(s.backup ?? s.backupExported) }; } catch { return {}; } }
function saveSetupProgress(nextProgress) { try { localStorage.setItem(SETUP_PROGRESS_STORAGE_KEY, JSON.stringify(nextProgress)); } catch {} }
const isProgressComplete = (savedProgress, key) => savedProgress?.[key]?.done === true || savedProgress?.[key]?.skipped === true;
function getSetupChecklist({ properties, bookings, expenses, supplies, cleaning, maintenance, settings, savedProgress }) {
  const cleaners = safeArray(settings.cleaners); const vendors = safeArray(settings.vendors);
  const hasBusinessInfo = Boolean(String(settings.business_name || "").trim() || String(settings.host_name || "").trim() || String(settings.host_phone || "").trim() || String(settings.host_email || "").trim());
  const hasRatesReviewed = Number(settings.platform_fee_percentage || 0) > 0 || Number(settings.management_fee_percentage || 0) > 0 || Number(settings.tax_reserve_percentage || 0) > 0 || isProgressComplete(savedProgress, "fees");
  return [
    { id: "businessInfo", title: "Add business / host information", completed: hasBusinessInfo || isProgressComplete(savedProgress, "businessInfo"), page: "settings", action: "Open Settings" },
    { id: "property", title: "Add your first property", completed: properties.length > 0, page: "settings", action: "Add Property" },
    { id: "team", title: "Add cleaner or vendor details", completed: cleaners.length > 0 || vendors.length > 0 || isProgressComplete(savedProgress, "team"), page: "settings", action: "Manage Team" },
    { id: "booking", title: "Add your first booking", completed: bookings.length > 0, page: "bookings", action: "Add Booking" },
    { id: "expense", title: "Add your first expense", completed: expenses.length > 0, page: "revenue", action: "Add Expense" },
    { id: "supply", title: "Add your first supply item", completed: supplies.length > 0, page: "supplies", action: "Add Supply" },
    { id: "operations", title: "Add one operations record", completed: cleaning.length > 0 || maintenance.length > 0 || isProgressComplete(savedProgress, "operations"), page: "cleaning", action: "Open Operations" },
    { id: "fees", title: "Review fees and tax reserve", completed: hasRatesReviewed, page: "settings", action: "Review Fees", canManuallyComplete: true },
    { id: "backup", title: "Export your first backup", completed: isProgressComplete(savedProgress, "backup") || Boolean(localStorage.getItem("jak_backup_exported_at")), page: "settings", action: "Open Backup Tools", canManuallyComplete: true },
  ];
}
function SetupProgressCard({ checklist, onGoToPage, onMarkComplete, onMarkSkipped }) { const [isOpen, setIsOpen] = useState(() => localStorage.getItem(SETUP_CHECKLIST_OPEN_STORAGE_KEY) !== "false"); const completedCount = checklist.filter((item) => item.completed).length; const percent = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0; if (percent === 100) return null; const toggle = () => setIsOpen((p) => { const n = !p; localStorage.setItem(SETUP_CHECKLIST_OPEN_STORAGE_KEY, String(n)); return n; });
  return <div className="card dashboard-overview dashboard-setup-card"><div className="dashboard-card-header"><h3>Setup Checklist</h3><div className="dashboard-setup-meta"><span>{completedCount}/{checklist.length} complete</span><button type="button" className="btn-ghost" onClick={toggle} aria-label="Toggle setup checklist">{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div></div><div className="setup-bar"><div className="setup-fill" style={{ width: `${percent}%` }} /></div>{isOpen && <div className="dashboard-setup-items">{checklist.map((item) => <div key={item.id} className="dashboard-list-item"><span className="dashboard-setup-title">{item.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}{item.title}</span><div className="dashboard-setup-actions">{!item.completed && item.canManuallyComplete && <button type="button" className="btn-ghost setup-mini-btn" onClick={() => onMarkComplete(item.id)}>Done</button>}{!item.completed && item.canManuallyComplete && <button type="button" className="btn-ghost setup-mini-btn" onClick={() => onMarkSkipped(item.id)}>Skip</button>}<button type="button" className="btn-ghost setup-mini-btn" onClick={() => onGoToPage(item.page)}>{item.action}</button></div></div>)}</div>}</div>; }

function DashboardFilterBar(props) {
  const { properties, propFilter, setPropFilter, dateRangeMode, setDateRangeMode, customStartDate, setCustomStartDate, customEndDate, setCustomEndDate, dateRange } = props;
  const selectedPropertyName = propFilter === "ALL" ? "All Properties" : properties.find((property) => property.property_id === propFilter)?.property_name || "Selected Property";
  return <section className="dashboard-filter-bar" aria-label="Dashboard filters"><div className="dashboard-filter-copy"><span className="dashboard-filter-kicker">Dashboard filters</span><strong>{selectedPropertyName}</strong><p>Showing dashboard analytics from {formatLongDate(dateRange.startDate)} to {formatLongDate(dateRange.endDate)}.</p></div><div className="dashboard-filter-controls"><label className="dashboard-filter-field"><span>Property</span><select value={propFilter || "ALL"} onChange={(event) => typeof setPropFilter === "function" && setPropFilter(event.target.value)}><option value="ALL">All Properties</option>{properties.map((property) => <option key={property.property_id} value={property.property_id}>{property.property_name}</option>)}</select></label><label className="dashboard-filter-field"><span>Date range</span><select value={dateRangeMode} onChange={(event) => setDateRangeMode(event.target.value)}><option value="5">Last 5 days</option><option value="10">Last 10 days</option><option value="15">Last 15 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="CUSTOM">Custom period</option></select></label>{dateRangeMode === "CUSTOM" && <><label className="dashboard-filter-field dashboard-filter-field--date"><span>Start date</span><input type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} /></label><label className="dashboard-filter-field dashboard-filter-field--date"><span>End date</span><input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} /></label></>}</div></section>;
}

export default function Dashboard({ setPage, monthFilter, propFilter, setPropFilter }) {
  const app = useApp();
  const bookings = safeArray(app.bookings); const expenses = safeArray(app.expenses); const maintenance = safeArray(app.maintenance); const supplies = safeArray(app.supplies); const cleaning = safeArray(app.cleaning); const properties = safeArray(app.properties); const settings = safeSettings(app.settings); const leads = safeArray(app.leads);
  const [savedSetupProgress, setSavedSetupProgress] = useState(() => loadSetupProgress());
  const [dateRangeMode, setDateRangeMode] = useState("30");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const goToPage = (p, action = null) => typeof setPage === "function" && setPage(p, action);
  const selectedMonth = monthFilter || new Date().toISOString().slice(0, 7);
  const selectedPropFilter = !propFilter || propFilter === "all" ? "ALL" : propFilter;
  const dateRange = getLookbackRange(dateRangeMode, customStartDate, customEndDate);
  const filterByProp = (arr, key = "property_id") => selectedPropFilter === "ALL" ? arr : arr.filter((x) => x?.[key] === selectedPropFilter || !x?.[key]);
  const activeProperties = selectedPropFilter === "ALL" ? properties.length : 1;
  const activeBookings = filterByProp(bookings).filter((b) => b?.booking_status !== "Cancelled");
  const rangeBookings = dateRange.isValid ? activeBookings.filter((b) => bookingOverlapsRange(b, dateRange.startDate, dateRange.endDate)) : [];
  const rangeExpenses = dateRange.isValid ? filterByProp(expenses).filter((e) => isDateInRange(e?.expense_date, dateRange.startDate, dateRange.endDate)) : [];
  const cleaningDue = filterByProp(cleaning).filter((c) => {
    if (!["Scheduled", "In Progress"].includes(c?.cleaning_status)) return false;
    if (!dateRange.isValid) return false;
    return isDateInRange(c?.checkout_date || c?.next_checkin_date, dateRange.startDate, dateRange.endDate);
  });
  const openMaintenance = filterByProp(maintenance).filter((m) => !["Completed", "Cancelled"].includes(m?.status)).filter((m) => !dateRange.isValid ? false : isDateInRange(m?.reported_date, dateRange.startDate, dateRange.endDate) || isDateInRange(m?.completion_date, dateRange.startDate, dateRange.endDate));
  const urgentMaintenance = openMaintenance.filter((m) => ["Urgent", "High"].includes(m?.priority));
  const lowStock = filterByProp(supplies).filter((s) => Number(s?.current_quantity) <= Number(s?.reorder_level));
  const selectedCurrency = normalizeCurrency(settings.default_currency || "JMD");
  const grossRevenue = rangeBookings.reduce((s, b) => s + bookingRevenueInMonth(b, selectedMonth), 0);
  const totalExpenses = rangeExpenses.reduce((s, e) => s + Number(e?.amount || 0), 0);
  const managementFee = grossRevenue * Number(settings.management_fee_percentage || 0);
  const taxReserve = grossRevenue * Number(settings.tax_reserve_percentage || 0);
  const netProfit = grossRevenue - totalExpenses - managementFee - taxReserve;
  const bookedNights = dateRange.isValid ? rangeBookings.reduce((sum, booking) => {
    const start = toDateOnly(dateRange.startDate); const end = toDateOnly(dateRange.endDate); const checkin = toDateOnly(booking?.checkin_date); const checkout = toDateOnly(booking?.checkout_date);
    if (!start || !end || !checkin || !checkout) return sum;
    const overlapStart = checkin > start ? checkin : start;
    const overlapEnd = checkout < end ? checkout : end;
    const nights = Math.max(0, Math.round((overlapEnd - overlapStart) / 86400000) + 1);
    return sum + nights;
  }, 0) : 0;
  const totalRangeDays = dateRange.isValid ? Math.max(1, Math.round((toDateOnly(dateRange.endDate) - toDateOnly(dateRange.startDate)) / 86400000) + 1) : 0;
  const occupancy = !dateRange.isValid || !activeProperties ? 0 : bookedNights / (totalRangeDays * activeProperties);
  const opsTotal = urgentMaintenance.length + lowStock.length + cleaningDue.length;
  const operationsHealth = Math.max(0, Math.min(100, 100 - (opsTotal * 12)));
  const checklist = useMemo(() => getSetupChecklist({ properties, bookings, expenses, supplies, cleaning, maintenance, settings, savedProgress: savedSetupProgress }), [properties, bookings, expenses, supplies, cleaning, maintenance, settings, savedSetupProgress]);
  if (!properties.length) return <div className="page"><PageHeader title="Welcome to your Host Operations Kit" subtitle="Start with your first property to begin tracking your operations." actions={<button type="button" className="btn-primary" onClick={() => goToPage("settings")}><PlusCircle size={14}/>Add First Property</button>} /></div>;

  const subtitle = `${selectedMonth} · ${selectedPropFilter === "ALL" ? "All Properties" : properties.find((p) => p.property_id === selectedPropFilter)?.property_name || "Selected Property"}`;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const upcoming = rangeBookings.filter((b) => { const checkinDate = parseDateSafe(b?.checkin_date); return checkinDate && checkinDate >= today; }).sort((a, b) => parseDateSafe(a?.checkin_date) - parseDateSafe(b?.checkin_date)).slice(0, 5);
  const directBookings = rangeBookings.filter((b) => DIRECT_CHANNELS.includes(b?.platform));
  const directRevenue = directBookings.reduce((sum, b) => sum + bookingRevenueInMonth(b, selectedMonth), 0);
  const _filteredLeads = dateRange.isValid ? filterByProp(leads).filter((l) => !l?.followup_date || isDateInRange(l?.followup_date, dateRange.startDate, dateRange.endDate)) : [];
  const alertItems = [...urgentMaintenance.map((m) => ({ id: `m-${m.maintenance_id}`, label: `${m.issue || "Maintenance item"} (${m.priority || "Open"})`, page: "maintenance" })), ...lowStock.map((s) => ({ id: `s-${s.supply_id}`, label: `${s.item_name || "Supply"} is low stock`, page: "supplies" })), ...cleaningDue.filter((c) => c?.cleaning_status === "Scheduled").map((c) => ({ id: `c-${c.cleaning_id}`, label: `Cleaning scheduled for ${c?.property_id || "property"}`, page: "cleaning" }))];
  const alerts = alertItems.slice(0, 5);
  const extraAlertsCount = Math.max(0, alertItems.length - alerts.length);
  const filterError = dateRangeMode === "CUSTOM" ? (!customStartDate || !customEndDate ? "Select both a start and end date to update analytics." : !dateRange.isValid ? "Start date must be before end date." : "") : "";

  return <div className="dashboard-overview page"><section className="dashboard-hero card"><div><h1 className="page-title">Performance Overview</h1><p className="page-subtitle">Track bookings, operations, and profitability for {subtitle}.</p></div><div className="dashboard-actions"><button type="button" className="btn-secondary" onClick={() => goToPage("bookings", "addBooking")}><PlusCircle size={14} />Add Booking</button><button type="button" className="btn-secondary" onClick={() => goToPage("revenue", "addExpense")}><ReceiptText size={14} />Add Expense</button><button type="button" className="btn-secondary" onClick={() => goToPage("supplies") }><Package size={14} />Add Supply</button></div></section>
    <DashboardFilterBar properties={properties} propFilter={selectedPropFilter} setPropFilter={setPropFilter} dateRangeMode={dateRangeMode} setDateRangeMode={setDateRangeMode} customStartDate={customStartDate} setCustomStartDate={setCustomStartDate} customEndDate={customEndDate} setCustomEndDate={setCustomEndDate} dateRange={dateRange} />
    {filterError ? <p className="dashboard-filter-error">{filterError}</p> : null}
    {checklist.some((item) => !item.completed) && <SetupProgressCard checklist={checklist} onGoToPage={goToPage} onMarkComplete={(id)=>setSavedSetupProgress((p)=>{const n={...p,[id]:{done:true,skipped:false}}; saveSetupProgress(n); return n;})} onMarkSkipped={(id)=>setSavedSetupProgress((p)=>{const n={...p,[id]:{done:false,skipped:true}}; saveSetupProgress(n); return n;})} />}
    <section className="dashboard-kpi-grid">{[{ label: "Gross Revenue", value: fmtCurrency(grossRevenue, selectedCurrency), hint: `${rangeBookings.length} bookings in period`, icon: <DollarSign size={16} /> }, { label: "Net Profit", value: fmtCurrency(netProfit, selectedCurrency), hint: netProfit >= 0 ? "Positive margin" : "Needs expense review", icon: <TrendingUp size={16} /> }, { label: "Occupancy", value: fmtPct(occupancy), hint: `${bookedNights} nights booked`, icon: <Calendar size={16} /> }, { label: "Operations Health", value: `${operationsHealth}%`, hint: `${opsTotal} open operation flags`, icon: <ShieldCheck size={16} /> }].map((kpi) => <article key={kpi.label} className="dashboard-kpi-card card"><div className="dashboard-kpi-icon">{kpi.icon}</div><p>{kpi.label}</p><h3>{kpi.value}</h3><small>{kpi.hint}</small></article>)}</section>
    <section className="dashboard-content-grid"><article className="card dashboard-card dashboard-span-8"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Upcoming Bookings</h3></div><div className="dashboard-list">{upcoming.length === 0 ? <p className="dashboard-empty">No upcoming bookings for this filter.</p> : upcoming.map((b) => <div className="dashboard-list-item" key={b.booking_id}><div><strong>{b.guest_name || "Guest"}</strong><p>{properties.find((p) => p.property_id === b.property_id)?.property_name || "—"} · {fmtDateShort(b.checkin_date)} to {fmtDateShort(b.checkout_date)}</p></div><div><Chip tone={supplyChip(b.platform)}>{b.platform || "—"}</Chip><Chip tone={paymentStatusChip(b.payment_status)}>{b.payment_status || "—"}</Chip></div></div>)}</div></article>
      <article className="card dashboard-card dashboard-span-4"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Operations Health</h3></div><div className="dashboard-health-score">{operationsHealth}%</div><div className="dashboard-list"><div className="dashboard-list-item"><span>Urgent maintenance</span><strong>{urgentMaintenance.length}</strong></div><div className="dashboard-list-item"><span>Low-stock items</span><strong>{lowStock.length}</strong></div><div className="dashboard-list-item"><span>Cleaning due</span><strong>{cleaningDue.length}</strong></div></div></article>
      <article className="card dashboard-card dashboard-span-4 dashboard-card--half dashboard-alert-card"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Alerts</h3></div><div className="dashboard-list">{alerts.length === 0 ? <p className="dashboard-empty">No urgent alerts. Operations are stable.</p> : alerts.map((a) => <button type="button" key={a.id} className="dashboard-list-item dashboard-alert-button" onClick={() => goToPage(a.page)}><span>{a.label}</span><Megaphone size={14} /></button>)}</div>{extraAlertsCount > 0 ? <p className="dashboard-more-note">+ {extraAlertsCount} more alerts</p> : null}</article>
      <article className="card dashboard-card dashboard-span-4 dashboard-card--half"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Profit Breakdown</h3></div><div className="dashboard-stat-list"><div className="dashboard-stat-row"><span className="dashboard-stat-label">Gross Revenue</span><strong className="dashboard-stat-value">{fmtCurrency(grossRevenue, selectedCurrency)}</strong></div><div className="dashboard-stat-row"><span className="dashboard-stat-label">Expenses</span><strong className="dashboard-stat-value">{fmtCurrency(totalExpenses, selectedCurrency)}</strong></div><div className="dashboard-stat-row"><span className="dashboard-stat-label">Tax Reserve</span><strong className="dashboard-stat-value">{fmtCurrency(taxReserve, selectedCurrency)}</strong></div><div className="dashboard-stat-row"><span className="dashboard-stat-label">Management Fee</span><strong className="dashboard-stat-value">{fmtCurrency(managementFee, selectedCurrency)}</strong></div><div className="dashboard-stat-row"><span className="dashboard-stat-label">Net Profit</span><strong className="dashboard-stat-value">{fmtCurrency(netProfit, selectedCurrency)}</strong></div></div></article>
      <article className="card dashboard-card dashboard-span-4 dashboard-card--half"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Direct Booking Snapshot</h3></div><div className="dashboard-list"><div className="dashboard-list-item"><span>Direct revenue</span><strong>{fmtCurrency(directRevenue, selectedCurrency)}</strong></div><div className="dashboard-list-item"><span>Direct bookings</span><strong>{directBookings.length}</strong></div><div className="dashboard-list-item"><span>Tracked channels</span><strong>{DIRECT_CHANNELS.length}</strong></div></div></article>
      <article className="card dashboard-card dashboard-span-4 dashboard-card--half"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Cleaning Due</h3></div><div className="dashboard-stat-list">{cleaningDue.length === 0 ? <p className="dashboard-empty">No cleaning tasks due right now.</p> : cleaningDue.slice(0, 3).map((item) => <div className="dashboard-cleaning-row" key={item.cleaning_id}><div className="dashboard-cleaning-label"><strong>{properties.find((p) => p.property_id === item.property_id)?.property_name || "—"}</strong><p>{fmtDateShort(item.cleaning_date || item.checkout_date || item.next_checkin_date)}</p></div><Chip tone={cleaningStatusChip(item.cleaning_status)}>{item.cleaning_status || "—"}</Chip></div>)}</div></article>
      <article className="card dashboard-card dashboard-span-8 dashboard-chart-card"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Revenue vs Expenses</h3></div><div className="dashboard-mini-chart"><div><span>Gross Revenue</span><strong>{fmtCurrency(grossRevenue, selectedCurrency)}</strong></div><div><span>Expenses</span><strong>{fmtCurrency(totalExpenses, selectedCurrency)}</strong></div><div><span>Net Profit</span><strong>{fmtCurrency(netProfit, selectedCurrency)}</strong></div></div></article>
    </section></div>;
}
