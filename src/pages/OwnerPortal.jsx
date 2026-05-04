import { useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { fmtCurrency, bookingRevenueInMonth, bookingNightsInMonth, daysInMonth } from "../utils/helpers.js";
import { getAssignedPropertyIds, filterByAssignedProperties, canApproveMaintenance } from "../utils/propertyAccess.js";
import { resolveMemberships } from "../utils/membershipAdapter.js";

const toNum = (v) => Number(v) || 0;

export default function OwnerPortal() {
  const { profile } = useAuth();
  const memberships = resolveMemberships(profile);
  const role = profile?.role || "host";
  const assignedPropertyIds = getAssignedPropertyIds(memberships, role);
  const { properties = [], bookings = [], maintenance = [], cleaning = [], supplies = [], expenses = [], settings = {}, maintenanceApprovals = [], setMaintenanceApprovals } = useApp();
  const assignedProperties = filterByAssignedProperties(properties, assignedPropertyIds);
  const assignedBookings = filterByAssignedProperties(bookings, assignedPropertyIds);
  const assignedMaintenance = filterByAssignedProperties(maintenance, assignedPropertyIds);
  const assignedCleaning = filterByAssignedProperties(cleaning, assignedPropertyIds);
  const assignedSupplies = filterByAssignedProperties(supplies, assignedPropertyIds);
  const assignedExpenses = filterByAssignedProperties(expenses, assignedPropertyIds);
  const month = new Date().toISOString().slice(0, 7);

  const stats = useMemo(() => {
    const grossRevenue = assignedBookings.reduce((sum, b) => sum + bookingRevenueInMonth(b, month), 0);
    const expensesTotal = assignedExpenses.reduce((sum, e) => sum + toNum(e.amount), 0);
    const mgmtFee = grossRevenue * toNum(settings.management_fee_percentage);
    const taxReserve = grossRevenue * toNum(settings.tax_reserve_percentage);
    const estimatedPayout = grossRevenue - expensesTotal - mgmtFee - taxReserve;
    const bookedNights = assignedBookings.reduce((sum, b) => sum + bookingNightsInMonth(b, month), 0);
    const occupancy = assignedProperties.length ? (bookedNights / (daysInMonth(month) * assignedProperties.length)) * 100 : 0;
    const openMaintenance = assignedMaintenance.filter((m) => !["Completed", "Cancelled"].includes(m.status)).length;
    const completedCleaning = assignedCleaning.filter((c) => String(c.cleaning_status || "").toLowerCase() === "completed").length;
    const cleaningRate = assignedCleaning.length ? (completedCleaning / assignedCleaning.length) * 100 : 0;
    const lowStock = assignedSupplies.filter((s) => toNum(s.current_quantity) <= toNum(s.reorder_level)).length;
    const upcomingBookings = assignedBookings.filter((b) => b.checkin_date && new Date(b.checkin_date) >= new Date()).length;
    return { grossRevenue, estimatedPayout, occupancy, openMaintenance, cleaningRate, lowStock, upcomingBookings };
  }, [assignedBookings, assignedCleaning, assignedExpenses, assignedMaintenance, assignedProperties.length, assignedSupplies, month, settings.management_fee_percentage, settings.tax_reserve_percentage]);

  const setApproval = (issueId, decision) => {
    const next = [...(maintenanceApprovals || []).filter((a) => a.issue_id !== issueId), { issue_id: issueId, decision, decided_at: new Date().toISOString() }];
    setMaintenanceApprovals(next);
  };

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Owner Portal</h1><p className="page-subtitle">Assigned property health, metrics, reports, and approvals.</p></div>
      {assignedProperties.length === 0 ? <div className="card-sand" style={{ padding: 16 }}>No assigned properties yet.</div> : null}
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 16 }}>
        <div className="card-sand"><strong>Property Health Score</strong><div>{Math.max(0, 100 - stats.openMaintenance * 5 - stats.lowStock * 2).toFixed(0)}</div></div>
        <div className="card-sand"><strong>Gross Revenue</strong><div>{fmtCurrency(stats.grossRevenue, settings.default_currency || "JMD")}</div></div>
        <div className="card-sand"><strong>Estimated Owner Payout</strong><div>{fmtCurrency(stats.estimatedPayout, settings.default_currency || "JMD")}</div></div>
        <div className="card-sand"><strong>Occupancy Rate</strong><div>{stats.occupancy.toFixed(1)}%</div></div>
      </section>
      <section className="card-sand" style={{ padding: 16, marginBottom: 16 }}>
        <h3 className="section-title">Operational Snapshot</h3>
        <p>Upcoming bookings: {stats.upcomingBookings}</p>
        <p>Open maintenance: {stats.openMaintenance}</p>
        <p>Cleaning completion rate: {stats.cleaningRate.toFixed(1)}%</p>
        <p>Low-stock alerts: {stats.lowStock}</p>
      </section>
      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12 }}>
        <div className="card-sand" style={{ padding: 16 }}>
          <h3 className="section-title">Owner Report History</h3>
          <ul>{assignedProperties.map((p) => <li key={p.property_id}>{p.property_name || p.property_id} — {month}</li>)}</ul>
        </div>
        <div className="card-sand" style={{ padding: 16 }}>
          <h3 className="section-title">Maintenance Approval Items</h3>
          {assignedMaintenance.filter((m) => !["Completed", "Cancelled"].includes(m.status)).length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No approval items right now.</p>
          ) : assignedMaintenance.filter((m) => !["Completed", "Cancelled"].includes(m.status)).map((m) => (
            <div key={m.issue_id} style={{ borderTop: "1px solid var(--line)", paddingTop: 8, marginTop: 8 }}>
              <div>{m.issue_title || "Maintenance issue"}</div>
              <button className="btn" disabled={!canApproveMaintenance(memberships, m.property_id)} onClick={() => setApproval(m.issue_id, "approved")}>Approve</button>
              <button className="btn-ghost" disabled={!canApproveMaintenance(memberships, m.property_id)} onClick={() => setApproval(m.issue_id, "rejected")}>Reject</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
