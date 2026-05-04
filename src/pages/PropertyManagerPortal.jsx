import { useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { fmtCurrency, bookingRevenueInMonth, bookingNightsInMonth, daysInMonth } from "../utils/helpers.js";
import { getAssignedPropertyIds, filterByAssignedProperties, canViewFinancials } from "../utils/propertyAccess.js";
import { resolveMemberships } from "../utils/membershipAdapter.js";

const toNum = (v) => Number(v) || 0;
const isOpenMaintenance = (m) => !["Completed", "Cancelled"].includes(m?.status);

export default function PropertyManagerPortal() {
  const { profile } = useAuth();
  const memberships = resolveMemberships(profile);
  const role = profile?.role || "host";
  const assignedPropertyIds = getAssignedPropertyIds(memberships, role);
  const { properties = [], bookings = [], cleaning = [], maintenance = [], supplies = [], expenses = [], settings = {} } = useApp();
  const assignedProperties = filterByAssignedProperties(properties, assignedPropertyIds);
  const assignedBookings = filterByAssignedProperties(bookings, assignedPropertyIds);
  const assignedCleaning = filterByAssignedProperties(cleaning, assignedPropertyIds);
  const assignedMaintenance = filterByAssignedProperties(maintenance, assignedPropertyIds);
  const assignedSupplies = filterByAssignedProperties(supplies, assignedPropertyIds);
  const assignedExpenses = filterByAssignedProperties(expenses, assignedPropertyIds);
  const financialAccess = assignedProperties.some((p) => canViewFinancials(memberships, p.property_id));
  const month = new Date().toISOString().slice(0, 7);

  const metrics = useMemo(() => {
    const grossRevenue = assignedBookings.reduce((sum, b) => sum + bookingRevenueInMonth(b, month), 0);
    const bookedNights = assignedBookings.reduce((sum, b) => sum + bookingNightsInMonth(b, month), 0);
    const occupancyRate = daysInMonth(month) > 0 && assignedProperties.length > 0 ? (bookedNights / (daysInMonth(month) * assignedProperties.length)) * 100 : 0;
    const expenseTotal = assignedExpenses.reduce((sum, e) => sum + toNum(e.amount), 0);
    const openMaintenance = assignedMaintenance.filter(isOpenMaintenance).length;
    const upcomingCheckins = assignedBookings.filter((b) => b.checkin_date && new Date(b.checkin_date) >= new Date()).length;
    const completedCleaning = assignedCleaning.filter((task) => String(task.cleaning_status || "").toLowerCase() === "completed").length;
    const cleaningCompletionRate = assignedCleaning.length ? (completedCleaning / assignedCleaning.length) * 100 : 0;
    const lowStockItems = assignedSupplies.filter((s) => toNum(s.current_quantity) <= toNum(s.reorder_level)).length;
    return { grossRevenue, netProfit: grossRevenue - expenseTotal, occupancyRate, openMaintenance, upcomingCheckins, cleaningCompletionRate, lowStockItems };
  }, [assignedBookings, assignedCleaning, assignedExpenses, assignedMaintenance, assignedProperties.length, assignedSupplies, month]);

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Property Manager Portal</h1><p className="page-subtitle">Assigned-property analytics and operations.</p></div>
      {assignedProperties.length === 0 ? <div className="card-sand" style={{ padding: 16 }}>No assigned properties yet.</div> : null}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div className="card-sand"><strong>Gross Revenue</strong><div>{fmtCurrency(metrics.grossRevenue, settings.default_currency || "JMD")}</div></div>
        <div className="card-sand"><strong>Occupancy Rate</strong><div>{metrics.occupancyRate.toFixed(1)}%</div></div>
        <div className="card-sand"><strong>Upcoming Check-ins</strong><div>{metrics.upcomingCheckins}</div></div>
        <div className="card-sand"><strong>Open Maintenance</strong><div>{metrics.openMaintenance}</div></div>
      </section>
      <section className="card-sand" style={{ padding: 16, marginBottom: 16 }}>
        <h3 className="section-title">Operations Snapshot</h3>
        <p>Cleaning completion rate: {metrics.cleaningCompletionRate.toFixed(1)}%</p>
        <p>Low-stock items: {metrics.lowStockItems}</p>
        <p>Net profit: {financialAccess ? fmtCurrency(metrics.netProfit, settings.default_currency || "JMD") : "Hidden"}</p>
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <div className="card-sand" style={{ padding: 16 }}>
          <h3 className="section-title">Assigned Properties</h3>
          <table className="table"><thead><tr><th>Property</th><th>Town</th><th>Type</th></tr></thead><tbody>{assignedProperties.map((p) => <tr key={p.property_id}><td>{p.property_name || p.property_id}</td><td>{p.parish_town || "—"}</td><td>{p.property_type || "—"}</td></tr>)}</tbody></table>
        </div>
        <div className="card-sand" style={{ padding: 16 }}>
          <h3 className="section-title">Upcoming Cleaning & Maintenance</h3>
          <table className="table"><thead><tr><th>Type</th><th>Property</th><th>Date / Status</th></tr></thead><tbody>
            {assignedCleaning.slice(0, 5).map((t) => <tr key={`c-${t.cleaning_id}`}><td>Cleaning</td><td>{t.property_id}</td><td>{t.checkout_date || "—"}</td></tr>)}
            {assignedMaintenance.filter(isOpenMaintenance).slice(0, 5).map((m) => <tr key={`m-${m.issue_id}`}><td>Maintenance</td><td>{m.property_id}</td><td>{m.status || "Open"}</td></tr>)}
          </tbody></table>
        </div>
      </section>
    </div>
  );
}
