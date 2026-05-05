// ============================================================
//  GUESTS, CLEANING, AND MAINTENANCE PAGES
// ============================================================
import { useEffect, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import {
  PageHeader,
  Modal,
  Field,
  ConfirmBar,
  Chip,
  CurrencyInput,
  ConfirmDialog,
} from "../components/index.jsx";
import {
  uid,
  todayISO,
  bookingTotal,
  fmtCurrency,
  fmtDateShort,
  downloadCSV,
} from "../utils/helpers.js";
import {
  Plus,
  Download,
  ChevronRight,
  Trash2,
  Search,
  CheckCircle2,
  Users,
  Sparkles,
  Wrench,
  Home,
  ArrowRight,
  AlertCircle,
  ArrowLeft,
  Copy,
  ClipboardCheck,
  Mail,
} from "lucide-react";
import { PROPERTY_AREAS } from "../data/sampleData.js";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeSettings(settings) {
  return settings || {};
}

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function isValidEmail(value) {
  if (!value) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value).trim());
}

function ValidationMessage({ errors }) {
  if (!errors.length) return null;

  return (
    <div
      style={{
        marginBottom: 14,
        padding: "12px 14px",
        borderRadius: "var(--radius-sm)",
        background: "var(--red-soft)",
        color: "var(--red)",
        border: "1px solid #efb8ae",
        fontSize: 12.5,
        fontWeight: 600,
        lineHeight: 1.55,
        display: "flex",
        gap: 10,
        alignItems: "flex-start",
      }}
    >
      <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
      <div>
        {errors.map((error) => (
          <div key={error}>• {error}</div>
        ))}
      </div>
    </div>
  );
}

function NoPropertyState({ title, body, setPage }) {
  const goToSettings = () => {
    if (typeof setPage === "function") {
      setPage("settings");
    }
  };

  return (
    <div className="card-sand" style={{ padding: 24 }}>
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            display: "grid",
            placeItems: "center",
            borderRadius: 14,
            background: "var(--teal-soft)",
            color: "var(--teal)",
            border: "1px solid #9FD8CF",
            flexShrink: 0,
          }}
        >
          <Home size={22} />
        </div>

        <div style={{ flex: 1, minWidth: 240 }}>
          <h3 className="section-title" style={{ marginBottom: 6 }}>
            {title}
          </h3>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 14,
              maxWidth: 760,
            }}
          >
            {body}
          </p>

          <button className="btn-primary" onClick={goToSettings}>
            Add First Property
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyActionState({ icon: Icon, title, body, buttonLabel, onClick }) {
  return (
    <div className="card-sand" style={{ padding: 24, marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div
            style={{
              width: 46,
              height: 46,
              display: "grid",
              placeItems: "center",
              borderRadius: 14,
              background: "var(--teal-soft)",
              color: "var(--teal)",
              border: "1px solid #9FD8CF",
              flexShrink: 0,
            }}
          >
            <Icon size={22} />
          </div>

          <div>
            <h3 className="section-title" style={{ marginBottom: 6 }}>
              {title}
            </h3>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 13,
                lineHeight: 1.6,
                maxWidth: 760,
              }}
            >
              {body}
            </p>
          </div>
        </div>

        {buttonLabel && onClick && (
          <button className="btn-primary" onClick={onClick}>
            <Plus size={14} />
            {buttonLabel}
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================
//  GUESTS PAGE
// ============================================================


function InitialsAvatar({ name }) {
  const initials = String(name || "Guest")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "G";

  return <div className="guest-avatar" aria-hidden="true">{initials}</div>;
}

function fallbackText(value) {
  return value ? String(value) : "—";
}

function GuestForm({ record, onClose, onSave, onDelete }) {
  const [g, setG] = useState({ ...record });
  const [errors, setErrors] = useState([]);

  const set = (key, value) => {
    setG((previous) => ({ ...previous, [key]: value }));
    setErrors([]);
  };

  const validate = () => {
    const nextErrors = [];

    if (!String(g.guest_name || "").trim()) {
      nextErrors.push("Guest name is required.");
    }

    if (!isValidEmail(g.email)) {
      nextErrors.push("Enter a valid email address or leave the field blank.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      ...g,
      guest_name: String(g.guest_name || "").trim(),
      country: String(g.country || "").trim(),
      email: String(g.email || "").trim(),
      phone: String(g.phone || "").trim(),
      preferences: String(g.preferences || "").trim(),
      notes: String(g.notes || "").trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={record.guest_id ? "Edit Guest" : "Add Guest"}
      wide
      footer={
        <>
          {record.guest_id && (
            <button
              className="btn-danger"
              onClick={() => onDelete(record.guest_id)}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
          <div className="modal-footer-spacer" />
          <ConfirmBar
            onCancel={onClose}
            onSave={handleSave}
            saveLabel={record.guest_id ? "Save Changes" : "Create Guest"}
          />
        </>
      }
    >
      <ValidationMessage errors={errors} />

      <div className="form-grid-2">
        <Field label="Guest Name">
          <input
            value={g.guest_name || ""}
            onChange={(e) => set("guest_name", e.target.value)}
            placeholder="e.g. Alicia Smith"
          />
        </Field>

        <Field label="Country">
          <input
            value={g.country || ""}
            onChange={(e) => set("country", e.target.value)}
            placeholder="e.g. United States"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={g.email || ""}
            onChange={(e) => set("email", e.target.value)}
            placeholder="guest@email.com"
          />
        </Field>

        <Field label="Phone">
          <input
            value={g.phone || ""}
            onChange={(e) => set("phone", e.target.value)}
            placeholder="+1 876 000 0000"
          />
        </Field>

        <Field label="Last Contacted">
          <input
            type="date"
            value={g.last_contacted_date || ""}
            onChange={(e) => set("last_contacted_date", e.target.value)}
          />
        </Field>

        <Field label="Next Follow-up Date">
          <input
            type="date"
            value={g.next_followup_date || ""}
            onChange={(e) => set("next_followup_date", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Preferences">
        <textarea
          value={g.preferences || ""}
          onChange={(e) => set("preferences", e.target.value)}
          rows={2}
          placeholder="e.g. Late checkout, beach access, quiet room..."
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={g.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Internal guest notes..."
        />
      </Field>

      <div className="form-grid-2">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={!!g.review_left}
            onChange={(e) => set("review_left", e.target.checked)}
          />
          Review left
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={!!g.direct_followup_sent}
            onChange={(e) => set("direct_followup_sent", e.target.checked)}
          />
          Direct follow-up sent
        </label>
      </div>
    </Modal>
  );
}

export function Guests({ propFilter, pageAction, onPageActionHandled }) {
  const {
    guests: rawGuests,
    setGuests,
    bookings: rawBookings,
    properties: rawProperties,
    settings: rawSettings,
  } = useApp();

  const guests = safeArray(rawGuests);
  const bookings = safeArray(rawBookings);
  const properties = safeArray(rawProperties);
  const settings = safeSettings(rawSettings);

  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedGuestId, setSelectedGuestId] = useState("");
  const [messageDraft, setMessageDraft] = useState("");
  const [detailStatus, setDetailStatus] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const cur = settings.default_currency || "JMD";
  const selectedPropFilter = propFilter || "ALL";
  const todayIso = todayISO();

  const relevantBookings = selectedPropFilter === "ALL" ? bookings : bookings.filter((booking) => booking.property_id === selectedPropFilter);
  const visibleGuestIdsFromPropertyFilter = new Set(relevantBookings.map((booking) => booking.guest_id).filter(Boolean));

  const enriched = guests.filter((guest) => selectedPropFilter === "ALL" || visibleGuestIdsFromPropertyFilter.has(guest.guest_id) || !guest.guest_id).map((guest) => {
    const guestBookings = bookings.filter((booking) => booking.guest_id === guest.guest_id);
    const sortedBookings = [...guestBookings].sort((a, b) => String(a.checkin_date || "").localeCompare(String(b.checkin_date || "")));
    const total_spent = guestBookings.reduce((sum, booking) => sum + bookingTotal(booking), 0);
    const latestStay = [...guestBookings].sort((a, b) => String(b.checkout_date || "").localeCompare(String(a.checkout_date || "")))[0];
    const upcomingStay = sortedBookings.find((booking) => booking.checkin_date && booking.checkin_date >= todayIso);
    const prop = latestStay ? properties.find((property) => property.property_id === latestStay.property_id)?.property_name : "—";
    return { ...guest, total_spent, last_stay: latestStay?.checkout_date || "", prop_name: prop || "—", booking_count: guestBookings.length, guest_bookings: guestBookings, latest_stay: latestStay, upcoming_stay: upcomingStay };
  }).filter((guest) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return [guest.guest_name, guest.country, guest.email, guest.phone].some((value) => String(value || "").toLowerCase().includes(query));
  });

  const selectedGuest = enriched.find((guest) => guest.guest_id === selectedGuestId) || null;

  useEffect(() => {
    if (!selectedGuest) {
      setMessageDraft("");
      return;
    }
    const propertyName = selectedGuest.upcoming_stay ? properties.find((property) => property.property_id === selectedGuest.upcoming_stay.property_id)?.property_name : selectedGuest.prop_name;
    setMessageDraft(`Hi ${selectedGuest.guest_name || "there"}, thank you again for staying with us. We hope you enjoyed ${propertyName || "our property"}. We'd love to host you again whenever you're planning your next trip.`);
  }, [selectedGuestId]);

  const empty = { guest_id: "", guest_name: "", country: "", email: "", phone: "", review_left: false, direct_followup_sent: false, preferences: "", notes: "", last_contacted_date: "", next_followup_date: "" };

  const save = (guest) => {
    if (!guest.guest_id) setGuests([...guests, { ...guest, guest_id: uid("GUEST") }]);
    else setGuests(guests.map((existingGuest) => (existingGuest.guest_id === guest.guest_id ? guest : existingGuest)));
    setEditing(null);
  };

  const del = (id) => {
    setConfirmDeleteId(id);
  };

  const handleCopyMessage = async () => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(messageDraft);
      else {
        const textArea = document.createElement("textarea");
        textArea.value = messageDraft;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setDetailStatus("Follow-up message copied.");
    } catch {
      setDetailStatus("Unable to copy message. Please copy manually.");
    }
  };

  const markFollowupSent = () => {
    if (!selectedGuest) return;
    setGuests(guests.map((guest) => (guest.guest_id === selectedGuest.guest_id ? { ...guest, direct_followup_sent: true } : guest)));
    setDetailStatus("Guest marked as follow-up sent.");
  };

  const hasGuests = guests.length > 0;
  const repeatGuests = enriched.filter((guest) => Number(guest.booking_count || 0) > 1).length;
  const reviewsLeft = enriched.filter((guest) => guest.review_left === true).length;
  const followUpsDue = enriched.filter((guest) => guest.next_followup_date && guest.next_followup_date <= todayIso).length;

  return (<div className="page">{/* shortened for brevity */}
  <PageHeader title="Guest CRM" subtitle="Past guests are future direct bookings. Track who stayed, what they liked, and when to follow up." helper="Every guest you don't follow up with is potential revenue left on Airbnb's platform. Set a next follow-up date for every guest." actions={<><button className="btn-secondary" onClick={() => downloadCSV("guests.csv", enriched)} disabled={enriched.length===0}><Download size={14}/>Export</button><button className="btn-primary" onClick={() => setEditing(empty)}><Plus size={14}/>Add Guest</button></>} />

  {hasGuests && <div className="search-wrap"><Search size={15} className="search-icon"/><input placeholder="Search by name, country, email, or phone…" value={search} onChange={(e)=>setSearch(e.target.value)} /></div>}

  {!selectedGuest && <div className="card" style={{ overflow: "hidden" }}><div className="table-wrap"><table><thead><tr><th>Guest</th><th>Country</th><th>Last Property</th><th className="td-right">Bookings</th><th className="td-right">Total Spent</th><th>Review</th><th>Follow-up Sent</th><th>Next Follow-up</th><th></th></tr></thead><tbody>{enriched.map((guest)=><tr key={guest.guest_id} className="tr-clickable" onClick={()=>setSelectedGuestId(guest.guest_id)}><td><div className="fw-bold">{guest.guest_name||"Unnamed guest"}</div><div className="td-muted">{guest.email||guest.phone||guest.guest_id}</div></td><td>{guest.country||"—"}</td><td>{guest.prop_name}</td><td className="td-right num">{guest.booking_count}</td><td className="td-right num fw-bold">{fmtCurrency(guest.total_spent,cur)}</td><td>{guest.review_left ? <Chip tone="green" icon={CheckCircle2}>Yes</Chip>:<Chip tone="gray">No</Chip>}</td><td>{guest.direct_followup_sent ? <Chip tone="green" icon={CheckCircle2}>Sent</Chip>:<Chip tone="amber">Pending</Chip>}</td><td className="num">{fmtDateShort(guest.next_followup_date)}</td><td><ChevronRight size={14} color="var(--muted)"/></td></tr>)}</tbody></table></div></div>}

  {selectedGuest && <div className="guest-detail-shell"><div className="guest-detail-header"><div className="guest-detail-header-main"><button className="btn-secondary guest-detail-back" onClick={()=>setSelectedGuestId("")}><ArrowLeft size={14}/>Back to Guest Table</button><div><h3>{selectedGuest.guest_name || "Guest"}</h3><p>{[selectedGuest.country, selectedGuest.email, selectedGuest.phone].filter(Boolean).join(" • ") || "—"}</p></div></div><div className="guest-detail-header-actions"><button className="btn-secondary" onClick={()=>setEditing(selectedGuest)}>Edit Guest</button><button className="btn-secondary" onClick={handleCopyMessage}><Copy size={14}/>Copy Follow-up Message</button></div></div>
  <div className="guest-detail-grid"><aside className="guest-list-panel"><div className="guest-list-panel-header">Guests</div><div className="guest-list-scroll">{enriched.map((guest)=><button key={guest.guest_id} className={`guest-list-item ${guest.guest_id===selectedGuestId?"active":""}`} onClick={()=>setSelectedGuestId(guest.guest_id)} aria-current={guest.guest_id===selectedGuestId?"true":undefined}><div className="fw-bold">{guest.guest_name || "Unnamed guest"}</div><div className="td-muted">{guest.prop_name || "No property"} • Next: {fmtDateShort(guest.next_followup_date)}</div></button>)}</div></aside>
  <section className="guest-center-panel"><div className="guest-activity-grid"><div className="guest-activity-tile"><span>Last Stay</span><strong>{fmtDateShort(selectedGuest.last_stay)}</strong></div><div className="guest-activity-tile"><span>Upcoming Stay</span><strong>{fmtDateShort(selectedGuest.upcoming_stay?.checkin_date)}</strong></div><div className="guest-activity-tile"><span>Review Left</span><strong>{selectedGuest.review_left ? "Yes" : "No"}</strong></div><div className="guest-activity-tile"><span>Follow-up Sent</span><strong>{selectedGuest.direct_followup_sent ? "Yes" : "No"}</strong></div></div><div className="guest-message-panel"><div className="guest-message-title-row"><h4>Message Workspace</h4><span className="td-muted">Generated follow-up draft</span></div><label htmlFor="followup-message" className="sr-only">Follow-up message</label><textarea id="followup-message" className="guest-message-textarea" value={messageDraft} onChange={(e)=>setMessageDraft(e.target.value)} rows={8} /><div className="guest-message-actions"><button className="btn-secondary" onClick={handleCopyMessage} aria-label="Copy message"><ClipboardCheck size={14}/>Copy Message</button><button className="btn-primary" onClick={markFollowupSent}>Mark Follow-up Sent</button></div>{detailStatus && <p role="status" className="guest-status-text">{detailStatus}</p>}</div></section>
  <aside className="guest-profile-panel"><div className="guest-profile-header"><InitialsAvatar name={selectedGuest.guest_name} /><div><h4>{selectedGuest.guest_name || "Guest"}</h4><p>{fallbackText(selectedGuest.country)}</p></div></div><div className="guest-stat-grid"><div className="guest-stat-card"><span>Total Bookings</span><strong>{selectedGuest.booking_count}</strong></div><div className="guest-stat-card"><span>Total Spent</span><strong>{fmtCurrency(selectedGuest.total_spent, cur)}</strong></div><div className="guest-stat-card"><span>Last Stay</span><strong>{fmtDateShort(selectedGuest.last_stay)}</strong></div><div className="guest-stat-card"><span>Next Follow-up</span><strong>{fmtDateShort(selectedGuest.next_followup_date)}</strong></div></div><div className="guest-notes-card"><h5>Preferences & Notes</h5><p>{fallbackText(selectedGuest.preferences)}</p><p>{fallbackText(selectedGuest.notes)}</p></div></aside></div></div>}

  {editing && <GuestForm record={editing} onClose={() => setEditing(null)} onSave={save} onDelete={del} />}
  <ConfirmDialog
    open={!!confirmDeleteId}
    title="Delete guest?"
    description="Delete this guest record? This cannot be undone."
    confirmLabel="Delete Guest"
    cancelLabel="Cancel"
    destructive
    onCancel={() => setConfirmDeleteId(null)}
    onConfirm={() => {
      setGuests(guests.filter((guest) => guest.guest_id !== confirmDeleteId));
      if (selectedGuestId === confirmDeleteId) setSelectedGuestId("");
      setEditing(null);
      setConfirmDeleteId(null);
    }}
  />
  </div>);
}

// ============================================================
//  CLEANING PAGE
// ============================================================

function CleaningForm({
  record,
  onClose,
  onSave,
  onDelete,
  properties,
  cleaners,
  currency,
}) {
  const [c, setC] = useState({ ...record });
  const [errors, setErrors] = useState([]);

  const set = (key, value) => {
    setC((previous) => ({ ...previous, [key]: value }));
    setErrors([]);
  };

  const STATUSES = [
    "Scheduled",
    "In Progress",
    "Completed",
    "Issue Found",
    "Cancelled",
  ];

  const LINEN = ["Not Checked", "Fresh Set", "Replaced", "Needs Replacement"];
  const DAMAGE = ["Not Checked", "Clear", "Minor Issue", "Damage Found"];

  const validate = () => {
    const nextErrors = [];

    if (!c.property_id) {
      nextErrors.push("Property is required.");
    }

    if (!c.checkout_date) {
      nextErrors.push("Checkout date is required.");
    }

    if (toNumber(c.cleaning_cost) < 0) {
      nextErrors.push("Cleaning cost cannot be negative.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      ...c,
      cleaner_name: String(c.cleaner_name || "").trim(),
      cleaning_cost: toNumber(c.cleaning_cost),
      notes: String(c.notes || "").trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={record.cleaning_id ? "Edit Cleaning Task" : "Add Cleaning Task"}
      wide
      footer={
        <>
          {record.cleaning_id && (
            <button
              className="btn-danger"
              onClick={() => onDelete(record.cleaning_id)}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
          <div className="modal-footer-spacer" />
          <ConfirmBar
            onCancel={onClose}
            onSave={handleSave}
            saveLabel={record.cleaning_id ? "Save Changes" : "Create Task"}
          />
        </>
      }
    >
      <ValidationMessage errors={errors} />

      <div className="form-grid-2">
        <Field label="Property">
          <select
            value={c.property_id || ""}
            onChange={(e) => set("property_id", e.target.value)}
          >
            <option value="">Select property</option>
            {properties.map((property) => (
              <option key={property.property_id} value={property.property_id}>
                {property.property_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cleaner Assigned">
          <select
            value={c.cleaner_name || ""}
            onChange={(e) => set("cleaner_name", e.target.value)}
          >
            <option value="">Unassigned</option>
            {cleaners.map((cleaner) => (
              <option key={cleaner.name}>{cleaner.name}</option>
            ))}
            <option value="Other">Other</option>
          </select>
        </Field>

        <Field label="Checkout Date">
          <input
            type="date"
            value={c.checkout_date || ""}
            onChange={(e) => set("checkout_date", e.target.value)}
          />
        </Field>

        <Field label="Next Check-in Date">
          <input
            type="date"
            value={c.next_checkin_date || ""}
            onChange={(e) => set("next_checkin_date", e.target.value)}
          />
        </Field>

        <Field label="Cleaning Status">
          <select
            value={c.cleaning_status || "Scheduled"}
            onChange={(e) => set("cleaning_status", e.target.value)}
          >
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </Field>

        <Field label="Linen Status">
          <select
            value={c.linen_status || "Not Checked"}
            onChange={(e) => set("linen_status", e.target.value)}
          >
            {LINEN.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </Field>

        <Field label="Damage Check">
          <select
            value={c.damage_check || "Not Checked"}
            onChange={(e) => set("damage_check", e.target.value)}
          >
            {DAMAGE.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </Field>

        <Field label={`Cleaning Cost (${currency})`}>
          <CurrencyInput
            min={0}
            value={c.cleaning_cost ?? 0}
            onChange={(nextValue) => set("cleaning_cost", nextValue)}
          />
        </Field>
      </div>

      <div className="form-grid-2">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={!!c.supplies_restocked}
            onChange={(e) => set("supplies_restocked", e.target.checked)}
          />
          Supplies restocked
        </label>

        <label className="toggle-row">
          <input
            type="checkbox"
            checked={!!c.photos_uploaded}
            onChange={(e) => set("photos_uploaded", e.target.checked)}
          />
          Photos uploaded
        </label>
      </div>

      <Field label="Notes">
        <textarea
          value={c.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Cleaning notes, damage notes, restock notes..."
        />
      </Field>
    </Modal>
  );
}

export function Cleaning({ propFilter, setPage, pageAction, onPageActionHandled, effectiveRole }) {
  const {
    cleaning: rawCleaning,
    setCleaning,
    properties: rawProperties,
    settings: rawSettings,
  } = useApp();

  const cleaning = safeArray(rawCleaning);
  const properties = safeArray(rawProperties);
  const settings = safeSettings(rawSettings);
  const cleaners = safeArray(settings.cleaners);
  const role = String(effectiveRole || "").toLowerCase();
  const isCleanerView = role === "cleaner";

  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const cur = settings.default_currency || "JMD";
  const selectedPropFilter = propFilter || "ALL";
  const hasProperties = properties.length > 0;
  const hasCleaningTasks = cleaning.length > 0;

  const filtered = (selectedPropFilter === "ALL"
    ? cleaning
    : cleaning.filter((task) => task.property_id === selectedPropFilter)
  )
    .filter((task) => !isCleanerView || Boolean(task.assigned_to_user_id))
    .filter((task) => statusFilter === "ALL" || task.cleaning_status === statusFilter)
    .sort((a, b) => new Date(a.checkout_date) - new Date(b.checkout_date));

  const empty = {
    cleaning_id: "",
    property_id: properties[0]?.property_id || "",
    booking_id: "",
    checkout_date: todayISO(),
    next_checkin_date: "",
    cleaner_name: cleaners[0]?.name || "",
    cleaning_status: "Scheduled",
    linen_status: "Not Checked",
    damage_check: "Not Checked",
    supplies_restocked: false,
    photos_uploaded: false,
    time_completed: "",
    cleaning_cost: 0,
    notes: "",
  };

  const startNewTask = () => {
    if (!hasProperties) return;
    setEditing(empty);
  };

  useEffect(() => {
    if (pageAction !== "addCleaning") return;
    setEditing(empty);
    onPageActionHandled?.();
  }, [pageAction]);

  const save = (task) => {
    if (!task.cleaning_id) {
      setCleaning([...cleaning, { ...task, cleaning_id: uid("CLEAN") }]);
    } else {
      setCleaning(
        cleaning.map((existingTask) =>
          existingTask.cleaning_id === task.cleaning_id ? task : existingTask
        )
      );
    }

    setEditing(null);
  };

  const del = (id) => {
    setConfirmDeleteId(id);
  };

  const getProp = (id) =>
    properties.find((property) => property.property_id === id);

  const STATUSES = [
    "ALL",
    "Scheduled",
    "In Progress",
    "Completed",
    "Issue Found",
    "Cancelled",
  ];

  const toneMap = {
    Scheduled: "amber",
    "In Progress": "blue",
    Completed: "green",
    "Issue Found": "red",
    Cancelled: "gray",
  };
  const completedCleaning = filtered.filter((task) => task.cleaning_status === "Completed").length;
  const issueAttention = filtered.filter((task) => task.cleaning_status === "Issue Found" || task.damage_check !== "Checked" || task.linen_status !== "Checked").length;
  const cleaningCost = filtered.reduce((sum, task) => sum + toNumber(task.cleaning_cost), 0);

  return (
    <div className="page">
      <PageHeader
        title={isCleanerView ? "My Cleaning Schedule" : "Cleaning Schedule"}
        subtitle="Track every turnover — assign cleaners, verify linen, damage check, and restock."
        helper="Use this page after every checkout. A clean, inspected, restocked property means better reviews and fewer problems."
        actions={
          {!isCleanerView && <button
            className="btn-primary"
            onClick={startNewTask}
            disabled={!hasProperties}
            title={
              !hasProperties
                ? "Add a property before creating cleaning tasks"
                : "Add cleaning task"
            }
          >
            <Plus size={14} />
            Add Cleaning Task
          </button>}
        }
      />

      {!hasProperties ? (
        <NoPropertyState
          title="Add a property before creating cleaning tasks"
          body="Cleaning tasks must be attached to a property. Add your first property in Settings, then return here to create cleaning turnovers."
          setPage={setPage}
        />
      ) : (
        <>
          {!hasCleaningTasks && (
            <EmptyActionState
              icon={Sparkles}
              title="No cleaning tasks yet"
              body="Add your first cleaning task after a checkout, inspection, or scheduled turnover. This helps you track cleaner assignment, linen status, damage checks, restocking, and photos."
              buttonLabel="Add First Cleaning Task"
              onClick={startNewTask}
            />
          )}

          {hasCleaningTasks && (
            <div className="page-kpi-grid">
              <div className="metric-card"><div className="metric-label">Scheduled Cleanings</div><div className="metric-value">{filtered.length}</div><div className="metric-sub">Visible cleaning tasks</div></div>
              <div className="metric-card"><div className="metric-label">Completed Cleanings</div><div className="metric-value">{completedCleaning}</div><div className="metric-sub">Marked completed</div></div>
              <div className="metric-card"><div className="metric-label">Issue Found / Attention</div><div className="metric-value">{issueAttention}</div><div className="metric-sub">Issues or pending checks</div></div>
              {!isCleanerView && <div className="metric-card"><div className="metric-label">Cleaning Cost</div><div className="metric-value">{fmtCurrency(cleaningCost, settings.default_currency || "JMD")}</div><div className="metric-sub">From visible tasks</div></div>}
            </div>
          )}

          {hasCleaningTasks && (
            <div className="status-filters">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  className={`status-filter-btn ${
                    status === statusFilter ? "active" : ""
                  }`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "ALL" ? "All" : status}
                </button>
              ))}
            </div>
          )}

          <div className="card" style={{ overflow: "hidden" }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Property</th>
                    <th>Checkout</th>
                    <th>Next Check-in</th>
                    {!isCleanerView && <th>Cleaner</th>}
                    <th>Status</th>
                    <th>Linen</th>
                    <th>Damage</th>
                    <th>Restocked</th>
                    <th>Photos</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          padding: 36,
                          textAlign: "center",
                          color: "var(--muted)",
                          lineHeight: 1.6,
                        }}
                      >
                        {hasCleaningTasks
                          ? "No cleaning tasks match the current filter."
                          : "No cleaning tasks yet. Add one after a guest checks out or before a scheduled turnover."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((task) => (
                      <tr
                        key={task.cleaning_id}
                        className="tr-clickable"
                        onClick={() => setEditing(task)}
                      >
                        <td className="fw-bold">
                          {getProp(task.property_id)?.property_name || "—"}
                        </td>
                        <td className="num">
                          {fmtDateShort(task.checkout_date)}
                        </td>
                        <td className="num">
                          {fmtDateShort(task.next_checkin_date)}
                        </td>
                        {!isCleanerView && <td>{task.cleaner_name || "Unassigned"}</td>}
                        <td>
                          <Chip tone={toneMap[task.cleaning_status] || "gray"}>
                            {task.cleaning_status}
                          </Chip>
                        </td>
                        <td>
                          <Chip
                            tone={
                              task.linen_status === "Replaced" ||
                              task.linen_status === "Fresh Set"
                                ? "green"
                                : "gray"
                            }
                          >
                            {task.linen_status}
                          </Chip>
                        </td>
                        <td>
                          <Chip
                            tone={
                              task.damage_check === "Clear"
                                ? "green"
                                : task.damage_check === "Damage Found"
                                ? "red"
                                : "gray"
                            }
                          >
                            {task.damage_check}
                          </Chip>
                        </td>
                        <td>
                          {task.supplies_restocked ? (
                            <Chip tone="green">Yes</Chip>
                          ) : (
                            <Chip tone="amber">No</Chip>
                          )}
                        </td>
                        <td>
                          {task.photos_uploaded ? (
                            <Chip tone="green">Yes</Chip>
                          ) : (
                            <Chip tone="amber">No</Chip>
                          )}
                        </td>
                        <td>
                          <ChevronRight size={14} color="var(--muted)" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {editing && (
        <CleaningForm
          record={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={del}
          properties={properties}
          cleaners={cleaners}
          currency={cur}
        />
      )}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete cleaning task?"
        description="Delete this cleaning task? This cannot be undone."
        confirmLabel="Delete Cleaning Task"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          setCleaning(cleaning.filter((task) => task.cleaning_id !== confirmDeleteId));
          setEditing(null);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}

// ============================================================
//  MAINTENANCE PAGE
// ============================================================

function MaintenanceForm({
  record,
  onClose,
  onSave,
  onDelete,
  properties,
  vendors,
  currency,
}) {
  const [m, setM] = useState({ ...record });
  const [errors, setErrors] = useState([]);

  const set = (key, value) => {
    setM((previous) => ({ ...previous, [key]: value }));
    setErrors([]);
  };

  const PRIORITIES = ["Low", "Medium", "High", "Urgent"];
  const STATUSES = [
    "Open",
    "In Progress",
    "Waiting on Vendor",
    "Completed",
    "Cancelled",
  ];

  const validate = () => {
    const nextErrors = [];

    if (!String(m.issue_title || "").trim()) {
      nextErrors.push("Issue title is required.");
    }

    if (!m.property_id) {
      nextErrors.push("Property is required.");
    }

    if (!m.reported_date) {
      nextErrors.push("Reported date is required.");
    }

    if (toNumber(m.estimated_cost) < 0) {
      nextErrors.push("Estimated cost cannot be negative.");
    }

    if (toNumber(m.actual_cost) < 0) {
      nextErrors.push("Actual cost cannot be negative.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      ...m,
      issue_title: String(m.issue_title || "").trim(),
      vendor: String(m.vendor || "").trim(),
      estimated_cost: toNumber(m.estimated_cost),
      actual_cost: toNumber(m.actual_cost),
      photo_or_link: String(m.photo_or_link || "").trim(),
      notes: String(m.notes || "").trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={record.issue_id ? "Edit Issue" : "Add Maintenance Issue"}
      wide
      footer={
        <>
          {record.issue_id && (
            <button
              className="btn-danger"
              onClick={() => onDelete(record.issue_id)}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
          <div className="modal-footer-spacer" />
          <ConfirmBar
            onCancel={onClose}
            onSave={handleSave}
            saveLabel={record.issue_id ? "Save Changes" : "Create Issue"}
          />
        </>
      }
    >
      <ValidationMessage errors={errors} />

      <Field label="Issue Title">
        <input
          value={m.issue_title || ""}
          onChange={(e) => set("issue_title", e.target.value)}
          placeholder="e.g. AC not cooling, faucet drip..."
        />
      </Field>

      <div className="form-grid-2">
        <Field label="Property">
          <select
            value={m.property_id || ""}
            onChange={(e) => set("property_id", e.target.value)}
          >
            <option value="">Select property</option>
            {properties.map((property) => (
              <option key={property.property_id} value={property.property_id}>
                {property.property_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Property Area">
          <select
            value={m.property_area || "Bedroom"}
            onChange={(e) => set("property_area", e.target.value)}
          >
            {PROPERTY_AREAS.map((area) => (
              <option key={area}>{area}</option>
            ))}
          </select>
        </Field>

        <Field label="Priority">
          <select
            value={m.priority || "Medium"}
            onChange={(e) => set("priority", e.target.value)}
          >
            {PRIORITIES.map((priority) => (
              <option key={priority}>{priority}</option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            value={m.status || "Open"}
            onChange={(e) => set("status", e.target.value)}
          >
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </Field>

        <Field label="Reported By">
          <select
            value={m.reported_by || "Manager"}
            onChange={(e) => set("reported_by", e.target.value)}
          >
            {["Guest", "Cleaner", "Owner", "Manager"].map((reporter) => (
              <option key={reporter}>{reporter}</option>
            ))}
          </select>
        </Field>

        <Field label="Vendor">
          <select
            value={m.vendor || ""}
            onChange={(e) => set("vendor", e.target.value)}
          >
            <option value="">— None —</option>
            {vendors.map((vendor) => (
              <option key={vendor.name}>{vendor.name}</option>
            ))}
          </select>
        </Field>

        <Field label={`Estimated Cost (${currency})`}>
          <CurrencyInput
            min={0}
            value={m.estimated_cost ?? 0}
            onChange={(nextValue) => set("estimated_cost", nextValue)}
          />
        </Field>

        <Field label={`Actual Cost (${currency})`}>
          <CurrencyInput
            min={0}
            value={m.actual_cost ?? 0}
            onChange={(nextValue) => set("actual_cost", nextValue)}
          />
        </Field>

        <Field label="Reported Date">
          <input
            type="date"
            value={m.reported_date || ""}
            onChange={(e) => set("reported_date", e.target.value)}
          />
        </Field>

        <Field label="Completion Date">
          <input
            type="date"
            value={m.completion_date || ""}
            onChange={(e) => set("completion_date", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Photo or Link">
        <input
          value={m.photo_or_link || ""}
          onChange={(e) => set("photo_or_link", e.target.value)}
          placeholder="Google Drive link or photo URL"
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={m.notes || ""}
          onChange={(e) => set("notes", e.target.value)}
          rows={2}
          placeholder="Repair notes, vendor updates, owner notes..."
        />
      </Field>
    </Modal>
  );
}

export function Maintenance({ propFilter, setPage, pageAction, onPageActionHandled }) {
  const {
    maintenance: rawMaintenance,
    setMaintenance,
    properties: rawProperties,
    settings: rawSettings,
  } = useApp();

  const maintenance = safeArray(rawMaintenance);
  const properties = safeArray(rawProperties);
  const settings = safeSettings(rawSettings);
  const vendors = safeArray(settings.vendors);

  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const cur = settings.default_currency || "JMD";
  const selectedPropFilter = propFilter || "ALL";
  const hasProperties = properties.length > 0;
  const hasIssues = maintenance.length > 0;

  const filtered = (selectedPropFilter === "ALL"
    ? maintenance
    : maintenance.filter((issue) => issue.property_id === selectedPropFilter)
  )
    .filter((issue) => statusFilter === "ALL" || issue.status === statusFilter)
    .sort((a, b) => {
      const order = { Urgent: 0, High: 1, Medium: 2, Low: 3 };
      return (order[a.priority] ?? 4) - (order[b.priority] ?? 4);
    });

  const empty = {
    issue_id: "",
    property_id: properties[0]?.property_id || "",
    issue_title: "",
    property_area: "Bedroom",
    priority: "Medium",
    reported_by: "Manager",
    vendor: "",
    estimated_cost: 0,
    actual_cost: 0,
    status: "Open",
    reported_date: todayISO(),
    completion_date: "",
    photo_or_link: "",
    notes: "",
  };

  const startNewIssue = () => {
    if (!hasProperties) return;
    setEditing(empty);
  };

  useEffect(() => {
    if (pageAction !== "addMaintenance") return;
    setEditing(empty);
    onPageActionHandled?.();
  }, [pageAction]);

  const save = (issue) => {
    if (!issue.issue_id) {
      setMaintenance([...maintenance, { ...issue, issue_id: uid("MNT") }]);
    } else {
      setMaintenance(
        maintenance.map((existingIssue) =>
          existingIssue.issue_id === issue.issue_id ? issue : existingIssue
        )
      );
    }

    setEditing(null);
  };

  const del = (id) => {
    setConfirmDeleteId(id);
  };

  const getProp = (id) =>
    properties.find((property) => property.property_id === id);

  const priorityTone = {
    Low: "gray",
    Medium: "amber",
    High: "amber",
    Urgent: "red",
  };

  const statusTone = {
    Open: "red",
    "In Progress": "blue",
    "Waiting on Vendor": "amber",
    Completed: "green",
    Cancelled: "gray",
  };
  const openIssues = filtered.filter((issue) => !["Completed", "Cancelled"].includes(issue.status)).length;
  const highPriority = filtered.filter((issue) => ["High", "Urgent"].includes(issue.priority)).length;
  const estimatedCost = filtered.reduce((sum, issue) => sum + toNumber(issue.estimated_cost), 0);
  const month = new Date().toISOString().slice(0, 7);
  const completedThisMonth = filtered.filter((issue) => issue.status === "Completed" && String(issue.completion_date || "").slice(0, 7) === month).length;

  return (
    <div className="page">
      <PageHeader
        title="Maintenance Tracker"
        subtitle="Log every property issue with priority, vendor, cost, and resolution status."
        helper="Small problems become bad reviews when they're forgotten. Log issues as soon as they happen — even low-priority ones."
        actions={
          <>
            <button
              className="btn-secondary"
              onClick={() => downloadCSV("maintenance.csv", filtered)}
              disabled={filtered.length === 0}
              title={
                filtered.length === 0
                  ? "Add maintenance records before exporting"
                  : "Export current maintenance records"
              }
            >
              <Download size={14} />
              Export
            </button>

            <button
              className="btn-primary"
              onClick={startNewIssue}
              disabled={!hasProperties}
              title={
                !hasProperties
                  ? "Add a property before creating maintenance issues"
                  : "Add maintenance issue"
              }
            >
              <Plus size={14} />
              Add Issue
            </button>
          </>
        }
      />

      {!hasProperties ? (
        <NoPropertyState
          title="Add a property before tracking maintenance"
          body="Maintenance records must be attached to a property. Add your first property in Settings, then return here to track repairs, inspections, vendors, and open issues."
          setPage={setPage}
        />
      ) : (
        <>
          {!hasIssues && (
            <EmptyActionState
              icon={Wrench}
              title="No maintenance issues yet"
              body="Add your first maintenance issue when something needs repair, inspection, vendor follow-up, or owner visibility. Even low-priority items should be logged so they are not forgotten."
              buttonLabel="Add First Issue"
              onClick={startNewIssue}
            />
          )}

          {hasIssues && (
            <div className="page-kpi-grid">
              <div className="metric-card"><div className="metric-label">Open Issues</div><div className="metric-value">{openIssues}</div><div className="metric-sub">Not completed/cancelled</div></div>
              <div className="metric-card"><div className="metric-label">High Priority</div><div className="metric-value">{highPriority}</div><div className="metric-sub">High + urgent items</div></div>
              <div className="metric-card"><div className="metric-label">Estimated Cost</div><div className="metric-value">{fmtCurrency(estimatedCost, settings.default_currency || "JMD")}</div><div className="metric-sub">Visible issue estimates</div></div>
              <div className="metric-card"><div className="metric-label">Completed This Month</div><div className="metric-value">{completedThisMonth}</div><div className="metric-sub">Current month completions</div></div>
            </div>
          )}

          {hasIssues && (
            <div className="status-filters">
              {[
                "ALL",
                "Open",
                "In Progress",
                "Waiting on Vendor",
                "Completed",
                "Cancelled",
              ].map((status) => (
                <button
                  key={status}
                  className={`status-filter-btn ${
                    status === statusFilter ? "active" : ""
                  }`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "ALL" ? "All" : status}
                </button>
              ))}
            </div>
          )}

          <div className="card" style={{ overflow: "hidden" }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Issue</th>
                    <th>Property</th>
                    <th>Area</th>
                    <th>Priority</th>
                    <th>Vendor</th>
                    <th className="td-right">Est. Cost</th>
                    <th className="td-right">Actual</th>
                    <th>Status</th>
                    <th>Reported</th>
                    <th></th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td
                        colSpan={10}
                        style={{
                          padding: 36,
                          textAlign: "center",
                          color: "var(--muted)",
                          lineHeight: 1.6,
                        }}
                      >
                        {hasIssues
                          ? "No maintenance issues match the current filter."
                          : "No maintenance issues yet. Add repairs, inspections, or property concerns here."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((issue) => (
                      <tr
                        key={issue.issue_id}
                        className="tr-clickable"
                        onClick={() => setEditing(issue)}
                      >
                        <td>
                          <div className="fw-bold">
                            {issue.issue_title || "Untitled issue"}
                          </div>
                          <div className="td-muted">{issue.issue_id}</div>
                        </td>
                        <td>
                          {getProp(issue.property_id)?.property_name || "—"}
                        </td>
                        <td>{issue.property_area || "—"}</td>
                        <td>
                          <Chip tone={priorityTone[issue.priority] || "gray"}>
                            {issue.priority}
                          </Chip>
                        </td>
                        <td>{issue.vendor || "—"}</td>
                        <td className="td-right num">
                          {toNumber(issue.estimated_cost)
                            ? fmtCurrency(issue.estimated_cost, cur)
                            : "—"}
                        </td>
                        <td className="td-right num">
                          {toNumber(issue.actual_cost)
                            ? fmtCurrency(issue.actual_cost, cur)
                            : "—"}
                        </td>
                        <td>
                          <Chip tone={statusTone[issue.status] || "gray"}>
                            {issue.status}
                          </Chip>
                        </td>
                        <td className="num">
                          {fmtDateShort(issue.reported_date)}
                        </td>
                        <td>
                          <ChevronRight size={14} color="var(--muted)" />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {editing && (
        <MaintenanceForm
          record={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={del}
          properties={properties}
          vendors={vendors}
          currency={cur}
        />
      )}
      <ConfirmDialog
        open={!!confirmDeleteId}
        title="Delete maintenance issue?"
        description="Delete this maintenance issue? This cannot be undone."
        confirmLabel="Delete Issue"
        cancelLabel="Cancel"
        destructive
        onCancel={() => setConfirmDeleteId(null)}
        onConfirm={() => {
          setMaintenance(maintenance.filter((issue) => issue.issue_id !== confirmDeleteId));
          setEditing(null);
          setConfirmDeleteId(null);
        }}
      />
    </div>
  );
}
