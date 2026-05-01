// ============================================================
//  GUESTS PAGE
// ============================================================
import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { PageHeader, Modal, Field, ConfirmBar, Chip, EmptyState } from "../components/index.jsx";
import { uid, todayISO, bookingTotal, fmtCurrency, fmtDateShort, downloadCSV } from "../utils/helpers.js";
import { Plus, Download, ChevronRight, Trash2, Search, CheckCircle2 } from "lucide-react";
import { PROPERTY_AREAS } from "../data/sampleData.js";

function GuestForm({ record, onClose, onSave, onDelete }) {
  const [g, setG] = useState({ ...record });
  const set = (k, v) => setG(p => ({ ...p, [k]: v }));
  return (
    <Modal open onClose={onClose} title={record.guest_id ? "Edit Guest" : "Add Guest"} wide
      footer={<>
        {record.guest_id && <button className="btn-danger" onClick={() => onDelete(record.guest_id)}><Trash2 size={13} /> Delete</button>}
        <div className="modal-footer-spacer" />
        <ConfirmBar onCancel={onClose} onSave={() => onSave(g)} />
      </>}>
      <div className="form-grid-2">
        <Field label="Guest Name"><input value={g.guest_name} onChange={e => set("guest_name", e.target.value)} /></Field>
        <Field label="Country"><input value={g.country} onChange={e => set("country", e.target.value)} placeholder="e.g. United States" /></Field>
        <Field label="Email"><input type="email" value={g.email} onChange={e => set("email", e.target.value)} /></Field>
        <Field label="Phone"><input value={g.phone} onChange={e => set("phone", e.target.value)} /></Field>
        <Field label="Last Contacted"><input type="date" value={g.last_contacted_date} onChange={e => set("last_contacted_date", e.target.value)} /></Field>
        <Field label="Next Follow-up Date"><input type="date" value={g.next_followup_date} onChange={e => set("next_followup_date", e.target.value)} /></Field>
      </div>
      <Field label="Preferences"><textarea value={g.preferences} onChange={e => set("preferences", e.target.value)} rows={2} placeholder="e.g. Late checkout, beach access..." /></Field>
      <Field label="Notes"><textarea value={g.notes} onChange={e => set("notes", e.target.value)} rows={2} /></Field>
      <div className="form-grid-2">
        <label className="toggle-row"><input type="checkbox" checked={!!g.review_left} onChange={e => set("review_left", e.target.checked)} /> Review left</label>
        <label className="toggle-row"><input type="checkbox" checked={!!g.direct_followup_sent} onChange={e => set("direct_followup_sent", e.target.checked)} /> Direct follow-up sent</label>
      </div>
    </Modal>
  );
}

export function Guests({ propFilter }) {
  const { guests, setGuests, bookings, properties, settings } = useApp();
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const cur = settings.default_currency;

  const enriched = guests.map(g => {
    const gb = bookings.filter(b => b.guest_id === g.guest_id);
    const total_spent = gb.reduce((s, b) => s + bookingTotal(b), 0);
    const last_stay = gb.length > 0 ? gb.map(b => b.checkout_date).sort().reverse()[0] : "";
    const prop = gb[0] ? properties.find(p => p.property_id === gb[0].property_id)?.property_name : "—";
    return { ...g, total_spent, last_stay, prop_name: prop, booking_count: gb.length };
  }).filter(g => !search || g.guest_name.toLowerCase().includes(search.toLowerCase()) || (g.country || "").toLowerCase().includes(search.toLowerCase()));

  const empty = { guest_id: "", guest_name: "", country: "", email: "", phone: "", review_left: false, direct_followup_sent: false, preferences: "", notes: "", last_contacted_date: "", next_followup_date: "" };
  const save = g => { if (!g.guest_id) setGuests([...guests, { ...g, guest_id: uid("GUEST") }]); else setGuests(guests.map(x => x.guest_id === g.guest_id ? g : x)); setEditing(null); };
  const del = id => { setGuests(guests.filter(x => x.guest_id !== id)); setEditing(null); };

  return (
    <div className="page">
      <PageHeader title="Guest CRM" subtitle="Past guests are future direct bookings. Track who stayed, what they liked, and when to follow up."
        helper="Every guest you don't follow up with is potential revenue left on Airbnb's platform. Set a next follow-up date for every guest."
        actions={<>
          <button className="btn-secondary" onClick={() => downloadCSV("guests.csv", enriched)}><Download size={14} /> Export</button>
          <button className="btn-primary" onClick={() => setEditing(empty)}><Plus size={14} /> Add Guest</button>
        </>} />
      <div className="search-wrap">
        <Search size={15} className="search-icon" />
        <input placeholder="Search by name or country…" value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Guest</th><th>Country</th><th>Last Property</th><th className="td-right">Bookings</th><th className="td-right">Total Spent</th><th>Review</th><th>Follow-up Sent</th><th>Next Follow-up</th><th></th></tr></thead>
            <tbody>
              {enriched.length === 0 && <tr><td colSpan={9} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No guests yet.</td></tr>}
              {enriched.map(g => (
                <tr key={g.guest_id} className="tr-clickable" onClick={() => setEditing(g)}>
                  <td><div className="fw-bold">{g.guest_name}</div><div className="td-muted">{g.email || g.phone}</div></td>
                  <td>{g.country || "—"}</td>
                  <td>{g.prop_name}</td>
                  <td className="td-right num">{g.booking_count}</td>
                  <td className="td-right num fw-bold">{fmtCurrency(g.total_spent, cur)}</td>
                  <td>{g.review_left ? <Chip tone="green" icon={CheckCircle2}>Yes</Chip> : <Chip tone="gray">No</Chip>}</td>
                  <td>{g.direct_followup_sent ? <Chip tone="green" icon={CheckCircle2}>Sent</Chip> : <Chip tone="amber">Pending</Chip>}</td>
                  <td className="num">{fmtDateShort(g.next_followup_date)}</td>
                  <td><ChevronRight size={14} color="var(--muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <GuestForm record={editing} onClose={() => setEditing(null)} onSave={save} onDelete={del} />}
    </div>
  );
}

// ============================================================
//  CLEANING PAGE
// ============================================================
function CleaningForm({ record, onClose, onSave, onDelete, properties, cleaners }) {
  const [c, setC] = useState({ ...record });
  const set = (k, v) => setC(p => ({ ...p, [k]: v }));
  const STATUSES = ["Scheduled", "In Progress", "Completed", "Issue Found", "Cancelled"];
  const LINEN = ["Not Checked", "Fresh Set", "Replaced", "Needs Replacement"];
  const DAMAGE = ["Not Checked", "Clear", "Minor Issue", "Damage Found"];
  return (
    <Modal open onClose={onClose} title={record.cleaning_id ? "Edit Cleaning Task" : "Add Cleaning Task"} wide
      footer={<>
        {record.cleaning_id && <button className="btn-danger" onClick={() => onDelete(record.cleaning_id)}><Trash2 size={13} /> Delete</button>}
        <div className="modal-footer-spacer" />
        <ConfirmBar onCancel={onClose} onSave={() => onSave(c)} />
      </>}>
      <div className="form-grid-2">
        <Field label="Property"><select value={c.property_id} onChange={e => set("property_id", e.target.value)}>{properties.map(p => <option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}</select></Field>
        <Field label="Cleaner Assigned"><select value={c.cleaner_name} onChange={e => set("cleaner_name", e.target.value)}>{cleaners.map(cl => <option key={cl.name}>{cl.name}</option>)}<option value="Other">Other</option></select></Field>
        <Field label="Checkout Date"><input type="date" value={c.checkout_date} onChange={e => set("checkout_date", e.target.value)} /></Field>
        <Field label="Next Check-in Date"><input type="date" value={c.next_checkin_date} onChange={e => set("next_checkin_date", e.target.value)} /></Field>
        <Field label="Cleaning Status"><select value={c.cleaning_status} onChange={e => set("cleaning_status", e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Linen Status"><select value={c.linen_status} onChange={e => set("linen_status", e.target.value)}>{LINEN.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Damage Check"><select value={c.damage_check} onChange={e => set("damage_check", e.target.value)}>{DAMAGE.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Cleaning Cost (JMD)"><input type="number" value={c.cleaning_cost} onChange={e => set("cleaning_cost", Number(e.target.value))} /></Field>
      </div>
      <div className="form-grid-2">
        <label className="toggle-row"><input type="checkbox" checked={!!c.supplies_restocked} onChange={e => set("supplies_restocked", e.target.checked)} /> Supplies restocked</label>
        <label className="toggle-row"><input type="checkbox" checked={!!c.photos_uploaded} onChange={e => set("photos_uploaded", e.target.checked)} /> Photos uploaded</label>
      </div>
      <Field label="Notes"><textarea value={c.notes} onChange={e => set("notes", e.target.value)} rows={2} /></Field>
    </Modal>
  );
}

export function Cleaning({ propFilter }) {
  const { cleaning, setCleaning, properties, settings } = useApp();
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const filtered = (propFilter === "ALL" ? cleaning : cleaning.filter(c => c.property_id === propFilter))
    .filter(c => statusFilter === "ALL" || c.cleaning_status === statusFilter)
    .sort((a, b) => new Date(a.checkout_date) - new Date(b.checkout_date));
  const empty = { cleaning_id: "", property_id: properties[0]?.property_id || "", booking_id: "", checkout_date: todayISO(), next_checkin_date: "", cleaner_name: settings.cleaners[0]?.name || "", cleaning_status: "Scheduled", linen_status: "Not Checked", damage_check: "Not Checked", supplies_restocked: false, photos_uploaded: false, time_completed: "", cleaning_cost: 0, notes: "" };
  const save = c => { if (!c.cleaning_id) setCleaning([...cleaning, { ...c, cleaning_id: uid("CLEAN") }]); else setCleaning(cleaning.map(x => x.cleaning_id === c.cleaning_id ? c : x)); setEditing(null); };
  const del = id => { setCleaning(cleaning.filter(x => x.cleaning_id !== id)); setEditing(null); };
  const getProp = id => properties.find(p => p.property_id === id);
  const STATUSES = ["ALL", "Scheduled", "In Progress", "Completed", "Issue Found", "Cancelled"];
  const toneMap = { "Scheduled": "amber", "In Progress": "blue", "Completed": "green", "Issue Found": "red", "Cancelled": "gray" };

  return (
    <div className="page">
      <PageHeader title="Cleaning Schedule" subtitle="Track every turnover — assign cleaners, verify linen, damage check, and restock."
        helper="Use this page after every checkout. A clean, inspected, restocked property means better reviews and fewer problems."
        actions={<button className="btn-primary" onClick={() => setEditing(empty)}><Plus size={14} /> Add Cleaning Task</button>} />
      <div className="status-filters">{STATUSES.map(s => <button key={s} className={`status-filter-btn ${s === statusFilter ? "active" : ""}`} onClick={() => setStatusFilter(s)}>{s === "ALL" ? "All" : s}</button>)}</div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Property</th><th>Checkout</th><th>Next Check-in</th><th>Cleaner</th><th>Status</th><th>Linen</th><th>Damage</th><th>Restocked</th><th>Photos</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No cleaning tasks. Add one when a guest checks out.</td></tr>}
              {filtered.map(c => (
                <tr key={c.cleaning_id} className="tr-clickable" onClick={() => setEditing(c)}>
                  <td className="fw-bold">{getProp(c.property_id)?.property_name || "—"}</td>
                  <td className="num">{fmtDateShort(c.checkout_date)}</td>
                  <td className="num">{fmtDateShort(c.next_checkin_date)}</td>
                  <td>{c.cleaner_name}</td>
                  <td><Chip tone={toneMap[c.cleaning_status] || "gray"}>{c.cleaning_status}</Chip></td>
                  <td><Chip tone={c.linen_status === "Replaced" ? "green" : "gray"}>{c.linen_status}</Chip></td>
                  <td><Chip tone={c.damage_check === "Clear" ? "green" : c.damage_check === "Damage Found" ? "red" : "gray"}>{c.damage_check}</Chip></td>
                  <td>{c.supplies_restocked ? <Chip tone="green">Yes</Chip> : <Chip tone="amber">No</Chip>}</td>
                  <td>{c.photos_uploaded ? <Chip tone="green">Yes</Chip> : <Chip tone="amber">No</Chip>}</td>
                  <td><ChevronRight size={14} color="var(--muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <CleaningForm record={editing} onClose={() => setEditing(null)} onSave={save} onDelete={del} properties={properties} cleaners={settings.cleaners} />}
    </div>
  );
}

// ============================================================
//  MAINTENANCE PAGE
// ============================================================

function MaintenanceForm({ record, onClose, onSave, onDelete, properties, vendors }) {
  const [m, setM] = useState({ ...record });
  const set = (k, v) => setM(p => ({ ...p, [k]: v }));
  const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
  const STATUSES = ["Open", "In Progress", "Waiting on Vendor", "Completed", "Cancelled"];
  return (
    <Modal open onClose={onClose} title={record.issue_id ? "Edit Issue" : "Add Maintenance Issue"} wide
      footer={<>
        {record.issue_id && <button className="btn-danger" onClick={() => onDelete(record.issue_id)}><Trash2 size={13} /> Delete</button>}
        <div className="modal-footer-spacer" />
        <ConfirmBar onCancel={onClose} onSave={() => onSave(m)} />
      </>}>
      <Field label="Issue Title"><input value={m.issue_title} onChange={e => set("issue_title", e.target.value)} placeholder="e.g. AC not cooling, faucet drip..." /></Field>
      <div className="form-grid-2">
        <Field label="Property"><select value={m.property_id} onChange={e => set("property_id", e.target.value)}>{properties.map(p => <option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}</select></Field>
        <Field label="Property Area"><select value={m.property_area} onChange={e => set("property_area", e.target.value)}>{PROPERTY_AREAS.map(a => <option key={a}>{a}</option>)}</select></Field>
        <Field label="Priority"><select value={m.priority} onChange={e => set("priority", e.target.value)}>{PRIORITIES.map(p => <option key={p}>{p}</option>)}</select></Field>
        <Field label="Status"><select value={m.status} onChange={e => set("status", e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Reported By"><select value={m.reported_by} onChange={e => set("reported_by", e.target.value)}>{["Guest","Cleaner","Owner","Manager"].map(r => <option key={r}>{r}</option>)}</select></Field>
        <Field label="Vendor"><select value={m.vendor} onChange={e => set("vendor", e.target.value)}><option value="">— None —</option>{vendors.map(v => <option key={v.name}>{v.name}</option>)}</select></Field>
        <Field label="Estimated Cost (JMD)"><input type="number" value={m.estimated_cost} onChange={e => set("estimated_cost", Number(e.target.value))} /></Field>
        <Field label="Actual Cost (JMD)"><input type="number" value={m.actual_cost} onChange={e => set("actual_cost", Number(e.target.value))} /></Field>
        <Field label="Reported Date"><input type="date" value={m.reported_date} onChange={e => set("reported_date", e.target.value)} /></Field>
        <Field label="Completion Date"><input type="date" value={m.completion_date} onChange={e => set("completion_date", e.target.value)} /></Field>
      </div>
      <Field label="Photo or Link"><input value={m.photo_or_link} onChange={e => set("photo_or_link", e.target.value)} placeholder="Google Drive link or photo URL" /></Field>
      <Field label="Notes"><textarea value={m.notes} onChange={e => set("notes", e.target.value)} rows={2} /></Field>
    </Modal>
  );
}

export function Maintenance({ propFilter }) {
  const { maintenance, setMaintenance, properties, settings } = useApp();
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const filtered = (propFilter === "ALL" ? maintenance : maintenance.filter(m => m.property_id === propFilter))
    .filter(m => statusFilter === "ALL" || m.status === statusFilter)
    .sort((a, b) => { const ord = { Urgent: 0, High: 1, Medium: 2, Low: 3 }; return (ord[a.priority] ?? 4) - (ord[b.priority] ?? 4); });
  const empty = { issue_id: "", property_id: properties[0]?.property_id || "", issue_title: "", property_area: "Bedroom", priority: "Medium", reported_by: "Manager", vendor: "", estimated_cost: 0, actual_cost: 0, status: "Open", reported_date: todayISO(), completion_date: "", photo_or_link: "", notes: "" };
  const save = m => { if (!m.issue_id) setMaintenance([...maintenance, { ...m, issue_id: uid("MNT") }]); else setMaintenance(maintenance.map(x => x.issue_id === m.issue_id ? m : x)); setEditing(null); };
  const del = id => { setMaintenance(maintenance.filter(x => x.issue_id !== id)); setEditing(null); };
  const getProp = id => properties.find(p => p.property_id === id);
  const pTone = { Low: "gray", Medium: "amber", High: "amber", Urgent: "red" };
  const sTone = { Open: "red", "In Progress": "blue", "Waiting on Vendor": "amber", Completed: "green", Cancelled: "gray" };

  return (
    <div className="page">
      <PageHeader title="Maintenance Tracker" subtitle="Log every property issue with priority, vendor, cost, and resolution status."
        helper="Small problems become bad reviews when they're forgotten. Log issues as soon as they happen — even low-priority ones."
        actions={<>
          <button className="btn-secondary" onClick={() => downloadCSV("maintenance.csv", filtered)}><Download size={14} /> Export</button>
          <button className="btn-primary" onClick={() => setEditing(empty)}><Plus size={14} /> Add Issue</button>
        </>} />
      <div className="status-filters">{["ALL", "Open", "In Progress", "Waiting on Vendor", "Completed", "Cancelled"].map(s => <button key={s} className={`status-filter-btn ${s === statusFilter ? "active" : ""}`} onClick={() => setStatusFilter(s)}>{s === "ALL" ? "All" : s}</button>)}</div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Issue</th><th>Property</th><th>Area</th><th>Priority</th><th>Vendor</th><th className="td-right">Est. Cost</th><th className="td-right">Actual</th><th>Status</th><th>Reported</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No maintenance issues. Add repairs or property concerns here.</td></tr>}
              {filtered.map(m => (
                <tr key={m.issue_id} className="tr-clickable" onClick={() => setEditing(m)}>
                  <td><div className="fw-bold">{m.issue_title}</div><div className="td-muted">{m.issue_id}</div></td>
                  <td>{getProp(m.property_id)?.property_name || "—"}</td>
                  <td>{m.property_area}</td>
                  <td><Chip tone={pTone[m.priority] || "gray"}>{m.priority}</Chip></td>
                  <td>{m.vendor || "—"}</td>
                  <td className="td-right num">{m.estimated_cost ? fmtCurrency(m.estimated_cost) : "—"}</td>
                  <td className="td-right num">{m.actual_cost ? fmtCurrency(m.actual_cost) : "—"}</td>
                  <td><Chip tone={sTone[m.status] || "gray"}>{m.status}</Chip></td>
                  <td className="num">{fmtDateShort(m.reported_date)}</td>
                  <td><ChevronRight size={14} color="var(--muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <MaintenanceForm record={editing} onClose={() => setEditing(null)} onSave={save} onDelete={del} properties={properties} vendors={settings.vendors} />}
    </div>
  );
}
