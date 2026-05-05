import { useMemo } from "react";
import { Camera, CheckCircle2, Clock3, Sparkles } from "lucide-react";
import { Chip, MetricCard, PageHeader } from "../../components/index.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import { cleaningStatusChip, fmtDateShort } from "../../utils/helpers.js";

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthISO = () => new Date().toISOString().slice(0, 7);
const normalize = (value) => String(value || "").toLowerCase();

export default function CleanerDashboard({ setPage }) {
  const { cleaning = [], properties = [] } = useApp();
  const { profile, loading, profileLoading } = useAuth();
  const assignedCleaner = (profile?.assigned_cleaner_name || "").trim();
  const propertyName = (propertyId) => properties.find((property) => property.property_id === propertyId)?.property_name || propertyId || "Unassigned property";

  const assignedTasks = useMemo(() => assignedCleaner ? cleaning.filter((task) => normalize(task.cleaner_name) === normalize(assignedCleaner)) : [], [cleaning, assignedCleaner]);
  const today = todayISO(); const month = monthISO();
  const activeTasks = assignedTasks.filter((task) => !["completed", "cancelled"].includes(normalize(task.cleaning_status)));
  const todayTasks = assignedTasks.filter((task) => (task.checkout_date || task.cleaning_date || "").slice(0, 10) === today);
  const overdueTasks = activeTasks.filter((task) => (task.checkout_date || task.cleaning_date || "") < today);
  const completedThisMonth = assignedTasks.filter((task) => normalize(task.cleaning_status) === "completed" && String(task.time_completed || task.checkout_date || "").slice(0, 7) === month);
  const missingPhotos = activeTasks.filter((task) => !task.photos_uploaded);

  if (loading || profileLoading) return <div className="page"><p className="dashboard-empty">Loading cleaner dashboard…</p></div>;
  if (!assignedCleaner) return <div className="page"><p className="dashboard-empty">No cleaning tasks assigned to your profile yet.</p></div>;

  return <div className="page role-dashboard-grid"><PageHeader title="Cleaner Dashboard" subtitle="Your assigned turnovers and cleaning readiness." actions={<button type="button" className="btn-secondary" onClick={() => setPage?.("cleaning")}><Sparkles size={14} />Open Cleaning Schedule</button>} />
    <section className="role-kpi-grid"> 
      <MetricCard label="Assigned Today" value={todayTasks.length} icon={Clock3} />
      <MetricCard label="Overdue" value={overdueTasks.length} icon={Clock3} tone={overdueTasks.length?"danger":"default"} />
      <MetricCard label="Completed This Month" value={completedThisMonth.length} icon={CheckCircle2} />
      <MetricCard label="Missing Photos" value={missingPhotos.length} icon={Camera} />
    </section>
    <article className="card role-dashboard-card"><h3>Assigned tasks</h3>
      <div className="table-wrap"><table className="table role-work-table"><thead><tr><th>Property</th><th>Checkout</th><th>Next Check-in</th><th>Status</th><th>Linen</th><th>Damage</th><th>Supplies</th><th>Photos</th></tr></thead><tbody>
      {assignedTasks.length===0?<tr><td colSpan="8">No assigned cleaning tasks found.</td></tr>:assignedTasks.map((task)=><tr key={task.cleaning_id}><td>{propertyName(task.property_id)}</td><td>{fmtDateShort(task.checkout_date)}</td><td>{fmtDateShort(task.next_checkin_date)}</td><td><Chip tone={cleaningStatusChip(task.cleaning_status)}>{task.cleaning_status||"Scheduled"}</Chip></td><td>{task.linen_status||"—"}</td><td>{task.damage_check||"—"}</td><td>{task.supply_restock_status||"—"}</td><td>{task.photos_uploaded?"Uploaded":"Missing"}</td></tr>)}
      </tbody></table></div></article></div>;
}
