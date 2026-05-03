// ============================================================
//  GUESTS, CLEANING, AND MAINTENANCE PAGES
// ============================================================
import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import {
  PageHeader,
  Modal,
  Field,
  ConfirmBar,
  Chip,
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

export function Guests({ propFilter }) {
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

  const cur = settings.default_currency || "JMD";
  const selectedPropFilter = propFilter || "ALL";

  const relevantBookings =
    selectedPropFilter === "ALL"
      ? bookings
      : bookings.filter((booking) => booking.property_id === selectedPropFilter);

  const visibleGuestIdsFromPropertyFilter = new Set(
    relevantBookings.map((booking) => booking.guest_id).filter(Boolean)
  );

  const enriched = guests
    .filter((guest) => {
      if (selectedPropFilter === "ALL") return true;

      return (
        visibleGuestIdsFromPropertyFilter.has(guest.guest_id) ||
        !guest.guest_id
      );
    })
    .map((guest) => {
      const guestBookings = bookings.filter(
        (booking) => booking.guest_id === guest.guest_id
      );

      const total_spent = guestBookings.reduce(
        (sum, booking) => sum + bookingTotal(booking),
        0
      );

      const last_stay =
        guestBookings.length > 0
          ? guestBookings
              .map((booking) => booking.checkout_date)
              .filter(Boolean)
              .sort()
              .reverse()[0]
          : "";

      const prop = guestBookings[0]
        ? properties.find(
            (property) => property.property_id === guestBookings[0].property_id
          )?.property_name
        : "—";

      return {
        ...guest,
        total_spent,
        last_stay,
        prop_name: prop || "—",
        booking_count: guestBookings.length,
      };
    })
    .filter((guest) => {
      const query = search.trim().toLowerCase();

      if (!query) return true;

      return (
        String(guest.guest_name || "").toLowerCase().includes(query) ||
        String(guest.country || "").toLowerCase().includes(query) ||
        String(guest.email || "").toLowerCase().includes(query) ||
        String(guest.phone || "").toLowerCase().includes(query)
      );
    });

  const empty = {
    guest_id: "",
    guest_name: "",
    country: "",
    email: "",
    phone: "",
    review_left: false,
    direct_followup_sent: false,
    preferences: "",
    notes: "",
    last_contacted_date: "",
    next_followup_date: "",
  };

  const save = (guest) => {
    if (!guest.guest_id) {
      setGuests([...guests, { ...guest, guest_id: uid("GUEST") }]);
    } else {
      setGuests(
        guests.map((existingGuest) =>
          existingGuest.guest_id === guest.guest_id ? guest : existingGuest
        )
      );
    }

    setEditing(null);
  };

  const del = (id) => {
    const confirmed = window.confirm(
      "Delete this guest record? This cannot be undone."
    );

    if (!confirmed) return;

    setGuests(guests.filter((guest) => guest.guest_id !== id));
    setEditing(null);
  };

  const hasGuests = guests.length > 0;
  const repeatGuests = enriched.filter((guest) => Number(guest.total_bookings || 0) > 1).length;
  const reviewsLeft = enriched.filter((guest) => guest.review_left === true).length;
  const todayIso = todayISO();
  const followUpsDue = enriched.filter((guest) => guest.next_followup_date && guest.next_followup_date <= todayIso).length;

  return (
    <div className="page">
      <PageHeader
        title="Guest CRM"
        subtitle="Past guests are future direct bookings. Track who stayed, what they liked, and when to follow up."
        helper="Every guest you don't follow up with is potential revenue left on Airbnb's platform. Set a next follow-up date for every guest."
        actions={
          <>
            <button
              className="btn-secondary"
              onClick={() => downloadCSV("guests.csv", enriched)}
              disabled={enriched.length === 0}
              title={
                enriched.length === 0
                  ? "Add guests before exporting"
                  : "Export current guest records"
              }
            >
              <Download size={14} />
              Export
            </button>

            <button className="btn-primary" onClick={() => setEditing(empty)}>
              <Plus size={14} />
              Add Guest
            </button>
          </>
        }
      />

      {!hasGuests && (
        <EmptyActionState
          icon={Users}
          title="No guests yet"
          body="Add your first guest record manually, or add bookings first and use this page to track guest preferences, direct booking follow-ups, reviews, and repeat-stay opportunities."
          buttonLabel="Add First Guest"
          onClick={() => setEditing(empty)}
        />
      )}

      {hasGuests && (
        <div className="page-kpi-grid">
          <div className="metric-card"><div className="metric-label">Total Guests</div><div className="metric-value">{enriched.length}</div><div className="metric-sub">Visible guest records</div></div>
          <div className="metric-card"><div className="metric-label">Repeat Guests</div><div className="metric-value">{repeatGuests}</div><div className="metric-sub">More than one booking</div></div>
          <div className="metric-card"><div className="metric-label">Reviews Left</div><div className="metric-value">{reviewsLeft}</div><div className="metric-sub">Review flag marked true</div></div>
          <div className="metric-card"><div className="metric-label">Follow-ups Due</div><div className="metric-value">{followUpsDue}</div><div className="metric-sub">Due today or earlier</div></div>
        </div>
      )}

      {hasGuests && (
        <div className="search-wrap">
          <Search size={15} className="search-icon" />
          <input
            placeholder="Search by name, country, email, or phone…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Guest</th>
                <th>Country</th>
                <th>Last Property</th>
                <th className="td-right">Bookings</th>
                <th className="td-right">Total Spent</th>
                <th>Review</th>
                <th>Follow-up Sent</th>
                <th>Next Follow-up</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {enriched.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    style={{
                      padding: 36,
                      textAlign: "center",
                      color: "var(--muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    {hasGuests
                      ? "No guests match your current search or property filter."
                      : "No guests yet. Use the Add Guest button to create your first guest record."}
                  </td>
                </tr>
              ) : (
                enriched.map((guest) => (
                  <tr
                    key={guest.guest_id}
                    className="tr-clickable"
                    onClick={() => setEditing(guest)}
                  >
                    <td>
                      <div className="fw-bold">
                        {guest.guest_name || "Unnamed guest"}
                      </div>
                      <div className="td-muted">
                        {guest.email || guest.phone || guest.guest_id}
                      </div>
                    </td>
                    <td>{guest.country || "—"}</td>
                    <td>{guest.prop_name}</td>
                    <td className="td-right num">{guest.booking_count}</td>
                    <td className="td-right num fw-bold">
                      {fmtCurrency(guest.total_spent, cur)}
                    </td>
                    <td>
                      {guest.review_left ? (
                        <Chip tone="green" icon={CheckCircle2}>
                          Yes
                        </Chip>
                      ) : (
                        <Chip tone="gray">No</Chip>
                      )}
                    </td>
                    <td>
                      {guest.direct_followup_sent ? (
                        <Chip tone="green" icon={CheckCircle2}>
                          Sent
                        </Chip>
                      ) : (
                        <Chip tone="amber">Pending</Chip>
                      )}
                    </td>
                    <td className="num">
                      {fmtDateShort(guest.next_followup_date)}
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

      {editing && (
        <GuestForm
          record={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={del}
        />
      )}
    </div>
  );
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
          <input
            type="number"
            min="0"
            value={c.cleaning_cost ?? 0}
            onChange={(e) => set("cleaning_cost", e.target.value)}
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

export function Cleaning({ propFilter, setPage }) {
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

  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const cur = settings.default_currency || "JMD";
  const selectedPropFilter = propFilter || "ALL";
  const hasProperties = properties.length > 0;
  const hasCleaningTasks = cleaning.length > 0;

  const filtered = (selectedPropFilter === "ALL"
    ? cleaning
    : cleaning.filter((task) => task.property_id === selectedPropFilter)
  )
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
    const confirmed = window.confirm(
      "Delete this cleaning task? This cannot be undone."
    );

    if (!confirmed) return;

    setCleaning(cleaning.filter((task) => task.cleaning_id !== id));
    setEditing(null);
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
        title="Cleaning Schedule"
        subtitle="Track every turnover — assign cleaners, verify linen, damage check, and restock."
        helper="Use this page after every checkout. A clean, inspected, restocked property means better reviews and fewer problems."
        actions={
          <button
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
          </button>
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
              <div className="metric-card"><div className="metric-label">Cleaning Cost</div><div className="metric-value">{fmtCurrency(cleaningCost, settings.default_currency || "JMD")}</div><div className="metric-sub">From visible tasks</div></div>
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
                    <th>Cleaner</th>
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
                        <td>{task.cleaner_name || "Unassigned"}</td>
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
          <input
            type="number"
            min="0"
            value={m.estimated_cost ?? 0}
            onChange={(e) => set("estimated_cost", e.target.value)}
          />
        </Field>

        <Field label={`Actual Cost (${currency})`}>
          <input
            type="number"
            min="0"
            value={m.actual_cost ?? 0}
            onChange={(e) => set("actual_cost", e.target.value)}
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

export function Maintenance({ propFilter, setPage }) {
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
    const confirmed = window.confirm(
      "Delete this maintenance issue? This cannot be undone."
    );

    if (!confirmed) return;

    setMaintenance(maintenance.filter((issue) => issue.issue_id !== id));
    setEditing(null);
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
    </div>
  );
}
