import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

const ROLE_OPTIONS = ["host", "property_manager", "cleaner", "owner"];

export default function UsersAccess({ permissions }) {
  const [users, setUsers] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [approveUser, setApproveUser] = useState(null);
  const [approveRole, setApproveRole] = useState("host");
  const [manageUser, setManageUser] = useState(null);

  const load = async () => {
    if (!supabase || !isSupabaseConfigured) return;
    setLoading(true); setError("");
    const [{ data: usersData, error: usersError }, { data: membershipsData, error: membershipsError }, { data: propertiesData, error: propertiesError }] = await Promise.all([
      supabase.rpc("admin_list_users"),
      supabase.rpc("admin_list_memberships"),
      supabase.rpc("admin_list_assignable_properties"),
    ]);
    if (usersError || membershipsError || propertiesError) {
      setError(usersError?.message || membershipsError?.message || propertiesError?.message || "Failed to load data");
    } else {
      setUsers(usersData || []);
      setMemberships(membershipsData || []);
      setProperties(propertiesData || []);
    }
    setLoading(false);
  };

  useEffect(() => { void load(); }, []);

  const filteredUsers = useMemo(() => users.filter((u) => {
    const m1 = !search || (u.email || "").toLowerCase().includes(search.toLowerCase());
    const m2 = statusFilter === "all" || u.account_status === statusFilter;
    const m3 = roleFilter === "all" || u.role === roleFilter;
    return m1 && m2 && m3;
  }), [users, search, statusFilter, roleFilter]);

  const runRpc = async (fn, params) => {
    setError("");
    const { error: rpcError } = await supabase.rpc(fn, params);
    if (rpcError) {
      setError(rpcError.message || "Action failed");
      return false;
    }
    await load();
    return true;
  };

  if (!permissions?.isHostLike) return <div className="page"><p>Access denied.</p></div>;

  return <div className="page"><div className="page-header"><h1 className="page-title">Users &amp; Access</h1><p className="page-subtitle">Approve users, assign portal roles, and control property-level permissions.</p></div>
    <div style={{ display:"flex", gap:12, marginBottom:12 }}><button className="btn" onClick={load}>Refresh</button><button className="btn-ghost" disabled>Invite User (Coming soon)</button></div>
    <div className="grid" style={{ gridTemplateColumns:"repeat(4,minmax(0,1fr))", gap:12, marginBottom:16 }}>
      <div className="card"><div>Total Users</div><strong>{users.length}</strong></div>
      <div className="card"><div>Pending Approval</div><strong>{users.filter((u)=>u.account_status==="pending").length}</strong></div>
      <div className="card"><div>Approved Users</div><strong>{users.filter((u)=>u.account_status==="approved").length}</strong></div>
      <div className="card"><div>Active Memberships</div><strong>{memberships.filter((m)=>m.active).length}</strong></div>
    </div>
    <div className="card" style={{ padding:16 }}>
      <div style={{ display:"flex", gap:8, marginBottom:12 }}>
        <input placeholder="Search by email" value={search} onChange={(e)=>setSearch(e.target.value)} />
        <select value={statusFilter} onChange={(e)=>setStatusFilter(e.target.value)}><option value="all">All Status</option><option value="pending">Pending</option><option value="approved">Approved</option><option value="suspended">Suspended</option></select>
        <select value={roleFilter} onChange={(e)=>setRoleFilter(e.target.value)}><option value="all">All Roles</option>{ROLE_OPTIONS.map((r)=><option key={r} value={r}>{r}</option>)}</select>
      </div>
      {error ? <div className="auth-setup-error"><p>{error}</p><button className="btn" onClick={load}>Retry</button></div> : null}
      {loading ? <p>Loading...</p> : <table className="table" style={{ width:"100%" }}><thead><tr><th>User</th><th>Status</th><th>Role</th><th>Created</th><th>Assigned</th><th>Actions</th></tr></thead><tbody>
        {filteredUsers.map((u)=><tr key={u.user_id}><td><div>{u.email}</div><small>Requested: {u.requested_role || "—"}</small></td><td>{u.account_status}</td><td>{u.role || "—"}</td><td>{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td><td>{u.membership_count || 0}</td>
        <td><div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
          <button className="btn" disabled={u.account_status === "approved"} onClick={()=>{ setApproveUser(u); setApproveRole(u.requested_role || "host"); }}>Approve</button>
          {u.account_status === "suspended" ? <button className="btn-secondary" onClick={()=>runRpc("admin_restore_user", { target_user_id: u.user_id })}>Restore</button> : <button className="btn-secondary" onClick={()=>runRpc("admin_suspend_user", { target_user_id: u.user_id })}>Suspend</button>}
          <button className="btn-ghost" onClick={()=>setManageUser(u)}>Manage Access</button>
        </div></td></tr>)}
      </tbody></table>}
    </div>

    {approveUser ? <div className="modal-overlay"><div className="modal card" style={{ padding:16, maxWidth:520 }}><h3>Approve user</h3><p>{approveUser.email}</p><select value={approveRole} onChange={(e)=>setApproveRole(e.target.value)}>{ROLE_OPTIONS.map((r)=><option key={r} value={r}>{r}</option>)}</select>
      {approveRole !== "host" ? <p style={{ fontSize:12 }}>This role still needs property assignment after approval.</p> : null}
      <div style={{ display:"flex", gap:8 }}><button className="btn" onClick={async()=>{ const ok = await runRpc("admin_approve_user", { target_user_id: approveUser.user_id, approved_role: approveRole }); if (ok) setApproveUser(null); }}>Confirm</button><button className="btn-ghost" onClick={()=>setApproveUser(null)}>Cancel</button></div></div></div> : null}

    {manageUser ? <ManageAccessModal user={manageUser} memberships={memberships.filter((m)=>m.member_user_id===manageUser.user_id)} properties={properties} onClose={()=>setManageUser(null)} onMutate={runRpc} /> : null}
  </div>;
}

function ManageAccessModal({ user, memberships, properties, onClose, onMutate }) {
  const [form, setForm] = useState({ property_record_id:"", access_role:"property_manager", can_view_financials:false, can_edit_operations:true, can_approve_maintenance:false });
  return <div className="modal-overlay"><div className="modal card" style={{ maxWidth:900, padding:16 }}>
    <h3 style={{ display:"flex", alignItems:"center", gap:8 }}><ShieldCheck size={18} /> Manage Access</h3><p>{user.email} · {user.account_status} · {user.role || "—"}</p>
    <table className="table" style={{ width:"100%" }}><thead><tr><th>Property</th><th>Role</th><th>Permissions</th><th>Active</th><th>Actions</th></tr></thead><tbody>{memberships.map((m)=><tr key={m.id}><td>{m.property_name || m.property_id}</td><td>{m.access_role}</td><td>{m.can_view_financials?"F ":""}{m.can_edit_operations?"Ops ":""}{m.can_approve_maintenance?"Maint": ""}</td><td>{String(m.active)}</td><td><button className="btn-secondary" onClick={()=>onMutate("admin_update_property_membership", { membership_id:m.id, target_access_role:m.access_role, target_can_view_financials:m.can_view_financials, target_can_edit_operations:m.can_edit_operations, target_can_approve_maintenance:m.can_approve_maintenance, target_active:!m.active })}>Toggle</button><button className="btn-ghost" onClick={()=>onMutate("admin_delete_or_deactivate_membership", { membership_id:m.id })}>Deactivate</button></td></tr>)}</tbody></table>
    <h4>Add assignment</h4>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,minmax(0,1fr))", gap:8 }}>
      <select value={form.property_record_id} onChange={(e)=>setForm((s)=>({ ...s, property_record_id:e.target.value }))}><option value="">Select property</option>{properties.map((p)=><option key={p.id} value={p.id}>{p.name || p.property_id}</option>)}</select>
      <select value={form.access_role} onChange={(e)=>setForm((s)=>({ ...s, access_role:e.target.value }))}>{ROLE_OPTIONS.map((r)=><option key={r} value={r}>{r}</option>)}</select>
      <label><input type="checkbox" checked={form.can_view_financials} onChange={(e)=>setForm((s)=>({ ...s, can_view_financials:e.target.checked }))} /> can_view_financials</label>
      <label><input type="checkbox" checked={form.can_edit_operations} onChange={(e)=>setForm((s)=>({ ...s, can_edit_operations:e.target.checked }))} /> can_edit_operations</label>
      <label><input type="checkbox" checked={form.can_approve_maintenance} onChange={(e)=>setForm((s)=>({ ...s, can_approve_maintenance:e.target.checked }))} /> can_approve_maintenance</label>
    </div>
    <div style={{ display:"flex", gap:8, marginTop:12 }}><button className="btn" onClick={()=>onMutate("admin_assign_property_membership", { target_user_id:user.user_id, target_property_record_id:form.property_record_id, target_access_role:form.access_role, target_can_view_financials:form.can_view_financials, target_can_edit_operations:form.can_edit_operations, target_can_approve_maintenance:form.can_approve_maintenance })}>Save</button><button className="btn-ghost" onClick={onClose}>Close</button></div>
  </div></div>;
}
