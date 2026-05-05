import { useMemo } from "react";
import { CheckCircle2, DollarSign, TriangleAlert, Wrench } from "lucide-react";
import { Chip, MetricCard, PageHeader } from "../components/index.jsx";
import { useApp } from "../context/AppContext.jsx";
import { fmtCurrency, fmtDateShort } from "../utils/helpers.js";

const normalize = (value) => String(value || "").toLowerCase();
const monthISO = () => new Date().toISOString().slice(0, 7);
const isCompleted = (issue) => normalize(issue.status) === "completed";
const isInProgress = (issue) => ["in progress", "waiting on vendor", "scheduled"].includes(normalize(issue.status));

export default function MaintenanceDashboard({ propFilter = "ALL", setPage }) {
  const { maintenance = [], properties = [], settings = {} } = useApp();
  const currency = settings.default_currency || "JMD";
  const propertyName = (propertyId) => properties.find((property) => property.property_id === propertyId)?.property_name || propertyId || "Unassigned property";
  const selectedIssues = useMemo(() => maintenance.filter((issue) => propFilter === "ALL" || issue.property_id === propFilter), [maintenance, propFilter]);
  const month = monthISO();
  const activeIssues = selectedIssues.filter((issue) => !isCompleted(issue));
  const urgentIssues = activeIssues.filter((issue) => normalize(issue.priority) === "urgent");
  const inProgress = activeIssues.filter(isInProgress);
  const completedThisMonth = selectedIssues.filter((issue) => isCompleted(issue) && String(issue.completion_date || "").slice(0, 7) === month);
  const estimatedCost = activeIssues.reduce((sum, issue) => sum + Number(issue.estimated_cost || 0), 0);
  const actualCostMonth = selectedIssues.filter((issue) => String(issue.completion_date || issue.reported_date || "").slice(0, 7) === month).reduce((sum, issue) => sum + Number(issue.actual_cost || 0), 0);
  const prioritySummary = ["Urgent", "Medium", "Low"].map((priority) => ({ priority, count: activeIssues.filter((issue) => normalize(issue.priority) === normalize(priority)).length }));
  const statusSummary = [...new Set(activeIssues.map((issue) => issue.status || "Open"))].map((status) => ({ status, count: activeIssues.filter((issue) => (issue.status || "Open") === status).length }));

  return (
    <div className="dashboard-overview page">
      <PageHeader
        title="Maintenance Dashboard"
        subtitle="Track open issues, urgent repairs, vendor progress, and repair costs."
        actions={<button type="button" className="btn-secondary" onClick={() => setPage?.("maintenance")}><Wrench size={14} />Open Maintenance Tracker</button>}
      />

      <section className="dashboard-kpi-grid">
        <MetricCard label="Open issues" value={activeIssues.length} sub="Not completed" icon={Wrench} />
        <MetricCard label="Urgent issues" value={urgentIssues.length} sub="Needs priority" tone={urgentIssues.length ? "danger" : "default"} icon={TriangleAlert} />
        <MetricCard label="In-progress repairs" value={inProgress.length} sub="Vendor or repair active" icon={Wrench} />
        <MetricCard label="Completed this month" value={completedThisMonth.length} sub="Closed repairs" icon={CheckCircle2} />
      </section>

      <section className="dashboard-kpi-grid">
        <MetricCard label="Estimated repair cost" value={fmtCurrency(estimatedCost, currency)} sub="Open issue estimates" icon={DollarSign} />
        <MetricCard label="Actual repair cost this month" value={fmtCurrency(actualCostMonth, currency)} sub="Completed/recorded costs" icon={DollarSign} />
      </section>

      <section className="dashboard-content-grid">
        <article className="card dashboard-card dashboard-span-4">
          <div className="dashboard-card-header"><h3 className="dashboard-card-title">Issues by Priority</h3></div>
          <div className="dashboard-list">{prioritySummary.map((item) => <div className="dashboard-list-item" key={item.priority}><span>{item.priority}</span><strong>{item.count}</strong></div>)}</div>
        </article>
        <article className="card dashboard-card dashboard-span-4">
          <div className="dashboard-card-header"><h3 className="dashboard-card-title">Issues by Status</h3></div>
          <div className="dashboard-list">{statusSummary.length ? statusSummary.map((item) => <div className="dashboard-list-item" key={item.status}><span>{item.status}</span><strong>{item.count}</strong></div>) : <p className="dashboard-empty">No active issue statuses.</p>}</div>
        </article>
        <article className="card dashboard-card dashboard-span-12">
          <div className="dashboard-card-header"><h3 className="dashboard-card-title">Active Maintenance Issues</h3></div>
          <div className="dashboard-list">
            {activeIssues.length === 0 ? <p className="dashboard-empty">No active maintenance issues.</p> : activeIssues.map((issue) => (
              <div className="dashboard-list-item" key={issue.issue_id}>
                <div>
                  <strong>{issue.issue_title || issue.issue || "Maintenance issue"}</strong>
                  <p>{propertyName(issue.property_id)} · {issue.property_area || "Area not set"} · Reported {fmtDateShort(issue.reported_date)}</p>
                </div>
                <div className="row" style={{ gap: 6, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <Chip tone={normalize(issue.priority) === "urgent" ? "red" : "gray"}>{issue.priority || "Open"}</Chip>
                  <Chip tone={isInProgress(issue) ? "yellow" : "gray"}>{issue.status || "Open"}</Chip>
                  <strong>{fmtCurrency(Number(issue.estimated_cost || 0), currency)}</strong>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  );
}
