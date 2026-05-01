// ============================================================
//  SUPPLIES PAGE
// ============================================================
import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { PageHeader, Modal, Field, ConfirmBar, Chip, EmptyState } from "../components/index.jsx";
import { uid, todayISO, fmtCurrency, fmtDateShort, downloadCSV, supplyStatus, supplyChip, bookingTotal, calcNights, fmtPct, isDirectPlatform, inSelectedMonth, leadStatusChip } from "../utils/helpers.js";
import { EXPENSE_CATEGORIES } from "../data/sampleData.js";
import { Plus, Download, ChevronRight, Trash2 } from "lucide-react";

const SUPPLY_CATEGORIES = ["Bathroom", "Kitchen", "Cleaning", "Linen", "Guest Amenity", "Maintenance"];
const UNITS = ["rolls", "bottles", "packs", "pieces", "sets", "bags", "kg", "L"];

function SupplyForm({ record, onClose, onSave, onDelete, properties }) {
  const [s, setS] = useState({ ...record });
  const set = (k, v) => setS(p => ({ ...p, [k]: v }));
  return (
    <Modal open onClose={onClose} title={record.supply_id ? "Edit Supply" : "Add Supply Item"} wide
      footer={<>
        {record.supply_id && <button className="btn-danger" onClick={() => onDelete(record.supply_id)}><Trash2 size={13} /> Delete</button>}
        <div className="modal-footer-spacer" />
        <ConfirmBar onCancel={onClose} onSave={() => onSave(s)} />
      </>}>
      <div className="form-grid-2">
        <Field label="Item Name"><input value={s.item_name} onChange={e => set("item_name", e.target.value)} placeholder="e.g. Tissue, Bath Towels, Detergent" /></Field>
        <Field label="Category"><select value={s.category} onChange={e => set("category", e.target.value)}>{SUPPLY_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
      </div>
      <Field label="Property" helper="Leave blank if this item is shared across all properties.">
        <select value={s.property_id} onChange={e => set("property_id", e.target.value)}>
          <option value="">All Properties (shared)</option>
          {properties.map(p => <option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}
        </select>
      </Field>
      <div className="form-grid-2">
        <Field label="Current Quantity"><input type="number" value={s.current_quantity} onChange={e => set("current_quantity", Number(e.target.value))} /></Field>
        <Field label="Reorder Level" helper="Low-stock alert triggers at or below this level."><input type="number" value={s.reorder_level} onChange={e => set("reorder_level", Number(e.target.value))} /></Field>
        <Field label="Unit"><select value={s.unit} onChange={e => set("unit", e.target.value)}>{UNITS.map(u => <option key={u}>{u}</option>)}</select></Field>
        <Field label="Unit Cost (JMD)"><input type="number" value={s.unit_cost} onChange={e => set("unit_cost", Number(e.target.value))} /></Field>
        <Field label="Supplier"><input value={s.supplier} onChange={e => set("supplier", e.target.value)} placeholder="MegaMart, PriceSmart, Hi-Lo..." /></Field>
        <Field label="Last Restocked"><input type="date" value={s.last_restocked_date} onChange={e => set("last_restocked_date", e.target.value)} /></Field>
      </div>
      <Field label="Notes"><textarea value={s.notes} onChange={e => set("notes", e.target.value)} rows={2} /></Field>
    </Modal>
  );
}

export function Supplies({ propFilter }) {
  const { supplies, setSupplies, properties, settings } = useApp();
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const cur = settings.default_currency;

  const filtered = (propFilter === "ALL" ? supplies : supplies.filter(s => s.property_id === propFilter || !s.property_id))
    .map(s => ({ ...s, _status: supplyStatus(s.current_quantity, s.reorder_level) }))
    .filter(s => statusFilter === "ALL" || s._status === statusFilter)
    .sort((a, b) => { const ord = { "Out of Stock": 0, "Low Stock": 1, "In Stock": 2 }; return (ord[a._status] ?? 3) - (ord[b._status] ?? 3); });

  const empty = { supply_id: "", property_id: "", item_name: "", category: "Bathroom", current_quantity: 0, unit: "pieces", reorder_level: 0, unit_cost: 0, supplier: "", last_restocked_date: todayISO(), notes: "" };
  const save = s => { if (!s.supply_id) setSupplies([...supplies, { ...s, supply_id: uid("SUP") }]); else setSupplies(supplies.map(x => x.supply_id === s.supply_id ? s : x)); setEditing(null); };
  const del = id => { setSupplies(supplies.filter(x => x.supply_id !== id)); setEditing(null); };
  const getProp = id => properties.find(p => p.property_id === id);

  return (
    <div className="page">
      <PageHeader title="Supplies Inventory" subtitle="Track every consumable and linen item so the property never runs out of essentials."
        helper="Set a reorder level for each item. When current quantity drops to or below it, you'll see a low-stock alert on the dashboard."
        actions={<>
          <button className="btn-secondary" onClick={() => downloadCSV("supplies.csv", filtered)}><Download size={14} /> Export</button>
          <button className="btn-primary" onClick={() => setEditing(empty)}><Plus size={14} /> Add Item</button>
        </>} />
      <div className="status-filters">{["ALL", "Out of Stock", "Low Stock", "In Stock"].map(s => <button key={s} className={`status-filter-btn ${s === statusFilter ? "active" : ""}`} onClick={() => setStatusFilter(s)}>{s === "ALL" ? "All" : s}</button>)}</div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Item</th><th>Property</th><th>Category</th><th className="td-right">Current</th><th className="td-right">Reorder At</th><th>Unit</th><th className="td-right">Unit Cost</th><th>Last Restocked</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No supplies tracked yet. Add tissue, soap, towels, sheets, garbage bags, and more.</td></tr>}
              {filtered.map(s => (
                <tr key={s.supply_id} className="tr-clickable" onClick={() => setEditing(s)}>
                  <td className="fw-bold">{s.item_name}</td>
                  <td>{getProp(s.property_id)?.property_name || "All Properties"}</td>
                  <td>{s.category}</td>
                  <td className="td-right num fw-bold">{s.current_quantity}</td>
                  <td className="td-right num" style={{ color: "var(--muted)" }}>{s.reorder_level}</td>
                  <td>{s.unit}</td>
                  <td className="td-right num">{fmtCurrency(s.unit_cost, cur)}</td>
                  <td className="num">{fmtDateShort(s.last_restocked_date)}</td>
                  <td><Chip tone={supplyChip(s._status)}>{s._status}</Chip></td>
                  <td><ChevronRight size={14} color="var(--muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <SupplyForm record={editing} onClose={() => setEditing(null)} onSave={save} onDelete={del} properties={properties} />}
    </div>
  );
}

// ============================================================
//  REVENUE & PROFIT PAGE
// ============================================================
function ExpenseForm({ record, onClose, onSave, onDelete, properties }) {
  const [e, setE] = useState({ ...record });
  const set = (k, v) => setE(p => ({ ...p, [k]: v }));
  return (
    <Modal open onClose={onClose} title={record.expense_id ? "Edit Expense" : "Add Expense"} wide
      footer={<>
        {record.expense_id && <button className="btn-danger" onClick={() => onDelete(record.expense_id)}><Trash2 size={13} /> Delete</button>}
        <div className="modal-footer-spacer" />
        <ConfirmBar onCancel={onClose} onSave={() => onSave(e)} />
      </>}>
      <div className="form-grid-2">
        <Field label="Property">
          <select value={e.property_id} onChange={x => set("property_id", x.target.value)}>
            <option value="">All / Shared</option>
            {properties.map(p => <option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}
          </select>
        </Field>
        <Field label="Date"><input type="date" value={e.expense_date} onChange={x => set("expense_date", x.target.value)} /></Field>
        <Field label="Category"><select value={e.category} onChange={x => set("category", x.target.value)}>{EXPENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></Field>
        <Field label="Amount (JMD)"><input type="number" value={e.amount} onChange={x => set("amount", Number(x.target.value))} /></Field>
      </div>
      <Field label="Description / Vendor"><input value={e.description} onChange={x => set("description", x.target.value)} placeholder="e.g. Monthly electricity bill — JPS" /></Field>
      <div className="form-grid-2">
        <Field label="Paid By"><select value={e.paid_by} onChange={x => set("paid_by", x.target.value)}>{["Manager","Owner","Co-host","Cleaner"].map(v => <option key={v}>{v}</option>)}</select></Field>
        <Field label="Receipt Link"><input value={e.receipt_link} onChange={x => set("receipt_link", x.target.value)} placeholder="Google Drive link..." /></Field>
      </div>
      <Field label="Notes"><textarea value={e.notes} onChange={x => set("notes", x.target.value)} rows={2} /></Field>
    </Modal>
  );
}


export function Revenue({ monthFilter, propFilter }) {
  const { expenses, setExpenses, bookings, properties, settings } = useApp();
  const [editing, setEditing] = useState(null);
  const cur = settings.default_currency;

  const filterExp = propFilter === "ALL" ? expenses : expenses.filter(e => e.property_id === propFilter || !e.property_id);
  const filterBk = propFilter === "ALL" ? bookings : bookings.filter(b => b.property_id === propFilter);
  const monthExpenses = filterExp.filter(e => inSelectedMonth(e.expense_date, monthFilter)).sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));
  const monthBookings = filterBk.filter(b => b.booking_status !== "Cancelled" && (inSelectedMonth(b.checkin_date, monthFilter) || inSelectedMonth(b.checkout_date, monthFilter)));

  const grossRevenue = monthBookings.reduce((s, b) => s + bookingTotal(b), 0);
  const totalExpenses = monthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const platformFees = grossRevenue * Number(settings.platform_fee_percentage || 0);
  const managementFee = grossRevenue * Number(settings.management_fee_percentage || 0);
  const taxReserve = grossRevenue * Number(settings.tax_reserve_percentage || 0);
  const netProfit = grossRevenue - platformFees - totalExpenses - managementFee - taxReserve;

  const byCategory = {};
  monthExpenses.forEach(e => { byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount || 0); });
  const catEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...catEntries.map(([, v]) => v), 1);

  const empty = { expense_id: "", property_id: "", expense_date: todayISO(), category: "Cleaning", vendor: "", description: "", amount: 0, reimbursable: false, paid_by: "Manager", receipt_link: "", notes: "" };
  const save = e => { if (!e.expense_id) setExpenses([...expenses, { ...e, expense_id: uid("EXP") }]); else setExpenses(expenses.map(x => x.expense_id === e.expense_id ? e : x)); setEditing(null); };
  const del = id => { setExpenses(expenses.filter(x => x.expense_id !== id)); setEditing(null); };
  const getProp = id => properties.find(p => p.property_id === id);

  return (
    <div className="page">
      <PageHeader title="Revenue & Profit Tracker" subtitle={`Real money in, real money out — ${monthFilter}`}
        helper="Revenue alone is not profit. Log every expense here so you can see exactly what you keep after cleaning, utilities, repairs, supplies, and fees."
        actions={<>
          <button className="btn-secondary" onClick={() => downloadCSV("expenses.csv", monthExpenses)}><Download size={14} /> Export</button>
          <button className="btn-primary" onClick={() => setEditing(empty)}><Plus size={14} /> Add Expense</button>
        </>} />
      <div className="metric-grid" style={{ marginBottom: 22 }}>
        <div className="metric-card navy"><div className="metric-label">Gross Revenue</div><div className="metric-value num">{fmtCurrency(grossRevenue, cur)}</div><div className="metric-sub">{monthBookings.length} bookings</div></div>
        <div className="metric-card sand"><div className="metric-label">Total Expenses</div><div className="metric-value num">{fmtCurrency(totalExpenses, cur)}</div><div className="metric-sub">{monthExpenses.length} entries</div></div>
        <div className="metric-card sand"><div className="metric-label">Fees + Reserves</div><div className="metric-value num">{fmtCurrency(platformFees + managementFee + taxReserve, cur)}</div><div className="metric-sub">Platform, mgmt, tax</div></div>
        <div className={`metric-card ${netProfit >= 0 ? "teal" : "red"}`}><div className="metric-label">Net Profit</div><div className="metric-value num">{fmtCurrency(netProfit, cur)}</div><div className="metric-sub">After everything</div></div>
      </div>
      <div className="grid-2" style={{ marginBottom: 22, alignItems: "start" }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 className="section-title">Expenses This Month</h3>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Category</th><th>Description</th><th>Property</th><th className="td-right">Amount</th><th></th></tr></thead>
              <tbody>
                {monthExpenses.length === 0 && <tr><td colSpan={6} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>No expenses logged this month.</td></tr>}
                {monthExpenses.map(e => (
                  <tr key={e.expense_id} className="tr-clickable" onClick={() => setEditing(e)}>
                    <td className="num">{fmtDateShort(e.expense_date)}</td>
                    <td><Chip tone="gray">{e.category}</Chip></td>
                    <td>{e.description}</td>
                    <td>{getProp(e.property_id)?.property_name || "Shared"}</td>
                    <td className="td-right num fw-bold">{fmtCurrency(e.amount, cur)}</td>
                    <td><ChevronRight size={14} color="var(--muted)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card-sand" style={{ padding: 18, borderRadius: "var(--radius)" }}>
          <h3 className="section-title">Expenses by Category</h3>
          {catEntries.length === 0 ? <p style={{ color: "var(--muted)", fontSize: 13 }}>No expenses to show.</p> :
            catEntries.map(([cat, val]) => (
              <div key={cat} className="exp-bar-row">
                <div className="exp-bar-labels"><span>{cat}</span><span className="num fw-bold">{fmtCurrency(val, cur)}</span></div>
                <div className="exp-bar-track"><div className="exp-bar-fill" style={{ width: `${(val / maxCat) * 100}%` }} /></div>
              </div>
            ))
          }
        </div>
      </div>
      {editing && <ExpenseForm record={editing} onClose={() => setEditing(null)} onSave={save} onDelete={del} properties={properties} />}
    </div>
  );
}

// ============================================================
//  DIRECT LEADS PAGE
// ============================================================
const LEAD_SOURCES = ["Instagram", "WhatsApp", "Google", "Past Guest", "Referral", "Website", "Phone Call", "Other"];
const LEAD_STATUSES = ["New", "Interested", "Quote Sent", "Follow Up", "Booked", "Lost", "No Response"];

function LeadForm({ record, onClose, onSave, onDelete, properties }) {
  const [l, setL] = useState({ ...record });
  const set = (k, v) => setL(p => ({ ...p, [k]: v }));
  return (
    <Modal open onClose={onClose} title={record.lead_id ? "Edit Lead" : "Add Direct Booking Lead"} wide
      footer={<>
        {record.lead_id && <button className="btn-danger" onClick={() => onDelete(record.lead_id)}><Trash2 size={13} /> Delete</button>}
        <div className="modal-footer-spacer" />
        <ConfirmBar onCancel={onClose} onSave={() => onSave(l)} />
      </>}>
      <div className="form-grid-2">
        <Field label="Lead Name"><input value={l.lead_name} onChange={e => set("lead_name", e.target.value)} /></Field>
        <Field label="Source"><select value={l.source} onChange={e => set("source", e.target.value)}>{LEAD_SOURCES.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Phone / WhatsApp"><input value={l.phone} onChange={e => set("phone", e.target.value)} /></Field>
        <Field label="Email"><input type="email" value={l.email} onChange={e => set("email", e.target.value)} /></Field>
        <Field label="Property Interested">
          <select value={l.property_interested} onChange={e => set("property_interested", e.target.value)}>
            <option value="">— Any Property —</option>
            {properties.map(p => <option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}
          </select>
        </Field>
        <Field label="Dates Requested"><input value={l.dates_requested} onChange={e => set("dates_requested", e.target.value)} placeholder="e.g. July 10–14" /></Field>
        <Field label="Number of Guests"><input type="number" value={l.number_of_guests} onChange={e => set("number_of_guests", Number(e.target.value))} /></Field>
        <Field label="Budget (JMD)"><input type="number" value={l.budget} onChange={e => set("budget", Number(e.target.value))} /></Field>
        <Field label="Status"><select value={l.status} onChange={e => set("status", e.target.value)}>{LEAD_STATUSES.map(s => <option key={s}>{s}</option>)}</select></Field>
        <Field label="Follow-up Date"><input type="date" value={l.followup_date} onChange={e => set("followup_date", e.target.value)} /></Field>
      </div>
      <label className="toggle-row"><input type="checkbox" checked={!!l.quote_sent} onChange={e => set("quote_sent", e.target.checked)} /> Quote sent to this lead</label>
      <Field label="Message Template Used"><input value={l.message_template_used} onChange={e => set("message_template_used", e.target.value)} placeholder="e.g. Direct Booking Inquiry Reply" /></Field>
      <Field label="Notes"><textarea value={l.notes} onChange={e => set("notes", e.target.value)} rows={3} /></Field>
    </Modal>
  );
}


export function Leads({ propFilter }) {
  const { leads, setLeads, properties } = useApp();
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const filtered = (propFilter === "ALL" ? leads : leads.filter(l => l.property_interested === propFilter || !l.property_interested))
    .filter(l => statusFilter === "ALL" || l.status === statusFilter);
  const empty = { lead_id: "", lead_name: "", source: "Instagram", phone: "", email: "", property_interested: "", dates_requested: "", number_of_guests: 1, budget: 0, quote_sent: false, followup_date: todayISO(), status: "New", message_template_used: "", notes: "" };
  const save = l => { if (!l.lead_id) setLeads([...leads, { ...l, lead_id: uid("LEAD") }]); else setLeads(leads.map(x => x.lead_id === l.lead_id ? l : x)); setEditing(null); };
  const del = id => { setLeads(leads.filter(x => x.lead_id !== id)); setEditing(null); };
  const getProp = id => properties.find(p => p.property_id === id);

  return (
    <div className="page">
      <PageHeader title="Direct Booking Leads" subtitle="Track every enquiry from Instagram, WhatsApp, Google, past guests, and referrals."
        helper="Not every guest has to come from Airbnb. Track direct leads here, follow up, and convert more enquiries into bookings — with no platform fees."
        actions={<>
          <button className="btn-secondary" onClick={() => downloadCSV("leads.csv", filtered)}><Download size={14} /> Export</button>
          <button className="btn-primary" onClick={() => setEditing(empty)}><Plus size={14} /> Add Lead</button>
        </>} />
      <div className="status-filters">{["ALL", ...LEAD_STATUSES].map(s => <button key={s} className={`status-filter-btn ${s === statusFilter ? "active" : ""}`} onClick={() => setStatusFilter(s)}>{s === "ALL" ? "All" : s}</button>)}</div>
      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Lead</th><th>Source</th><th>Contact</th><th>Property</th><th>Dates</th><th>Guests</th><th className="td-right">Budget</th><th>Quote</th><th>Status</th><th>Follow-up</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={11} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No direct leads yet. Add leads from WhatsApp, Instagram, referrals, or past guests.</td></tr>}
              {filtered.map(l => (
                <tr key={l.lead_id} className="tr-clickable" onClick={() => setEditing(l)}>
                  <td><div className="fw-bold">{l.lead_name}</div><div className="td-muted">{l.lead_id}</div></td>
                  <td><Chip tone="teal">{l.source}</Chip></td>
                  <td>{l.phone || l.email || "—"}</td>
                  <td>{getProp(l.property_interested)?.property_name || "—"}</td>
                  <td>{l.dates_requested || "—"}</td>
                  <td className="num">{l.number_of_guests || "—"}</td>
                  <td className="td-right num">{l.budget ? fmtCurrency(l.budget) : "—"}</td>
                  <td>{l.quote_sent ? <Chip tone="green">Sent</Chip> : <Chip tone="gray">No</Chip>}</td>
                  <td><Chip tone={leadStatusChip(l.status)}>{l.status}</Chip></td>
                  <td className="num">{fmtDateShort(l.followup_date)}</td>
                  <td><ChevronRight size={14} color="var(--muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {editing && <LeadForm record={editing} onClose={() => setEditing(null)} onSave={save} onDelete={del} properties={properties} />}
    </div>
  );
}
