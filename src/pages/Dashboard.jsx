import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { Chip, PageHeader } from "../components/index.jsx";
import {
  bookingNightsInMonth,
  bookingOverlapsMonth,
  bookingRevenueInMonth,
  fmtCurrency,
  fmtPct,
  fmtDateShort,
  inSelectedMonth,
  daysInMonth,
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

const parseDateSafe = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
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

function SetupProgressCard({ checklist, onGoToPage, onMarkComplete, onMarkSkipped }) {
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem(SETUP_CHECKLIST_OPEN_STORAGE_KEY) !== "false");
  const completedCount = checklist.filter((item) => item.completed).length;
  const percent = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;
  if (percent === 100) return null;
  const toggle = () => setIsOpen((p) => { const n = !p; localStorage.setItem(SETUP_CHECKLIST_OPEN_STORAGE_KEY, String(n)); return n; });

  return <div className="card dashboard-overview dashboard-setup-card"><div className="dashboard-card-header"><h3>Setup Checklist</h3><div className="dashboard-setup-meta"><span>{completedCount}/{checklist.length} complete</span><button type="button" className="btn-ghost" onClick={toggle} aria-label="Toggle setup checklist">{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div></div><div className="setup-bar"><div className="setup-fill" style={{ width: `${percent}%` }} /></div>{isOpen && <div className="dashboard-setup-items">{checklist.map((item) => <div key={item.id} className="dashboard-list-item"><span className="dashboard-setup-title">{item.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}{item.title}</span><div className="dashboard-setup-actions">{!item.completed && item.canManuallyComplete && <button type="button" className="btn-ghost setup-mini-btn" onClick={() => onMarkComplete(item.id)}>Done</button>}{!item.completed && item.canManuallyComplete && <button type="button" className="btn-ghost setup-mini-btn" onClick={() => onMarkSkipped(item.id)}>Skip</button>}<button type="button" className="btn-ghost setup-mini-btn" onClick={() => onGoToPage(item.page)}>{item.action}</button></div></div>)}</div>}</div>;
}

export default function Dashboard({ setPage, monthFilter, propFilter, setPropFilter }) {
  const app = useApp();
  const bookings = safeArray(app.bookings); const expenses = safeArray(app.expenses); const maintenance = safeArray(app.maintenance); const supplies = safeArray(app.supplies); const cleaning = safeArray(app.cleaning); const properties = safeArray(app.properties); const settings = safeSettings(app.settings);
  const [savedSetupProgress, setSavedSetupProgress] = useState(() => loadSetupProgress());
  const goToPage = (p, action = null) => typeof setPage === "function" && setPage(p, action);
  const selectedMonth = monthFilter || new Date().toISOString().slice(0, 7);
  const selectedPropFilter = !propFilter || propFilter === "all" ? "ALL" : propFilter;
  const filterByProp = (arr, key = "property_id") => selectedPropFilter === "ALL" ? arr : arr.filter((x) => x?.[key] === selectedPropFilter || !x?.[key]);
  const activeBookings = filterByProp(bookings).filter((b) => b?.booking_status !== "Cancelled");
  const monthBookings = activeBookings.filter((b) => bookingOverlapsMonth(b, selectedMonth));
  const monthExpenses = filterByProp(expenses).filter((e) => inSelectedMonth(e?.expense_date, selectedMonth));
  const selectedCurrency = normalizeCurrency(settings.default_currency || "JMD");
  const grossRevenue = monthBookings.reduce((s, b) => s + bookingRevenueInMonth(b, selectedMonth), 0);
  const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e?.amount || 0), 0);
  const managementFee = grossRevenue * Number(settings.management_fee_percentage || 0);
  const taxReserve = grossRevenue * Number(settings.tax_reserve_percentage || 0);
  const netProfit = grossRevenue - totalExpenses - managementFee - taxReserve;
  const bookedNights = monthBookings.reduce((s, b) => s + bookingNightsInMonth(b, selectedMonth), 0);
  const occupancy = bookedNights / Math.max(1, daysInMonth(selectedMonth) * Math.max(1, selectedPropFilter === "ALL" ? properties.length : 1));
  const cleaningDue = filterByProp(cleaning).filter((c) => ["Scheduled", "In Progress"].includes(c?.cleaning_status));
  const openMaintenance = filterByProp(maintenance).filter((m) => !["Completed", "Cancelled"].includes(m?.status));
  const urgentMaintenance = openMaintenance.filter((m) => ["Urgent", "High"].includes(m?.priority));
  const lowStock = filterByProp(supplies).filter((s) => Number(s?.current_quantity) <= Number(s?.reorder_level));
  const opsTotal = urgentMaintenance.length + lowStock.length + cleaningDue.length;
  const operationsHealth = Math.max(0, Math.min(100, 100 - (opsTotal * 12)));
  const checklist = useMemo(() => getSetupChecklist({ properties, bookings, expenses, supplies, cleaning, maintenance, settings, savedProgress: savedSetupProgress }), [properties, bookings, expenses, supplies, cleaning, maintenance, settings, savedSetupProgress]);

  if (!properties.length) {
    return <div className="page"><PageHeader title="Welcome to your Host Operations Kit" subtitle="Start with your first property to begin tracking your operations." actions={<button type="button" className="btn-primary" onClick={() => goToPage("settings")}><PlusCircle size={14}/>Add First Property</button>} /></div>;
  }

  const subtitle = `${selectedMonth} · ${selectedPropFilter === "ALL" ? "All Properties" : properties.find((p) => p.property_id === selectedPropFilter)?.property_name || "Selected Property"}`;
  const selectedPropertyName = selectedPropFilter === "ALL"
    ? "All Properties"
    : properties.find((property) => property.property_id === selectedPropFilter)?.property_name || "Selected Property";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = activeBookings
    .filter((b) => {
      const checkinDate = parseDateSafe(b?.checkin_date);
      return checkinDate && checkinDate >= today;
    })
    .sort((a, b) => parseDateSafe(a?.checkin_date) - parseDateSafe(b?.checkin_date))
    .slice(0, 5);
  const directBookings = monthBookings.filter((b) => DIRECT_CHANNELS.includes(b?.platform));
  const directRevenue = directBookings.reduce((sum, b) => sum + bookingRevenueInMonth(b, selectedMonth), 0);
  const alerts = [...urgentMaintenance.map((m) => ({ id: `m-${m.maintenance_id}`, label: `${m.issue || "Maintenance item"} (${m.priority || "Open"})`, page: "maintenance" })), ...lowStock.map((s) => ({ id: `s-${s.supply_id}`, label: `${s.item_name || "Supply"} is low stock`, page: "supplies" })), ...cleaningDue.filter((c) => c?.cleaning_status === "Scheduled").map((c) => ({ id: `c-${c.cleaning_id}`, label: `Cleaning scheduled for ${c?.property_id || "property"}`, page: "cleaning" }))].slice(0, 6);

  return <div className="dashboard-overview page">
    <section className="dashboard-hero card">
      <div>
        <h1 className="page-title">Performance Overview</h1>
        <p className="page-subtitle">Track bookings, operations, and profitability for {subtitle}.</p>
      </div>
      <div className="dashboard-actions">
        <button type="button" className="btn-secondary" onClick={() => goToPage("bookings", "addBooking")}><PlusCircle size={14} />Add Booking</button>
        <button type="button" className="btn-secondary" onClick={() => goToPage("revenue", "addExpense")}><ReceiptText size={14} />Add Expense</button>
        <button type="button" className="btn-secondary" onClick={() => goToPage("supplies") }><Package size={14} />Add Supply</button>
      </div>
    </section>

    {checklist.some((item) => !item.completed) && <SetupProgressCard checklist={checklist} onGoToPage={goToPage} onMarkComplete={(id)=>setSavedSetupProgress((p)=>{const n={...p,[id]:{done:true,skipped:false}}; saveSetupProgress(n); return n;})} onMarkSkipped={(id)=>setSavedSetupProgress((p)=>{const n={...p,[id]:{done:false,skipped:true}}; saveSetupProgress(n); return n;})} />}

    <div className="dashboard-filter-bar" aria-label="Dashboard filters">
      <div className="dashboard-filter-copy">
        <span className="dashboard-filter-kicker">Dashboard filters</span>
        <strong>{selectedPropertyName}</strong>
        <p>Metrics update based on the selected property and month.</p>
      </div>

      <div className="dashboard-filter-controls">
        <label className="dashboard-filter-field">
          <span>Property</span>
          <select
            value={selectedPropFilter}
            onChange={(event) => {
              if (typeof setPropFilter === "function") {
                setPropFilter(event.target.value);
              }
            }}
          >
            <option value="ALL">All Properties</option>
            {properties.map((property) => (
              <option key={property.property_id} value={property.property_id}>
                {property.property_name}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>

    <section className="dashboard-kpi-grid">
      {[{ label: "Gross Revenue", value: fmtCurrency(grossRevenue, selectedCurrency), hint: `${monthBookings.length} bookings in period`, icon: <DollarSign size={16} /> }, { label: "Net Profit", value: fmtCurrency(netProfit, selectedCurrency), hint: netProfit >= 0 ? "Positive monthly margin" : "Needs expense review", icon: <TrendingUp size={16} /> }, { label: "Occupancy", value: fmtPct(occupancy), hint: `${bookedNights} nights booked`, icon: <Calendar size={16} /> }, { label: "Operations Health", value: `${operationsHealth}%`, hint: `${opsTotal} open operation flags`, icon: <ShieldCheck size={16} /> }].map((kpi) => <article key={kpi.label} className="dashboard-kpi-card card"><div className="dashboard-kpi-icon">{kpi.icon}</div><p>{kpi.label}</p><h3>{kpi.value}</h3><small>{kpi.hint}</small></article>)}
    </section>

    <section className="dashboard-main-grid">
      <article className="card dashboard-card dashboard-span-8">
        <div className="dashboard-card-header"><h3 className="dashboard-card-title">Upcoming Bookings</h3></div>
        <div className="dashboard-list">{upcoming.length === 0 ? <p className="dashboard-empty">No upcoming bookings for this filter.</p> : upcoming.map((b) => <div className="dashboard-list-item" key={b.booking_id}><div><strong>{b.guest_name || "Guest"}</strong><p>{properties.find((p) => p.property_id === b.property_id)?.property_name || "—"} · {fmtDateShort(b.checkin_date)} to {fmtDateShort(b.checkout_date)}</p></div><div><Chip tone={supplyChip(b.platform)}>{b.platform || "—"}</Chip><Chip tone={paymentStatusChip(b.payment_status)}>{b.payment_status || "—"}</Chip></div></div>)}</div>
      </article>

      <article className="card dashboard-card dashboard-span-4"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Operations Health</h3></div><div className="dashboard-health-score">{operationsHealth}%</div><div className="dashboard-list"><div className="dashboard-list-item"><span>Urgent maintenance</span><strong>{urgentMaintenance.length}</strong></div><div className="dashboard-list-item"><span>Low-stock items</span><strong>{lowStock.length}</strong></div><div className="dashboard-list-item"><span>Cleaning due</span><strong>{cleaningDue.length}</strong></div></div></article>

      <div className="dashboard-lower-grid dashboard-span-12">
        <article className="card dashboard-card dashboard-card--alerts dashboard-alert-card"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Alerts</h3></div><div className="dashboard-list">{alerts.length === 0 ? <p className="dashboard-empty">No urgent alerts. Operations are stable.</p> : alerts.map((a) => <button type="button" key={a.id} className="dashboard-list-item dashboard-alert-button" onClick={() => goToPage(a.page)}><span>{a.label}</span><Megaphone size={14} /></button>)}</div></article>

        <article className="card dashboard-card dashboard-card--profit"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Profit Breakdown</h3></div><div className="dashboard-stat-list"><div className="dashboard-stat-row"><span className="dashboard-stat-label">Gross Revenue</span><strong className="dashboard-stat-value">{fmtCurrency(grossRevenue, selectedCurrency)}</strong></div><div className="dashboard-stat-row"><span className="dashboard-stat-label">Expenses</span><strong className="dashboard-stat-value">{fmtCurrency(totalExpenses, selectedCurrency)}</strong></div><div className="dashboard-stat-row"><span className="dashboard-stat-label">Tax Reserve</span><strong className="dashboard-stat-value">{fmtCurrency(taxReserve, selectedCurrency)}</strong></div><div className="dashboard-stat-row"><span className="dashboard-stat-label">Management Fee</span><strong className="dashboard-stat-value">{fmtCurrency(managementFee, selectedCurrency)}</strong></div><div className="dashboard-stat-row"><span className="dashboard-stat-label">Net Profit</span><strong className="dashboard-stat-value">{fmtCurrency(netProfit, selectedCurrency)}</strong></div></div></article>

        <article className="card dashboard-card dashboard-card--snapshot"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Direct Booking Snapshot</h3></div><div className="dashboard-list"><div className="dashboard-list-item"><span>Direct revenue</span><strong>{fmtCurrency(directRevenue, selectedCurrency)}</strong></div><div className="dashboard-list-item"><span>Direct bookings</span><strong>{directBookings.length}</strong></div><div className="dashboard-list-item"><span>Tracked channels</span><strong>{DIRECT_CHANNELS.length}</strong></div></div></article>

        <article className="card dashboard-card dashboard-card--cleaning"><div className="dashboard-card-header"><h3 className="dashboard-card-title">Cleaning Due</h3></div><div className="dashboard-stat-list">{cleaningDue.length === 0 ? <p className="dashboard-empty">No cleaning tasks due right now.</p> : cleaningDue.slice(0, 5).map((item) => <div className="dashboard-cleaning-row" key={item.cleaning_id}><div className="dashboard-cleaning-label"><strong>{properties.find((p) => p.property_id === item.property_id)?.property_name || "—"}</strong><p>{fmtDateShort(item.cleaning_date)}</p></div><Chip tone={cleaningStatusChip(item.cleaning_status)}>{item.cleaning_status || "—"}</Chip></div>)}</div></article>

        <article className="card dashboard-card dashboard-card--revenue dashboard-chart-card">
            <div className="dashboard-card-header"><h3 className="dashboard-card-title">Revenue vs Expenses</h3></div>
            <div className="dashboard-mini-chart">
              <div><span>Gross Revenue</span><strong>{fmtCurrency(grossRevenue, selectedCurrency)}</strong></div>
              <div><span>Expenses</span><strong>{fmtCurrency(totalExpenses, selectedCurrency)}</strong></div>
              <div><span>Net Profit</span><strong>{fmtCurrency(netProfit, selectedCurrency)}</strong></div>
            </div>
          </article>
      </div>
    </section>
  </div>;
}
