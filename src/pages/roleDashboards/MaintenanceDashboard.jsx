import { useMemo } from "react";
import { CheckCircle2, DollarSign, TriangleAlert, Wrench } from "lucide-react";
import { Chip, MetricCard, PageHeader } from "../../components/index.jsx";
import { useApp } from "../../context/AppContext.jsx";
import { useAuth } from "../../auth/AuthContext.jsx";
import { fmtCurrency, fmtDateShort } from "../../utils/helpers.js";

const normalize = (value) => String(value || "").toLowerCase();
const monthISO = () => new Date().toISOString().slice(0, 7);

export default function MaintenanceDashboard({ setPage }) {
  const { maintenance = [], properties = [], settings = {} } = useApp();
  const { profile, loading, profileLoading } = useAuth();
  const assignedVendor = (profile?.assigned_vendor_name || "").trim();
  const currency = settings.default_currency || "JMD";
  const propertyName = (propertyId) => properties.find((property) => property.property_id === propertyId)?.property_name || propertyId || "Unassigned property";
  const assignedIssues = useMemo(() => assignedVendor ? maintenance.filter((issue) => normalize(issue.vendor) === normalize(assignedVendor)) : [], [maintenance, assignedVendor]);
  const month = monthISO();
  const openIssues = assignedIssues.filter((i) => normalize(i.status) !== "completed");
  const urgent = openIssues.filter((i) => ["urgent","high"].includes(normalize(i.priority)));
  const inProgress = openIssues.filter((i) => ["in progress","scheduled"].includes(normalize(i.status)));
  const completedMonth = assignedIssues.filter((i) => normalize(i.status)==="completed" && String(i.completion_date||"").slice(0,7)===month);
  const est = openIssues.reduce((s,i)=>s+Number(i.estimated_cost||0),0);
  const act = assignedIssues.reduce((s,i)=>s+Number(i.actual_cost||0),0);

  if (loading || profileLoading) return <div className="page"><p className="dashboard-empty">Loading maintenance dashboard…</p></div>;
  if (!assignedVendor) return <div className="page"><p className="dashboard-empty">No maintenance work orders assigned to your profile yet.</p></div>;

  return <div className="page role-dashboard-grid"><PageHeader title="Maintenance Dashboard" subtitle="Your assigned work orders and cost visibility." actions={<button type="button" className="btn-secondary" onClick={() => setPage?.("maintenance")}><Wrench size={14} />Open Maintenance Tracker</button>} />
    <section className="role-kpi-grid"><MetricCard label="Open Work Orders" value={openIssues.length} icon={Wrench} /><MetricCard label="Urgent Issues" value={urgent.length} tone={urgent.length?"danger":"default"} icon={TriangleAlert} /><MetricCard label="In Progress" value={inProgress.length} icon={Wrench} /><MetricCard label="Completed This Month" value={completedMonth.length} icon={CheckCircle2} /></section>
    <section className="role-kpi-grid"><MetricCard label="Estimated Cost" value={fmtCurrency(est,currency)} icon={DollarSign} /><MetricCard label="Actual Cost" value={fmtCurrency(act,currency)} icon={DollarSign} /></section>
    <article className="card role-dashboard-card"><h3>Assigned work orders</h3><div className="table-wrap"><table className="table role-work-table"><thead><tr><th>Issue</th><th>Property</th><th>Area</th><th>Priority</th><th>Status</th><th>Vendor</th><th>Estimated</th><th>Actual</th><th>Reported</th></tr></thead><tbody>
    {assignedIssues.length===0?<tr><td colSpan="9">No assigned maintenance work orders found.</td></tr>:assignedIssues.map((issue)=><tr key={issue.issue_id}><td>{issue.issue_title||issue.issue||"Issue"}</td><td>{propertyName(issue.property_id)}</td><td>{issue.property_area||"—"}</td><td>{issue.priority||"—"}</td><td><Chip tone={normalize(issue.status)==="completed"?"green":"gray"}>{issue.status||"Open"}</Chip></td><td>{issue.vendor||"—"}</td><td>{fmtCurrency(Number(issue.estimated_cost||0),currency)}</td><td>{fmtCurrency(Number(issue.actual_cost||0),currency)}</td><td>{fmtDateShort(issue.reported_date)}</td></tr>)}
    </tbody></table></div></article></div>;
}
