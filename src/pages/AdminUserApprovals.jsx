import React, { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

export default function AdminUserApprovals() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfiles = async () => {
    if (!supabase || !isSupabaseConfigured) return;
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("profiles")
      .select("id, email, role, account_status, created_at")
      .order("created_at", { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setLoading(false);
      return;
    }

    setProfiles(data || []);
    setLoading(false);
  };

  useEffect(() => {
    void loadProfiles();
  }, []);

  const updateUser = async (id, updates) => {
    setError("");
    const { error: updateError } = await supabase.from("profiles").update(updates).eq("id", id);
    if (updateError) {
      setError(`${updateError.message}. If RLS blocks updates, run approvals via SQL or add admin policies.`);
      return;
    }
    await loadProfiles();
  };

  if (!isSupabaseConfigured) {
    return <div className="page"><h1 className="page-title">Admin User Approvals</h1><p>Supabase is not configured in this environment.</p></div>;
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Admin User Approvals</h1>
        <p className="page-subtitle">Approve, suspend, reactivate, and assign roles for beta users.</p>
      </div>
      {error ? <div className="auth-setup-error"><p>{error}</p></div> : null}
      {loading ? <p>Loading profiles…</p> : (
        <table className="table" style={{ width: "100%" }}>
          <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.email || "—"}</td>
                <td>
                  <select value={p.role || "host"} onChange={(e) => updateUser(p.id, { role: e.target.value })}>
                    <option value="admin">admin</option><option value="host">host</option><option value="cleaner">cleaner</option><option value="owner">owner</option>
                  </select>
                </td>
                <td>{p.account_status || "pending"}</td>
                <td>{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn" onClick={() => updateUser(p.id, { account_status: "approved", approved_at: new Date().toISOString() })}>Approve</button>
                    <button className="btn-secondary" onClick={() => updateUser(p.id, { account_status: "suspended", suspended_at: new Date().toISOString() })}>Suspend</button>
                    <button className="btn-ghost" onClick={() => updateUser(p.id, { account_status: "approved", suspended_at: null, rejected_at: null })}>Reactivate</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
