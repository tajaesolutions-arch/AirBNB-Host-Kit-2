import { useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { uid, todayISO } from "../utils/helpers.js";
import { getAssignedPropertyIds, filterByAssignedProperties, canEditOperations } from "../utils/propertyAccess.js";
import { resolveMemberships } from "../utils/membershipAdapter.js";

export default function CleanerPortal() {
  const { profile } = useAuth();
  const memberships = resolveMemberships(profile);
  const role = profile?.role || "host";
  const assignedPropertyIds = getAssignedPropertyIds(memberships, role);
  const { cleaning = [], setCleaning, maintenance = [], setMaintenance } = useApp();
  const assignedCleaning = filterByAssignedProperties(cleaning, assignedPropertyIds);
  const today = todayISO();

  const buckets = useMemo(() => {
    const todayTasks = assignedCleaning.filter((t) => t.checkout_date === today);
    const upcomingTasks = assignedCleaning.filter((t) => t.checkout_date && t.checkout_date > today);
    const completedTasks = assignedCleaning.filter((t) => String(t.cleaning_status || "").toLowerCase() === "completed");
    const issueFoundTasks = assignedCleaning.filter((t) => String(t.damage_check || "").toLowerCase().includes("issue"));
    return { todayTasks, upcomingTasks, completedTasks, issueFoundTasks };
  }, [assignedCleaning, today]);

  const updateTask = (cleaningId, patch) => {
    setCleaning((prev) => prev.map((task) => {
      if (task.cleaning_id !== cleaningId) return task;
      if (!canEditOperations(memberships, task.property_id)) return task;
      const next = { ...task, ...patch };
      if (String(next.cleaning_status || "").toLowerCase() === "completed" && !next.time_completed) {
        next.time_completed = new Date().toISOString();
      }
      return next;
    }));
  };

  const createMaintenanceFromTask = (task) => {
    const issue = {
      issue_id: uid("iss"),
      property_id: task.property_id || "",
      issue_title: `Issue found during cleaning (${task.property_id || "Unknown property"})`,
      property_area: "",
      priority: "Medium",
      reported_by: "Cleaner",
      vendor: "",
      estimated_cost: 0,
      actual_cost: 0,
      status: "Open",
      reported_date: today,
      completion_date: "",
      photo_or_link: "",
      notes: task.notes || "",
    };
    setMaintenance([...(maintenance || []), issue]);
  };

  const renderTask = (task) => {
    const canEditTask = canEditOperations(memberships, task.property_id);
    return (
    <div key={task.cleaning_id} className="card-sand" style={{ padding: 14, marginBottom: 10 }}>
      {!canEditTask ? <div style={{ color: "var(--muted)", marginBottom: 8 }}>View only</div> : null}
      <strong>{task.property_id || "Unknown property"}</strong>
      <div style={{ fontSize: 13, color: "var(--muted)", marginBottom: 8 }}>Checkout: {task.checkout_date || "—"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
        <input value={task.cleaning_status || ""} disabled={!canEditTask} onChange={(e) => updateTask(task.cleaning_id, { cleaning_status: e.target.value })} aria-label="Cleaning status" placeholder="cleaning_status" />
        <input value={task.linen_status || ""} disabled={!canEditTask} onChange={(e) => updateTask(task.cleaning_id, { linen_status: e.target.value })} aria-label="Linen status" placeholder="linen_status" />
        <input value={task.damage_check || ""} disabled={!canEditTask} onChange={(e) => updateTask(task.cleaning_id, { damage_check: e.target.value })} aria-label="Damage check" placeholder="damage_check" />
        <label><input type="checkbox" checked={Boolean(task.supplies_restocked)} disabled={!canEditTask} onChange={(e) => updateTask(task.cleaning_id, { supplies_restocked: e.target.checked })} /> supplies_restocked</label>
        <label><input type="checkbox" checked={Boolean(task.photos_uploaded)} disabled={!canEditTask} onChange={(e) => updateTask(task.cleaning_id, { photos_uploaded: e.target.checked })} /> photos_uploaded</label>
        <input value={task.time_completed || ""} disabled={!canEditTask} onChange={(e) => updateTask(task.cleaning_id, { time_completed: e.target.value })} aria-label="Time completed" placeholder="time_completed" />
      </div>
      <textarea value={task.notes || ""} disabled={!canEditTask} onChange={(e) => updateTask(task.cleaning_id, { notes: e.target.value })} aria-label="Task notes" placeholder="notes" style={{ width: "100%", marginTop: 8 }} />
      {String(task.damage_check || "").toLowerCase().includes("issue") && canEditTask ? (
        <button type="button" className="btn" onClick={() => createMaintenanceFromTask(task)}>Create Maintenance Issue</button>
      ) : null}
    </div>
  );
  };

  return (
    <div className="page">
      <div className="page-header"><h1 className="page-title">Cleaner Portal</h1><p className="page-subtitle">Assigned cleaning tasks only.</p></div>
      <h3 className="section-title">Today's Tasks ({buckets.todayTasks.length})</h3>{buckets.todayTasks.map(renderTask)}
      <h3 className="section-title">Upcoming Tasks ({buckets.upcomingTasks.length})</h3>{buckets.upcomingTasks.map(renderTask)}
      <h3 className="section-title">Completed Tasks ({buckets.completedTasks.length})</h3>{buckets.completedTasks.map(renderTask)}
      <h3 className="section-title">Issue Found Tasks ({buckets.issueFoundTasks.length})</h3>{buckets.issueFoundTasks.map(renderTask)}
    </div>
  );
}
