import { useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

const ROLES = ["property_manager", "owner", "cleaner", "maintenance"];
const defaultPerms = {
  owner: { can_view_financials: true, can_edit_operations: false, can_approve_maintenance: false },
  cleaner: { can_view_financials: false, can_edit_operations: true, can_approve_maintenance: false },
  maintenance: { can_view_financials: false, can_edit_operations: true, can_approve_maintenance: false },
  property_manager: { can_view_financials: true, can_edit_operations: true, can_approve_maintenance: true },
};

const emptyProperty = { property_name:"", property_id:"", parish_town:"", country:"", address:"", property_type:"", bedrooms:"", bathrooms:"", max_guests:"", owner_name:"", owner_email:"", default_nightly_rate:"", default_cleaning_fee:"", default_checkin_time:"", default_checkout_time:"", wifi_name:"", wifi_password:"", timezone:"", active:true, notes:"" };

export default function PropertySetup({ permissions }) {
  const role = permissions?.role || "host";
  const canManage = ["admin", "host", "property_manager", "owner"].includes(role);
  const [properties, setProperties] = useState([]); const [memberships, setMemberships] = useState([]); const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [q, setQ] = useState(""); const [status, setStatus] = useState("active");
  const [editing, setEditing] = useState(null); const [form, setForm] = useState(emptyProperty);
  const [assigning, setAssigning] = useState(null); const [assignForm, setAssignForm] = useState({ target_user_id:"", target_access_role:"property_manager", ...defaultPerms.property_manager });

  const load = async () => {
    if (!supabase || !isSupabaseConfigured) return;
    setLoading(true); setError("");
    const [{ data: p, error: pErr }, { data: m, error: mErr }, { data: u, error: uErr }] = await Promise.all([
      supabase.rpc("admin_list_assignable_properties"),
      supabase.rpc("admin_list_memberships"),
      supabase.rpc("admin_list_users"),
    ]);
    if (pErr || mErr || uErr) setError(pErr?.message || mErr?.message || uErr?.message || "Failed to load property setup data");
    setProperties(p || []); setMemberships(m || []); setUsers((u || []).filter((x) => x.account_status === "approved"));
    setLoading(false);
  };
  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => properties.filter((p) => {
    const matchQ = !q || (p.property_name || "").toLowerCase().includes(q.toLowerCase());
    const matchStatus = status === "all" || (status === "active" ? p.active !== false : p.active === false);
    return matchQ && matchStatus;
  }), [properties, q, status]);

  const openCreate = () => { setEditing(null); setForm(emptyProperty); };
  const openEdit = (p) => { setEditing(p); setForm({ ...emptyProperty, ...p }); };

  const saveProperty = async () => {
    setError("");
    const payload = { ...form, bedrooms:Number(form.bedrooms)||0, bathrooms:Number(form.bathrooms)||0, max_guests:Number(form.max_guests)||0, default_nightly_rate:Number(form.default_nightly_rate)||0, default_cleaning_fee:Number(form.default_cleaning_fee)||0 };
    const query = editing ? supabase.from("properties").update(payload).eq("id", editing.id) : supabase.from("properties").insert(payload);
    const { error: saveError } = await query;
    if (saveError) return setError(saveError.message || "Failed to save property");
    setEditing(null); setForm(emptyProperty); await load();
  };

  const setActive = async (id, active) => { const { error:e } = await supabase.from("properties").update({ active }).eq("id", id); if (e) return setError(e.message); await load(); };

  if (!canManage) return <div className="page"><p>Access denied.</p></div>;

  return <div className="page" style={{ background:"#F7F8FA", minHeight:"100%" }}><div className="page-header"><h1 className="page-title" style={{ fontSize:24 }}>Property Setup</h1></div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))", gap:8, marginBottom:12 }}>{[["Total",properties.length],["Active",properties.filter((p)=>p.active!==false).length],["Inactive",properties.filter((p)=>p.active===false).length]].map((x)=><div key={x[0]} style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:16, padding:12, boxShadow:"0 1px 3px rgba(0,0,0,.04)" }}><div style={{ fontSize:14 }}>{x[0]}</div><strong>{x[1]}</strong></div>)}</div>
    <div style={{ display:"flex", gap:8, marginBottom:12, flexWrap:"wrap" }}><input placeholder="Search by property name" value={q} onChange={(e)=>setQ(e.target.value)} /><select value={status} onChange={(e)=>setStatus(e.target.value)}><option value="active">Active</option><option value="inactive">Inactive</option><option value="all">All</option></select><button className="btn" style={{ background:"#1B998B" }} onClick={openCreate}>Add Property</button><button className="btn-secondary" onClick={load}>Refresh</button></div>
    {error ? <div className="auth-setup-error"><p>{error}</p><button className="btn" onClick={load}>Retry</button></div> : null}
    {loading ? <div className="card">Loading property setup...</div> : filtered.length === 0 ? <div className="card">No properties found.</div> : <div className="card" style={{ background:"#fff", border:"1px solid #E5E7EB", borderRadius:16 }}><table className="table" style={{ width:"100%" }}><thead><tr><th>Property Name</th><th>Location</th><th>Type</th><th>Owner</th><th>Assigned Team</th><th>Status</th><th>Actions</th></tr></thead><tbody>{filtered.map((p)=>{ const team = memberships.filter((m)=>m.property_record_id===p.id && m.active); return <tr key={p.id}><td>{p.property_name}</td><td>{[p.parish_town,p.country].filter(Boolean).join(", ") || "—"}</td><td>{p.property_type || "—"}</td><td>{p.owner_name || p.owner_email || "—"}</td><td>{team.map((m)=>m.access_role).join(", ") || "—"}</td><td><span>{p.active===false?"Inactive":"Active"}</span></td><td><button className="btn-ghost" onClick={()=>openEdit(p)}>Edit</button><button className="btn-ghost" onClick={()=>setAssigning(p)}>Assign users</button><button className="btn-ghost" onClick={()=>setActive(p.id, p.active===false)}>{p.active===false?"Activate":"Archive"}</button></td></tr>; })}</tbody></table></div>}

    {(editing !== null || form.property_name || form.property_id) ? <div className="modal-overlay"><div className="modal card" style={{ maxWidth:900, padding:16, background:"#fff", border:"1px solid #E5E7EB", borderRadius:16 }}><h3 style={{ fontSize:18 }}>{editing?"Edit Property":"Add Property"}</h3><div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))", gap:8 }}>{Object.keys(emptyProperty).map((k)=><label key={k} style={{ fontSize:14 }}>{k}<input type={k==="active"?"checkbox":"text"} checked={k==="active"?!!form[k]:undefined} value={k==="active"?undefined:(form[k]??"")} onChange={(e)=>setForm((s)=>({ ...s, [k]:k==="active"?e.target.checked:e.target.value }))} /></label>)}</div><div style={{ display:"flex", gap:8, marginTop:12 }}><button className="btn" style={{ background:"#1B998B" }} onClick={saveProperty}>Save</button><button className="btn-ghost" onClick={()=>{ setEditing(null); setForm(emptyProperty); }}>Cancel</button></div></div></div> : null}

    {assigning ? <div className="modal-overlay"><div className="modal card" style={{ maxWidth:700, padding:16 }}><h3>Assign Users · {assigning.property_name}</h3><div style={{ display:"grid", gap:8 }}><select value={assignForm.target_user_id} onChange={(e)=>setAssignForm((s)=>({ ...s, target_user_id:e.target.value }))}><option value="">Select approved user</option>{users.map((u)=><option key={u.user_id} value={u.user_id}>{u.email}</option>)}</select><select value={assignForm.target_access_role} onChange={(e)=>setAssignForm((s)=>({ ...s, target_access_role:e.target.value, ...defaultPerms[e.target.value] }))}>{ROLES.map((r)=><option key={r} value={r}>{r}</option>)}</select>
      <label><input type="checkbox" checked={assignForm.target_can_view_financials} onChange={(e)=>setAssignForm((s)=>({ ...s, target_can_view_financials:e.target.checked }))}/> can_view_financials</label>
      <label><input type="checkbox" checked={assignForm.target_can_edit_operations} onChange={(e)=>setAssignForm((s)=>({ ...s, target_can_edit_operations:e.target.checked }))}/> can_edit_operations</label>
      <label><input type="checkbox" checked={assignForm.target_can_approve_maintenance} onChange={(e)=>setAssignForm((s)=>({ ...s, target_can_approve_maintenance:e.target.checked }))}/> can_approve_maintenance</label></div>
      <div style={{ display:"flex", gap:8, marginTop:12 }}><button className="btn" onClick={async()=>{ const { error:e } = await supabase.rpc("admin_assign_property_membership", { ...assignForm, target_property_record_id: assigning.id }); if (e) return setError(e.message); setAssigning(null); await load(); }}>Assign</button><button className="btn-ghost" onClick={()=>setAssigning(null)}>Close</button></div></div></div> : null}
  </div>;
}
