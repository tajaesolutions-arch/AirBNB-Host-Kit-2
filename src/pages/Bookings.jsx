import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { PageHeader, Modal, Field, ConfirmBar, Chip } from "../components/index.jsx";
import { uid, todayISO, calcNights, bookingTotal, fmtCurrency, fmtDateShort, downloadCSV, bookingStatusChip, paymentStatusChip } from "../utils/helpers.js";
import { PLATFORMS } from "../data/sampleData.js";
import { Plus, Download, ChevronRight, Trash2 } from "lucide-react";

const STATUSES = ["Confirmed", "Checked In", "Checked Out", "Cancelled"];
const PAYMENT_STATUSES = ["Paid", "Partial", "Unpaid", "Pending"];

function BookingForm({ record, onClose, onSave, onDelete, properties }) {
  const [b, setB] = useState({ ...record });
  const set = (k, v) => setB(p => ({ ...p, [k]: v }));
  const nights = calcNights(b.checkin_date, b.checkout_date);
  const total = bookingTotal(b);

  return (
    <Modal open onClose={onClose} title={record.booking_id ? "Edit Booking" : "Add Booking"} wide
      footer={<>
        {record.booking_id && <button className="btn-danger" onClick={() => onDelete(record.booking_id)}><Trash2 size={13} /> Delete</button>}
        <div className="modal-footer-spacer" />
        <ConfirmBar onCancel={onClose} onSave={() => onSave(b)} saveLabel={record.booking_id ? "Save Changes" : "Create Booking"} />
      </>}>
      <div className="form-grid-2">
        <Field label="Guest Name"><input value={b.guest_name} onChange={e => set("guest_name", e.target.value)} placeholder="e.g. Alicia Smith" /></Field>
        <Field label="Property">
          <select value={b.property_id} onChange={e => set("property_id", e.target.value)}>
            {properties.map(p => <option key={p.property_id} value={p.property_id}>{p.property_name}</option>)}
          </select>
        </Field>
        <Field label="Platform">
          <select value={b.platform} onChange={e => set("platform", e.target.value)}>
            {PLATFORMS.map(p => <option key={p}>{p}</option>)}
          </select>
        </Field>
        <Field label="Booking Status">
          <select value={b.booking_status} onChange={e => set("booking_status", e.target.value)}>
            {STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Check-in Date"><input type="date" value={b.checkin_date} onChange={e => set("checkin_date", e.target.value)} /></Field>
        <Field label="Check-out Date"><input type="date" value={b.checkout_date} onChange={e => set("checkout_date", e.target.value)} /></Field>
        <Field label="Nightly Rate (JMD)" helper={`${nights} nights × rate`}><input type="number" value={b.nightly_rate} onChange={e => set("nightly_rate", Number(e.target.value))} /></Field>
        <Field label="Cleaning Fee (JMD)"><input type="number" value={b.cleaning_fee} onChange={e => set("cleaning_fee", Number(e.target.value))} /></Field>
        <Field label="Extra Fees (JMD)" helper="Late checkout, extra guest, etc."><input type="number" value={b.extra_fees} onChange={e => set("extra_fees", Number(e.target.value))} /></Field>
        <Field label="Discounts (JMD)"><input type="number" value={b.discounts} onChange={e => set("discounts", Number(e.target.value))} /></Field>
      </div>
      <Field label="Payment Status">
        <select value={b.payment_status} onChange={e => set("payment_status", e.target.value)}>
          {PAYMENT_STATUSES.map(s => <option key={s}>{s}</option>)}
        </select>
      </Field>
      <Field label="Notes"><textarea value={b.source_notes} onChange={e => set("source_notes", e.target.value)} rows={2} /></Field>
      <div style={{ marginTop: 14, padding: 14, background: "var(--sand-soft)", borderRadius: 10, border: "1px solid var(--line-strong)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted)", textTransform: "uppercase" }}>Total Booking Revenue</div>
          <div className="num" style={{ fontFamily: "Fraunces, serif", fontSize: 24, fontWeight: 600 }}>{fmtCurrency(total)}</div>
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)", textAlign: "right" }}>(rate × nights) + cleaning + extras − discounts</div>
      </div>
    </Modal>
  );
}

export default function Bookings({
  monthFilter,
  propFilter,
  pageAction,
  onPageActionHandled,
}) {
  const { bookings, setBookings, properties, settings } = useApp();
  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const cur = settings.default_currency;

  const filtered = (propFilter === "ALL" ? bookings : bookings.filter(b => b.property_id === propFilter))
    .filter(b => statusFilter === "ALL" || b.booking_status === statusFilter)
    .sort((a, b) => new Date(b.checkin_date) - new Date(a.checkin_date));

  const emptyRecord = {
    booking_id: "",
    property_id: properties[0]?.property_id || "",
    guest_id: "",
    guest_name: "",
    platform: "Airbnb",
    checkin_date: todayISO(),
    checkout_date: todayISO(),
    nightly_rate: 0,
    cleaning_fee: 0,
    extra_fees: 0,
    discounts: 0,
    payment_status: "Pending",
    booking_status: "Confirmed",
    source_notes: "",
  };

  useEffect(() => {
    if (pageAction === "add-booking") {
      setEditing(emptyRecord);
      onPageActionHandled?.();
    }
  }, [pageAction]);

  const save = b => {
    if (!b.booking_id) setBookings([...bookings, { ...b, booking_id: uid("BK") }]);
    else setBookings(bookings.map(x => x.booking_id === b.booking_id ? b : x));
    setEditing(null);
  };

  const del = id => {
    setBookings(bookings.filter(x => x.booking_id !== id));
    setEditing(null);
  };

  const getProp = id => properties.find(p => p.property_id === id);

  return (
    <div className="page">
      <PageHeader
        title="Booking Calendar"
        subtitle="Every reservation across every channel — Airbnb, Booking.com, WhatsApp, Instagram, direct."
        helper="Add every booking here, even if it came from WhatsApp or a direct guest. This is how the app calculates revenue, occupancy, cleaning tasks, and profit."
        actions={<>
          <button className="btn-secondary" onClick={() => downloadCSV("bookings.csv", filtered)}><Download size={14} /> Export CSV</button>
          <button className="btn-primary" onClick={() => setEditing(emptyRecord)}><Plus size={14} /> Add Booking</button>
        </>}
      />

      <div className="status-filters">
        {["ALL", "Confirmed", "Checked In", "Checked Out", "Cancelled"].map(s => (
          <button key={s} className={`status-filter-btn ${s === statusFilter ? "active" : ""}`} onClick={() => setStatusFilter(s)}>
            {s === "ALL" ? "All Status" : s}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest</th><th>Property</th><th>Platform</th><th>Check-in</th><th>Check-out</th>
                <th className="td-right">Nights</th><th className="td-right">Total</th>
                <th>Payment</th><th>Status</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>No bookings yet — click Add Booking to get started.</td></tr>
              )}
              {filtered.map(b => {
                const nights = calcNights(b.checkin_date, b.checkout_date);
                return (
                  <tr key={b.booking_id} className="tr-clickable" onClick={() => setEditing(b)}>
                    <td><div className="fw-bold">{b.guest_name}</div><div className="td-muted">{b.booking_id}</div></td>
                    <td>{getProp(b.property_id)?.property_name || "—"}</td>
                    <td><Chip tone={["Direct","WhatsApp","Instagram","Referral"].includes(b.platform) ? "teal" : "blue"}>{b.platform}</Chip></td>
                    <td className="num">{fmtDateShort(b.checkin_date)}</td>
                    <td className="num">{fmtDateShort(b.checkout_date)}</td>
                    <td className="td-right num">{nights}</td>
                    <td className="td-right num fw-bold">{fmtCurrency(bookingTotal(b), cur)}</td>
                    <td><Chip tone={paymentStatusChip(b.payment_status)}>{b.payment_status}</Chip></td>
                    <td><Chip tone={bookingStatusChip(b.booking_status)}>{b.booking_status}</Chip></td>
                    <td><ChevronRight size={14} color="var(--muted)" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {editing && (
        <BookingForm
          record={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={del}
          properties={properties}
        />
      )}
    </div>
  );
}
