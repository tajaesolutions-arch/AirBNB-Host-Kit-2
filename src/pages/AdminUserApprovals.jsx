import React, { useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

export default function AdminUserApprovals() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState("");

  const loadProfiles = async () => {
    if (!supabase || !isSupabaseConfigured) return;
    setLoading(true);
    setError("");
    const { data, error: queryError } = await supabase
      .from("profiles")
      .select("id, email, host_name, role, account_status, created_at, approved_at, suspended_at, rejected_at")
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

  const updateUserRole = async (id, nextRole) => {
    setError("");
    const { error: updateError } = await supabase.rpc("admin_set_user_role", { target_user_id: id, next_role: nextRole });
    if (updateError) {
      setError(updateError.message || "Failed to update user role.");
      return;
    }
    await loadProfiles();
  };

  const approveUser = async (profile) => {
    setError("");
    setWarning("");
    const { error: approveError } = await supabase.rpc("admin_approve_user", {
      target_user_id: profile.id,
      approved_role: profile.role || "host",
    });

    if (approveError) {
      setError(approveError.message || "Failed to approve user.");
      return;
    }

    const emailResp = await supabase.functions.invoke("send-approval-email", {
      body: { email: profile.email, fullName: profile.host_name || profile.email || "there" },
    });

    if (emailResp.error || emailResp.data?.sent === false) {
      setWarning("User approved, but approval email was not sent because email provider environment variables are not configured.");
    }

    await loadProfiles();
  };

  const suspendUser = async (id) => {
    setError("");
    const { error: suspendError } = await supabase.rpc("admin_suspend_user", { target_user_id: id });
    if (suspendError) {
      setError(suspendError.message || "Failed to suspend user.");
      return;
    }
    await loadProfiles();
  };

  const reactivateUser = async (id) => {
    setError("");
    const { error: reactivateError } = await supabase.rpc("admin_reactivate_user", { target_user_id: id });
    if (reactivateError) {
      setError(reactivateError.message || "Failed to reactivate user.");
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
      {warning ? <div className="auth-message"><p>{warning}</p></div> : null}
      {loading ? <p>Loading profiles…</p> : (
        <table className="table" style={{ width: "100%" }}>
          <thead><tr><th>Email</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id}>
                <td>{p.email || "—"}</td>
                <td>
                  <select value={p.role || "host"} onChange={(e) => updateUserRole(p.id, e.target.value)}>
                    <option value="admin">admin</option><option value="host">host</option><option value="property_manager">property_manager</option><option value="cleaner">cleaner</option><option value="maintenance">maintenance</option><option value="owner">owner</option>
                  </select>
                </td>
                <td>{p.account_status || "pending"}</td>
                <td>{p.created_at ? new Date(p.created_at).toLocaleString() : "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <button className="btn" onClick={() => approveUser(p)}>Approve</button>
                    <button className="btn-secondary" onClick={() => suspendUser(p.id)}>Suspend</button>
                    <button className="btn-ghost" onClick={() => reactivateUser(p.id)}>Reactivate</button>
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
