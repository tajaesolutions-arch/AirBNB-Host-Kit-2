import { useMemo } from "react";
import { Camera, CheckCircle2, Clock3, Sparkles, TriangleAlert } from "lucide-react";
import { Chip, MetricCard, PageHeader } from "../components/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import { cleaningStatusChip, fmtDateShort } from "../utils/helpers.js";

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthISO = () => new Date().toISOString().slice(0, 7);
const normalize = (value) => String(value || "").toLowerCase();

export default function CleanerDashboard({ propFilter = "ALL", setPage }) {
  const { cleaning = [], bookings = [], properties = [] } = useApp();
  const propertyName = (propertyId) => properties.find((property) => property.property_id === propertyId)?.property_name || propertyId || "Unassigned property";
  const selectedCleaning = useMemo(() => cleaning.filter((task) => propFilter === "ALL" || task.property_id === propFilter), [cleaning, propFilter]);
  const today = todayISO();
  const month = monthISO();
  const activeTasks = selectedCleaning.filter((task) => !["completed", "cancelled"].includes(normalize(task.cleaning_status)));
  const todayTasks = selectedCleaning.filter((task) => (task.checkout_date || task.cleaning_date || "").slice(0, 10) === today);
  const upcomingTurnovers = activeTasks.filter((task) => (task.checkout_date || task.next_checkin_date || "") >= today);
  const inProgress = selectedCleaning.filter((task) => ["in progress", "started"].includes(normalize(task.cleaning_status)));
  const completedThisMonth = selectedCleaning.filter((task) => normalize(task.cleaning_status) === "completed" && String(task.time_completed || task.checkout_date || "").slice(0, 7) === month);
  const missingPhotos = activeTasks.filter((task) => !task.photos_uploaded);
  const damageFound = selectedCleaning.filter((task) => !["", "clear", "not checked"].includes(normalize(task.damage_check)));
  const nextCheckout = upcomingTurnovers.slice().sort((a, b) => String(a.checkout_date || "").localeCompare(String(b.checkout_date || "")))[0];
  const taskRows = activeTasks.slice().sort((a, b) => String(a.checkout_date || "").localeCompare(String(b.checkout_date || ""))).slice(0, 8);

  return (
    <div className="dashboard-overview page">
      <PageHeader
        title="Cleaner Dashboard"
        subtitle="Focused cleaning assignments, turnovers, photo proof, and issue flags."
        actions={<button type="button" className="btn-secondary" onClick={() => setPage?.("cleaning")}><Sparkles size={14} />Open Cleaning Schedule</button>}
      />

      <section className="dashboard-kpi-grid">
        <MetricCard label="Today’s assigned cleanings" value={todayTasks.length} sub="Due today" icon={Clock3} />
        <MetricCard label="Upcoming turnovers" value={upcomingTurnovers.length} sub="Scheduled ahead" icon={Sparkles} />
        <MetricCard label="In-progress cleanings" value={inProgress.length} sub="Currently active" icon={Clock3} />
        <MetricCard label="Completed this month" value={completedThisMonth.length} sub="Finished tasks" icon={CheckCircle2} />
      </section>

      <section className="dashboard-content-grid">
        <article className="card dashboard-card dashboard-span-4">
          <div className="dashboard-card-header"><h3 className="dashboard-card-title">Quality Flags</h3></div>
          <div className="dashboard-list">
            <div className="dashboard-list-item"><span>Tasks missing photos</span><strong>{missingPhotos.length}</strong></div>
            <div className="dashboard-list-item"><span>Damage/issues found</span><strong>{damageFound.length}</strong></div>
          </div>
        </article>

        <article className="card dashboard-card dashboard-span-8">
          <div className="dashboard-card-header"><h3 className="dashboard-card-title">Next Checkout Requiring Cleaning</h3></div>
          {nextCheckout ? (
            <div className="dashboard-list-item">
              <div>
                <strong>{propertyName(nextCheckout.property_id)}</strong>
                <p>Checkout {fmtDateShort(nextCheckout.checkout_date)} · Next check-in {fmtDateShort(nextCheckout.next_checkin_date)}</p>
              </div>
              <Chip tone={cleaningStatusChip(nextCheckout.cleaning_status)}>{nextCheckout.cleaning_status || "Scheduled"}</Chip>
            </div>
          ) : <p className="dashboard-empty">No upcoming turnover is assigned for this filter.</p>}
        </article>

        <article className="card dashboard-card dashboard-span-12">
          <div className="dashboard-card-header"><h3 className="dashboard-card-title">Assigned Cleaning Tasks</h3></div>
          <div className="dashboard-list">
            {taskRows.length === 0 ? <p className="dashboard-empty">No active cleaning assignments.</p> : taskRows.map((task) => {
              const booking = bookings.find((item) => item.booking_id === task.booking_id);
              return (
                <div className="dashboard-list-item" key={task.cleaning_id}>
                  <div>
                    <strong>{propertyName(task.property_id)}</strong>
                    <p>{booking?.guest_name ? `${booking.guest_name} · ` : ""}Checkout {fmtDateShort(task.checkout_date)} · Cleaner {task.cleaner_name || "Unassigned"}</p>
                  </div>
                  <div className="row" style={{ gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {!task.photos_uploaded && <Chip tone="yellow" icon={Camera}>Photos needed</Chip>}
                    {damageFound.includes(task) && <Chip tone="red" icon={TriangleAlert}>Issue found</Chip>}
                    <Chip tone={cleaningStatusChip(task.cleaning_status)}>{task.cleaning_status || "Scheduled"}</Chip>
                  </div>
                </div>
              );
            })}
          </div>
        </article>
      </section>
    </div>
  );
}
