import { useMemo } from "react";
import { BarChart3, CalendarDays, FileText, HeartPulse, Wrench } from "lucide-react";
import { Chip, MetricCard, PageHeader } from "../components/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import { bookingRevenueInMonth, cleaningStatusChip, fmtCurrency, fmtDateShort } from "../utils/helpers.js";

const currentMonth = () => new Date().toISOString().slice(0, 7);
const normalize = (value) => String(value || "").toLowerCase();

export default function OwnerDashboard({ monthFilter = currentMonth(), propFilter = "ALL", setPage }) {
  const { bookings = [], cleaning = [], maintenance = [], expenses = [], properties = [], settings = {} } = useApp();
  const currency = settings.default_currency || "JMD";
  const propertyName = (propertyId) => properties.find((property) => property.property_id === propertyId)?.property_name || propertyId || "Selected property";
  const filterByProperty = (items) => items.filter((item) => propFilter === "ALL" || item.property_id === propFilter);
  const selectedBookings = filterByProperty(bookings);
  const selectedCleaning = filterByProperty(cleaning);
  const selectedMaintenance = filterByProperty(maintenance);
  const selectedExpenses = filterByProperty(expenses);
  const monthlyBookings = selectedBookings.filter((booking) => String(booking.checkin_date || booking.checkout_date || "").slice(0, 7) === monthFilter || bookingRevenueInMonth(booking, monthFilter) > 0);
  const monthlyRevenue = monthlyBookings.reduce((sum, booking) => sum + bookingRevenueInMonth(booking, monthFilter), 0);
  const monthlyExpenses = selectedExpenses.filter((expense) => String(expense.expense_date || "").slice(0, 7) === monthFilter).reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const openMaintenance = selectedMaintenance.filter((issue) => normalize(issue.status) !== "completed");
  const recentCleaning = selectedCleaning.slice().sort((a, b) => String(b.time_completed || b.checkout_date || "").localeCompare(String(a.time_completed || a.checkout_date || ""))).slice(0, 4);
  const upcomingBookings = selectedBookings.filter((booking) => String(booking.checkin_date || "") >= new Date().toISOString().slice(0, 10)).sort((a, b) => String(a.checkin_date || "").localeCompare(String(b.checkin_date || ""))).slice(0, 5);
  const healthScore = Math.max(0, Math.min(100, 100 - openMaintenance.length * 10 - selectedCleaning.filter((task) => !task.photos_uploaded && normalize(task.cleaning_status) !== "completed").length * 5));

  return (
    <div className="dashboard-overview page">
      <PageHeader
        title="Owner Dashboard"
        subtitle="Owner-focused revenue, property health, upcoming stays, and operating status."
        actions={<button type="button" className="btn-secondary" onClick={() => setPage?.("owner")}><FileText size={14} />Open Owner Report</button>}
      />

      <section className="dashboard-kpi-grid">
        <MetricCard label="Property health score" value={`${healthScore}%`} sub="Based on open ops flags" icon={HeartPulse} />
        <MetricCard label="Monthly gross revenue" value={fmtCurrency(monthlyRevenue, currency)} sub={monthFilter} icon={BarChart3} />
        <MetricCard label="Monthly expenses" value={fmtCurrency(monthlyExpenses, currency)} sub="Recorded expenses" icon={BarChart3} />
        <MetricCard label="Net owner summary" value={fmtCurrency(monthlyRevenue - monthlyExpenses, currency)} sub="Gross less expenses" icon={FileText} />
      </section>

      <section className="dashboard-content-grid">
        <article className="card dashboard-card dashboard-span-8">
          <div className="dashboard-card-header"><h3 className="dashboard-card-title">Upcoming Bookings</h3></div>
          <div className="dashboard-list">
            {upcomingBookings.length === 0 ? <p className="dashboard-empty">No upcoming bookings for this view.</p> : upcomingBookings.map((booking) => (
              <div className="dashboard-list-item" key={booking.booking_id}>
                <div><strong>{booking.guest_name || "Guest"}</strong><p>{propertyName(booking.property_id)} · {fmtDateShort(booking.checkin_date)} to {fmtDateShort(booking.checkout_date)}</p></div>
                <Chip tone="green">{fmtCurrency(bookingRevenueInMonth(booking, monthFilter), currency)}</Chip>
              </div>
            ))}
          </div>
        </article>
        <article className="card dashboard-card dashboard-span-4">
          <div className="dashboard-card-header"><h3 className="dashboard-card-title">Open Maintenance</h3></div>
          <div className="dashboard-list">
            <div className="dashboard-list-item"><span>Open issues</span><strong>{openMaintenance.length}</strong></div>
            <div className="dashboard-list-item"><span>Urgent issues</span><strong>{openMaintenance.filter((issue) => normalize(issue.priority) === "urgent").length}</strong></div>
            <button type="button" className="btn-secondary" onClick={() => setPage?.("maintenance")}><Wrench size={14} />View maintenance</button>
          </div>
        </article>
        <article className="card dashboard-card dashboard-span-12">
          <div className="dashboard-card-header"><h3 className="dashboard-card-title">Recent Cleaning Completion Status</h3></div>
          <div className="dashboard-list">
            {recentCleaning.length === 0 ? <p className="dashboard-empty">No recent cleaning records.</p> : recentCleaning.map((task) => (
              <div className="dashboard-list-item" key={task.cleaning_id}>
                <div><strong>{propertyName(task.property_id)}</strong><p>Checkout {fmtDateShort(task.checkout_date)} · Cleaner {task.cleaner_name || "Unassigned"}</p></div>
                <Chip tone={cleaningStatusChip(task.cleaning_status)}>{task.cleaning_status || "Scheduled"}</Chip>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
