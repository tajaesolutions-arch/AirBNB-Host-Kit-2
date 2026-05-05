import { useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { todayISO, fmtDateShort } from "../utils/helpers.js";

export default function CleanerPortal() {
  const { cleaning = [] } = useApp();
  const { user, profile } = useAuth();
  const myUserId = user?.id;
  const fallbackName = profile?.display_name || profile?.host_name || String(user?.email || "").split("@")[0];
  const today = todayISO();

  const myTasks = useMemo(
    () =>
      cleaning.filter(
        (t) =>
          (t?.assigned_to_user_id && t.assigned_to_user_id === myUserId) ||
          (!t?.assigned_to_user_id && fallbackName && t?.cleaner_name === fallbackName)
      ),
    [cleaning, myUserId, fallbackName]
  );
  const dueToday = myTasks.filter((t) => t.checkout_date === today);
  const upcoming = myTasks.filter((t) => t.checkout_date && t.checkout_date > today);
  const completedThisWeek = myTasks.filter((t) => String(t.cleaning_status || "").toLowerCase() === "completed");
  const inProgress = myTasks.filter((t) => String(t.cleaning_status || "").toLowerCase() === "in progress");
  const issuesFound = myTasks.filter((t) => String(t.damage_check || "").toLowerCase().includes("damage") || String(t.notes || "").toLowerCase().includes("issue"));

  return (
    <div className="page" style={{ background: "#f8f8f6" }}>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Track your assigned cleaning tasks, upcoming turnovers, and completed work.</p>
      </div>
      <div className="page-kpi-grid">
        <div className="metric-card"><div className="metric-label">Assigned Tasks</div><div className="metric-value">{myTasks.length}</div></div>
        <div className="metric-card"><div className="metric-label">Due Today</div><div className="metric-value">{dueToday.length}</div></div>
        <div className="metric-card"><div className="metric-label">Upcoming Tasks</div><div className="metric-value">{upcoming.length}</div></div>
        <div className="metric-card"><div className="metric-label">Completed This Week</div><div className="metric-value">{completedThisWeek.length}</div></div>
        <div className="metric-card"><div className="metric-label">In Progress</div><div className="metric-value">{inProgress.length}</div></div>
        <div className="metric-card"><div className="metric-label">Issues Found</div><div className="metric-value">{issuesFound.length}</div></div>
      </div>

      <div className="card" style={{ borderRadius: 16, border: "1px solid #e5e7eb", boxShadow: "var(--shadow-sm)" }}>
        <h3 className="section-title">Today's Assigned Tasks</h3>
        {dueToday.length === 0 ? <p>No tasks assigned yet. Your assigned cleaning tasks will appear here once your host or property manager assigns work to you.</p> : dueToday.map((task) => <div key={task.cleaning_id} style={{ padding: 10, borderTop: "1px solid #eee" }}><strong>{task.property_id || "Property"}</strong> • {fmtDateShort(task.checkout_date)} • {task.cleaning_status || "Scheduled"}</div>)}
      </div>
    </div>
  );
}
