import React from "react";

const REPORTS = [
  "Monthly owner statement",
  "Revenue summary",
  "Expense report",
  "Occupancy report",
  "Cleaning performance report",
  "Maintenance cost report",
  "Property health report",
];

export default function Reports() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Reports</h1>
        <p className="page-subtitle">Workspace-scoped reporting with export stubs for PDF/CSV and scheduled delivery.</p>
      </div>

      <div className="card-grid" style={{ gap: 12 }}>
        {REPORTS.map((name) => (
          <article key={name} className="card">
            <h3 style={{ marginBottom: 8 }}>{name}</h3>
            <p style={{ color: "#64748B", marginBottom: 12 }}>TODO: connect to Supabase report materialization service and workspace filter payloads.</p>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn-ghost" type="button">Export CSV (TODO)</button>
              <button className="btn-ghost" type="button">Export PDF (TODO)</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
