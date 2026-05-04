import { useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";

export default function CleanerPortal() {
  const { cleaning = [] } = useApp();
  const assigned = cleaning.filter((t) => t?.assigned_cleaner_email || t?.assigned_cleaner_user_id);
  const kpis = useMemo(() => ({
    upcoming: assigned.filter((t) => t.cleaning_status !== "Completed").length,
    today: assigned.filter((t) => (t.checkout_date || "").slice(0,10) === new Date().toISOString().slice(0,10)).length,
    inProgress: assigned.filter((t) => t.cleaning_status === "In Progress").length,
    completedMonth: assigned.filter((t) => t.cleaning_status === "Completed").length,
  }), [assigned]);

  return <div className="page"><h1 className="page-title">My Cleanings</h1><div className="stats-grid">{Object.entries(kpis).map(([k,v]) => <div key={k} className="stat-card"><div>{k}</div><strong>{v}</strong></div>)}</div>{assigned.length===0?<div className="card">No assigned cleanings.</div>:<div className="stack-list">{assigned.map((t)=><article className="card" key={t.cleaning_id}><h3>{t.property_name || t.property_id}</h3><p>Checkout: {t.checkout_date || "-"}</p><p>Next check-in: {t.next_checkin_date || "-"}</p><p>Notes: {t.notes || "-"}</p></article>)}</div>}</div>;
}
