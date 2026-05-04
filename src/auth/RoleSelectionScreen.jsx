import { ROLE_LABELS } from "../utils/permissions.js";

const DESCRIPTIONS = {
  host: "Full workspace access",
  property_manager: "Operations and assigned property management",
  cleaner: "Cleaning tasks and turnover status",
  owner: "Property health, reports, and approvals",
};

export default function RoleSelectionScreen({ availableRoles = [], memberships = [], onContinue, onSignOut }) {
  return <div className="approval-shell"><div className="approval-card" style={{maxWidth:900}}><h1 className="approval-title">Choose your workspace</h1><p className="approval-body">You have access to multiple portals. Select how you want to continue.</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))',gap:12,marginTop:16}}>{availableRoles.map((role)=>{const rows=memberships.filter((m)=>(m.access_role||'').toLowerCase()===role);const count=new Set(rows.map((m)=>m.property_id)).size;return <button key={role} className="btn-secondary" style={{textAlign:'left',padding:12,borderRadius:16}} onClick={()=>onContinue(role)}><strong>{ROLE_LABELS[role]||role}</strong><div>{DESCRIPTIONS[role]}</div><div>{count} assigned properties</div></button>;})}</div><button className="btn-ghost" style={{marginTop:16}} onClick={onSignOut}>Sign out</button></div></div>;
}
