import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { Chip, PageHeader } from "../components/index.jsx";
import {
  bookingTotal,
  calcNights,
  fmtCurrency,
  fmtPct,
  fmtDateShort,
  isDirectPlatform,
  supplyStatus,
  inSelectedMonth,
  daysInMonth,
  bookingStatusChip,
  paymentStatusChip,
  cleaningStatusChip,
  supplyChip,
  normalizeCurrency,
} from "../utils/helpers.js";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Bell,
  Package,
  Wrench,
  Sparkles,
  Home,
  Database,
  ArrowRight,
  CheckCircle2,
  PlusCircle,
  Users,
  ReceiptText,
  Circle,
  ChevronDown,
  ChevronUp,
  Download,
  Wallet,
} from "lucide-react";

const SETUP_PROGRESS_STORAGE_KEY = "jak_dashboard_setup_progress";
const SETUP_CHECKLIST_OPEN_STORAGE_KEY = "jak_setup_checklist_open";
const safeArray = (value) => (Array.isArray(value) ? value : []);
const safeSettings = (value) => (value && typeof value === "object" ? value : {});

const parseDateSafe = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

// ...reuse existing setup helpers unchanged behavior
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

function MiniBarChart({ data = [] }) { const max = Math.max(1, ...data.map((d) => Math.max(d.revenue || 0, d.expense || 0))); return <div className="dashboard-chart-svg">{data.map((d) => <div key={d.label} className="dashboard-bar"><span className="bar-rev" style={{ height: `${((d.revenue || 0) / max) * 100}%` }} /><span className="bar-exp" style={{ height: `${((d.expense || 0) / max) * 100}%` }} /><small>{d.label}</small></div>)}</div>; }
function CircularStat({ value = 0, label }) { const pct = Math.max(0, Math.min(100, Math.round(value * 100))); return <div className="dashboard-progress-ring"><div className="ring-inner"><strong>{pct}%</strong><span>{label}</span></div></div>; }
function HorizontalBarList({ items = [] }) { const max = Math.max(1, ...items.map((i) => i.value || 0)); return <div>{items.map((item) => <div key={item.label} className="hbar-row"><div className="hbar-head"><span>{item.label}</span><strong>{item.formatted}</strong></div><div className="hbar-track"><div className="hbar-fill" style={{ width: `${((item.value || 0) / max) * 100}%` }} /></div></div>)}</div>; }

function SetupProgressCard({ checklist, onGoToPage, onMarkComplete, onMarkSkipped }) {
  const [isOpen, setIsOpen] = useState(() => localStorage.getItem(SETUP_CHECKLIST_OPEN_STORAGE_KEY) !== "false");
  const completedCount = checklist.filter((item) => item.completed).length; const percent = checklist.length ? Math.round((completedCount / checklist.length) * 100) : 0;
  if (percent === 100) return null;
  const toggle = () => setIsOpen((p) => { const n = !p; localStorage.setItem(SETUP_CHECKLIST_OPEN_STORAGE_KEY, String(n)); return n; });
  return <div className="dashboard-panel dashboard-setup-card"><div className="setup-head"><h3>Setup Checklist</h3><button className="btn-ghost" onClick={toggle}>{isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}</button></div><div className="setup-bar"><div className="setup-fill" style={{ width: `${percent}%` }} /></div>{isOpen && checklist.map((item) => <div key={item.id} className="setup-item"><div>{item.completed ? <CheckCircle2 size={14} /> : <Circle size={14} />}</div><span>{item.title}</span><div>{!item.completed && item.canManuallyComplete && <button className="btn-ghost setup-mini-btn" onClick={() => onMarkComplete(item.id)}>Done</button>}{!item.completed && item.canManuallyComplete && <button className="btn-ghost setup-mini-btn" onClick={() => onMarkSkipped(item.id)}>Skip</button>}<button className="btn-ghost setup-mini-btn" onClick={() => onGoToPage(item.page)}>{item.action}</button></div></div>)}</div>;
}

export default function Dashboard({ setPage, monthFilter, setMonthFilter, propFilter, setPropFilter }) {
  const app = useApp();
  const bookings = safeArray(app.bookings); const expenses = safeArray(app.expenses); const maintenance = safeArray(app.maintenance); const supplies = safeArray(app.supplies); const cleaning = safeArray(app.cleaning); const properties = safeArray(app.properties); const guests = safeArray(app.guests); const leads = safeArray(app.leads); const settings = safeSettings(app.settings);
  const [savedSetupProgress, setSavedSetupProgress] = useState(() => loadSetupProgress());
  const goToPage = (p) => typeof setPage === "function" && setPage(p);
  const selectedMonth = monthFilter || new Date().toISOString().slice(0, 7);
  const selectedPropFilter = !propFilter || propFilter === "all" ? "ALL" : propFilter;
  const filterByProp = (arr, key = "property_id") => selectedPropFilter === "ALL" ? arr : arr.filter((x) => x?.[key] === selectedPropFilter || !x?.[key]);
  const activeBookings = filterByProp(bookings).filter((b) => b?.booking_status !== "Cancelled");
  const monthBookings = activeBookings.filter((b) => inSelectedMonth(b?.checkin_date, selectedMonth) || inSelectedMonth(b?.checkout_date, selectedMonth));
  const monthExpenses = filterByProp(expenses).filter((e) => inSelectedMonth(e?.expense_date, selectedMonth));
  const selectedCurrency = normalizeCurrency(settings.default_currency || "JMD");
  const grossRevenue = monthBookings.reduce((s, b) => s + bookingTotal(b), 0);
  const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e?.amount || 0), 0);
  const managementFee = grossRevenue * Number(settings.management_fee_percentage || 0);
  const taxReserve = grossRevenue * Number(settings.tax_reserve_percentage || 0);
  const netProfit = grossRevenue - totalExpenses - managementFee - taxReserve;
  const bookedNights = monthBookings.reduce((s, b) => s + calcNights(b?.checkin_date, b?.checkout_date), 0);
  const occupancy = bookedNights / Math.max(1, daysInMonth(selectedMonth) * Math.max(1, selectedPropFilter === "ALL" ? properties.length : 1));
  const today = new Date(); today.setHours(0,0,0,0);
  const upcomingCheckins = activeBookings.filter((b) => { const d = parseDateSafe(b?.checkin_date); return d && d >= today; }).sort((a,b)=>parseDateSafe(a.checkin_date)-parseDateSafe(b.checkin_date)).slice(0,5);
  const unpaidCount = activeBookings.filter((b) => ["Unpaid", "Partial"].includes(b?.payment_status)).length;
  const lowStock = filterByProp(supplies).filter((s) => Number(s?.current_quantity) <= Number(s?.reorder_level));
  const cleaningDue = filterByProp(cleaning).filter((c) => ["Scheduled", "In Progress"].includes(c?.cleaning_status));
  const openMaintenance = filterByProp(maintenance).filter((m) => !["Completed", "Cancelled"].includes(m?.status));
  const checklist = useMemo(() => getSetupChecklist({ properties, bookings, expenses, supplies, cleaning, maintenance, settings, savedProgress: savedSetupProgress }), [properties, bookings, expenses, supplies, cleaning, maintenance, settings, savedSetupProgress]);

  if (!properties.length) {
    return <div className="page"><PageHeader title="Welcome to your Host Operations Kit" subtitle="Start with your first property or load sample data." actions={<><button className="btn-secondary" onClick={() => app.restoreSampleData?.()}><Database size={14}/>Restore Demo Data</button><button className="btn-primary" onClick={() => goToPage("settings")}><PlusCircle size={14}/>Add First Property</button></>} /></div>;
  }

  const weekly = [1,2,3,4,5].map((w)=>{ const from=(w-1)*7+1; const to=Math.min(w*7,31); const wb=monthBookings.filter((b)=>{ const d=parseDateSafe(b.checkin_date); return d && d.getDate()>=from && d.getDate()<=to;}); const we=monthExpenses.filter((e)=>{const d=parseDateSafe(e.expense_date); return d && d.getDate()>=from && d.getDate()<=to;}); return {label:`W${w}`,revenue:wb.reduce((s,b)=>s+bookingTotal(b),0),expense:we.reduce((s,e)=>s+Number(e.amount||0),0)};});
  const recent = [...monthBookings].sort((a,b)=>(parseDateSafe(b.checkin_date)?.getTime()||0)-(parseDateSafe(a.checkin_date)?.getTime()||0)).slice(0,6);
  const getProp = (id) => properties.find((p) => p.property_id === id)?.property_name || "—";

  return <div className="page dashboard-shell">
    <div className="dashboard-header"><div><h1>Dashboard</h1><p>{selectedMonth} · {selectedPropFilter === "ALL" ? "All Properties" : getProp(selectedPropFilter)}</p></div><div className="dashboard-actions"><label className="dashboard-filter-inline">Property<select value={selectedPropFilter} onChange={(e)=>setPropFilter?.(e.target.value)}><option value="ALL">All</option>{properties.map((p)=><option key={p.property_id} value={p.property_id}>{p.property_name||"Unnamed"}</option>)}</select></label><label className="dashboard-filter-inline">Month<input type="month" value={selectedMonth} onChange={(e)=>setMonthFilter?.(e.target.value)} /></label><button className="btn-secondary" onClick={()=>goToPage("bookings")}><PlusCircle size={14}/>Add Booking</button><button className="btn-secondary" onClick={()=>goToPage("revenue")}><ReceiptText size={14}/>Add Expense</button><button className="btn-secondary" onClick={()=>goToPage("settings")}><Download size={14}/>Backup / Export</button></div></div>
    <div className="dashboard-kpi-grid">
      <div className="dashboard-kpi-card"><DollarSign size={16}/><label>Gross Revenue</label><h3>{fmtCurrency(grossRevenue, selectedCurrency)}</h3><small>{monthBookings.length} bookings</small></div>
      <div className="dashboard-kpi-card"><TrendingUp size={16}/><label>Net Profit</label><h3>{fmtCurrency(netProfit, selectedCurrency)}</h3><small>{netProfit>=0?"Profitable":"Negative margin"}</small></div>
      <div className="dashboard-kpi-card"><Calendar size={16}/><label>Occupancy Rate</label><h3>{fmtPct(occupancy)}</h3><small>{bookedNights} nights booked</small></div>
      <div className="dashboard-kpi-card"><Wallet size={16}/><label>Upcoming Check-ins</label><h3>{upcomingCheckins.length}</h3><small>Next 14+ days queue</small></div>
    </div>
    <div className="dashboard-main-grid">
      <div className="dashboard-left-stack">
        <div className="dashboard-panel dashboard-chart-card"><h3>Monthly Revenue vs Expenses</h3><MiniBarChart data={weekly} /></div>
        <div className="dashboard-panel"><div className="panel-head"><h3>Recent Bookings</h3><button className="btn-ghost" onClick={()=>goToPage("bookings")}>View All</button></div><table className="dashboard-mini-table"><thead><tr><th>Guest</th><th>Property</th><th>Platform</th><th>Dates</th><th>Status</th><th>Total</th></tr></thead><tbody>{recent.map((b)=><tr key={b.booking_id}><td>{b.guest_name||"—"}</td><td>{getProp(b.property_id)}</td><td>{b.platform||"—"}</td><td>{fmtDateShort(b.checkin_date)} - {fmtDateShort(b.checkout_date)}</td><td><Chip tone={bookingStatusChip(b.booking_status)}>{b.booking_status||"—"}</Chip> <Chip tone={paymentStatusChip(b.payment_status)}>{b.payment_status||"—"}</Chip></td><td>{fmtCurrency(bookingTotal(b),selectedCurrency)}</td></tr>)}</tbody></table></div>
        <div className="dashboard-panel"><h3>Revenue Breakdown</h3><HorizontalBarList items={[{label:"Booking Revenue",value:grossRevenue,formatted:fmtCurrency(grossRevenue,selectedCurrency)},{label:"Expenses",value:totalExpenses,formatted:fmtCurrency(totalExpenses,selectedCurrency)},{label:"Tax Reserve",value:taxReserve,formatted:fmtCurrency(taxReserve,selectedCurrency)},{label:"Management Fee",value:managementFee,formatted:fmtCurrency(managementFee,selectedCurrency)},{label:"Net Profit",value:Math.max(0,netProfit),formatted:fmtCurrency(netProfit,selectedCurrency)}]} /></div>
      </div>
      <div className="dashboard-side-stack">
        <SetupProgressCard checklist={checklist} onGoToPage={goToPage} onMarkComplete={(id)=>setSavedSetupProgress((p)=>{const n={...p,[id]:{done:true,skipped:false}}; saveSetupProgress(n); return n;})} onMarkSkipped={(id)=>setSavedSetupProgress((p)=>{const n={...p,[id]:{done:false,skipped:true}}; saveSetupProgress(n); return n;})} />
        <div className="dashboard-panel"><h3>Operations Alerts</h3><div className="dashboard-alert-card" onClick={()=>goToPage("supplies")}><Package size={14}/>Low stock supplies <strong>{lowStock.length}</strong></div><div className="dashboard-alert-card" onClick={()=>goToPage("cleaning")}><Sparkles size={14}/>Scheduled cleaning <strong>{cleaningDue.length}</strong></div><div className="dashboard-alert-card" onClick={()=>goToPage("maintenance")}><Wrench size={14}/>Open maintenance <strong>{openMaintenance.length}</strong></div><div className="dashboard-alert-card" onClick={()=>goToPage("bookings")}><Bell size={14}/>Unpaid / partial bookings <strong>{unpaidCount}</strong></div></div>
        <div className="dashboard-panel"><h3>Upcoming Activity</h3><div className="dashboard-activity-list">{upcomingCheckins.slice(0,4).map((b)=><div key={b.booking_id}><span>{fmtDateShort(b.checkin_date)} · {b.guest_name||"Guest"}</span><Chip tone={bookingStatusChip(b.booking_status)}>{b.booking_status||"-"}</Chip></div>)}</div></div>
        <div className="dashboard-panel"><h3>Guest / Direct Snapshot</h3><p>Total guests: <strong>{guests.length}</strong></p><p>Direct booking %: <strong>{fmtPct(monthBookings.length ? monthBookings.filter((b)=>isDirectPlatform(b.platform)).length / monthBookings.length : 0)}</strong></p><p>Direct leads: <strong>{leads.filter((l)=>isDirectPlatform(l?.source || "")).length}</strong></p><CircularStat value={occupancy} label="Occupancy" /></div>
      </div>
    </div>
  </div>;
}
