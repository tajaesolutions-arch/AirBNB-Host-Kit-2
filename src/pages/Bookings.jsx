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
  calcNights,
  bookingTotal,
  fmtCurrency,
  fmtDateShort,
  downloadCSV,
  bookingStatusChip,
  paymentStatusChip,
} from "../utils/helpers.js";
import { PLATFORMS } from "../data/sampleData.js";
import {
  Plus,
  Download,
  ChevronRight,
  Trash2,
  CalendarPlus,
  Home,
  ArrowRight,
  AlertCircle,
  Users,
  Sparkles,
} from "lucide-react";

const STATUSES = ["Confirmed", "Checked In", "Checked Out", "Cancelled"];
const PAYMENT_STATUSES = ["Paid", "Partial", "Unpaid", "Pending"];

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

function dateIsAfter(startDate, endDate) {
  if (!startDate || !endDate) return false;
  return new Date(endDate) > new Date(startDate);
}

function normalizeName(value) {
  return String(value || "").trim().toLowerCase();
}

function NoPropertyState({ setPage }) {
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
            Add a property before creating bookings
          </h3>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 14,
              maxWidth: 720,
            }}
          >
            Bookings need to be connected to a property. Add your first property
            in Settings, then return here to create your first reservation.
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

function EmptyBookingsState({ onAddBooking }) {
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
            <CalendarPlus size={22} />
          </div>

          <div>
            <h3 className="section-title" style={{ marginBottom: 6 }}>
              No bookings yet
            </h3>
            <p
              style={{
                color: "var(--muted)",
                fontSize: 13,
                lineHeight: 1.6,
                maxWidth: 760,
              }}
            >
              Add your first booking to activate revenue tracking, occupancy,
              guest stay history, check-in/check-out activity, owner reports,
              and tax reserve calculations.
            </p>
          </div>
        </div>

        <button className="btn-primary" onClick={onAddBooking}>
          <Plus size={14} />
          Add First Booking
        </button>
      </div>
    </div>
  );
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

function AutomationOptions({ isNewRecord, options, setOptions }) {
  if (!isNewRecord) return null;

  return (
    <div
      style={{
        marginTop: 14,
        padding: 14,
        background: "var(--teal-soft)",
        borderRadius: 10,
        border: "1px solid #9FD8CF",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: "var(--teal)",
          textTransform: "uppercase",
          marginBottom: 8,
        }}
      >
        Smart record creation
      </div>

      <p
        style={{
          color: "var(--muted)",
          fontSize: 12.5,
          lineHeight: 1.55,
          marginBottom: 12,
        }}
      >
        Create connected operational records from this booking so the guest CRM
        and cleaning schedule are updated automatically.
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        <label
          className="toggle-row"
          style={{
            justifyContent: "flex-start",
            gap: 10,
            margin: 0,
          }}
        >
          <input
            type="checkbox"
            checked={options.createGuest}
            onChange={(event) =>
              setOptions((previous) => ({
                ...previous,
                createGuest: event.target.checked,
              }))
            }
          />
          <Users size={14} />
          Create or link Guest CRM record
        </label>

        <label
          className="toggle-row"
          style={{
            justifyContent: "flex-start",
            gap: 10,
            margin: 0,
          }}
        >
          <input
            type="checkbox"
            checked={options.createCleaningTask}
            onChange={(event) =>
              setOptions((previous) => ({
                ...previous,
                createCleaningTask: event.target.checked,
              }))
            }
          />
          <Sparkles size={14} />
          Create cleaning task for checkout date
        </label>
      </div>
    </div>
  );
}

function BookingForm({
  record,
  onClose,
  onSave,
  onDelete,
  properties,
  currency,
}) {
  const [b, setB] = useState({ ...record });
  const [errors, setErrors] = useState([]);

  const [automationOptions, setAutomationOptions] = useState({
    createGuest: !record.booking_id,
    createCleaningTask: !record.booking_id,
  });

  const isNewRecord = !record.booking_id;

  const set = (key, value) => {
    setB((previous) => ({ ...previous, [key]: value }));
    setErrors([]);
  };

  const nights = calcNights(b.checkin_date, b.checkout_date);
  const total = bookingTotal(b);

  const validate = () => {
    const nextErrors = [];

    if (!String(b.guest_name || "").trim()) {
      nextErrors.push("Guest name is required.");
    }

    if (!b.property_id) {
      nextErrors.push("Property is required.");
    }

    if (!b.checkin_date) {
      nextErrors.push("Check-in date is required.");
    }

    if (!b.checkout_date) {
      nextErrors.push("Check-out date is required.");
    }

    if (
      b.checkin_date &&
      b.checkout_date &&
      !dateIsAfter(b.checkin_date, b.checkout_date)
    ) {
      nextErrors.push("Check-out date must be after check-in date.");
    }

    if (toNumber(b.nightly_rate) < 0) {
      nextErrors.push("Nightly rate cannot be negative.");
    }

    if (toNumber(b.cleaning_fee) < 0) {
      nextErrors.push("Cleaning fee cannot be negative.");
    }

    if (toNumber(b.extra_fees) < 0) {
      nextErrors.push("Extra fees cannot be negative.");
    }

    if (toNumber(b.discounts) < 0) {
      nextErrors.push("Discounts cannot be negative.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave(
      {
        ...b,
        guest_name: String(b.guest_name || "").trim(),
        nightly_rate: toNumber(b.nightly_rate),
        cleaning_fee: toNumber(b.cleaning_fee),
        extra_fees: toNumber(b.extra_fees),
        discounts: toNumber(b.discounts),
      },
      automationOptions
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={record.booking_id ? "Edit Booking" : "Add Booking"}
      wide
      footer={
        <>
          {record.booking_id && (
            <button
              className="btn-danger"
              onClick={() => onDelete(record.booking_id)}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
          <div className="modal-footer-spacer" />
          <ConfirmBar
            onCancel={onClose}
            onSave={handleSave}
            saveLabel={record.booking_id ? "Save Changes" : "Create Booking"}
          />
        </>
      }
    >
      <ValidationMessage errors={errors} />

      <div className="form-grid-2">
        <Field label="Guest Name">
          <input
            value={b.guest_name || ""}
            onChange={(e) => set("guest_name", e.target.value)}
            placeholder="e.g. Alicia Smith"
          />
        </Field>

        <Field label="Property">
          <select
            value={b.property_id || ""}
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

        <Field label="Platform">
          <select
            value={b.platform || "Airbnb"}
            onChange={(e) => set("platform", e.target.value)}
          >
            {PLATFORMS.map((platform) => (
              <option key={platform}>{platform}</option>
            ))}
          </select>
        </Field>

        <Field label="Booking Status">
          <select
            value={b.booking_status || "Confirmed"}
            onChange={(e) => set("booking_status", e.target.value)}
          >
            {STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </Field>

        <Field label="Check-in Date">
          <input
            type="date"
            value={b.checkin_date || ""}
            onChange={(e) => set("checkin_date", e.target.value)}
          />
        </Field>

        <Field label="Check-out Date">
          <input
            type="date"
            value={b.checkout_date || ""}
            onChange={(e) => set("checkout_date", e.target.value)}
          />
        </Field>

        <Field label={`Nightly Rate (${currency})`} helper={`${nights} nights × rate`}>
          <input
            type="number"
            min="0"
            value={b.nightly_rate ?? 0}
            onChange={(e) => set("nightly_rate", e.target.value)}
          />
        </Field>

        <Field label={`Cleaning Fee (${currency})`}>
          <input
            type="number"
            min="0"
            value={b.cleaning_fee ?? 0}
            onChange={(e) => set("cleaning_fee", e.target.value)}
          />
        </Field>

        <Field label={`Extra Fees (${currency})`} helper="Late checkout, extra guest, etc.">
          <input
            type="number"
            min="0"
            value={b.extra_fees ?? 0}
            onChange={(e) => set("extra_fees", e.target.value)}
          />
        </Field>

        <Field label={`Discounts (${currency})`}>
          <input
            type="number"
            min="0"
            value={b.discounts ?? 0}
            onChange={(e) => set("discounts", e.target.value)}
          />
        </Field>
      </div>

      <Field label="Payment Status">
        <select
          value={b.payment_status || "Pending"}
          onChange={(e) => set("payment_status", e.target.value)}
        >
          {PAYMENT_STATUSES.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
      </Field>

      <Field label="Notes">
        <textarea
          value={b.source_notes || ""}
          onChange={(e) => set("source_notes", e.target.value)}
          rows={2}
          placeholder="Guest requests, source notes, payment notes, etc."
        />
      </Field>

      <AutomationOptions
        isNewRecord={isNewRecord}
        options={automationOptions}
        setOptions={setAutomationOptions}
      />

      <div
        style={{
          marginTop: 14,
          padding: 14,
          background: "var(--sand-soft)",
          borderRadius: 10,
          border: "1px solid var(--line-strong)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 14,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--muted)",
              textTransform: "uppercase",
            }}
          >
            Total Booking Revenue
          </div>
          <div
            className="num"
            style={{
              fontFamily: "Fraunces, serif",
              fontSize: 24,
              fontWeight: 600,
            }}
          >
            {fmtCurrency(total, currency)}
          </div>
        </div>
        <div
          style={{
            fontSize: 12,
            color: "var(--muted)",
            textAlign: "right",
          }}
        >
          (rate × nights) + cleaning + extras − discounts
        </div>
      </div>
    </Modal>
  );
}

export default function Bookings({ monthFilter, propFilter, setPage }) {
  const {
    bookings: rawBookings,
    setBookings,

    guests: rawGuests,
    setGuests,

    cleaning: rawCleaning,
    setCleaning,

    properties: rawProperties,
    settings: rawSettings,
  } = useApp();

  const bookings = safeArray(rawBookings);
  const guests = safeArray(rawGuests);
  const cleaning = safeArray(rawCleaning);
  const properties = safeArray(rawProperties);
  const settings = rawSettings || {};
  const cleaners = safeArray(settings.cleaners);

  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [saveNotice, setSaveNotice] = useState("");

  const cur = settings.default_currency || "JMD";
  const selectedPropFilter = propFilter || "ALL";

  const hasProperties = properties.length > 0;
  const hasBookings = bookings.length > 0;

  const filtered = (selectedPropFilter === "ALL"
    ? bookings
    : bookings.filter((booking) => booking.property_id === selectedPropFilter)
  )
    .filter(
      (booking) =>
        statusFilter === "ALL" || booking.booking_status === statusFilter
    )
    .sort((a, b) => new Date(b.checkin_date) - new Date(a.checkin_date));

  const emptyRecord = {
    booking_id: "",
    property_id: properties[0]?.property_id || "",
    guest_id: "",
    guest_name: "",
    platform: "Airbnb",
    checkin_date: todayISO(),
    checkout_date: "",
    nightly_rate: 0,
    cleaning_fee: 0,
    extra_fees: 0,
    discounts: 0,
    payment_status: "Pending",
    booking_status: "Confirmed",
    source_notes: "",
  };

  const startNewBooking = () => {
    if (!hasProperties) return;
    setSaveNotice("");
    setEditing(emptyRecord);
  };

  const getOrCreateGuestForBooking = (booking) => {
    const cleanName = String(booking.guest_name || "").trim();
    const existingGuest = guests.find(
      (guest) => normalizeName(guest.guest_name) === normalizeName(cleanName)
    );

    if (existingGuest) {
      return {
        guestId: existingGuest.guest_id,
        nextGuests: guests,
        created: false,
      };
    }

    const guestId = uid("GUEST");

    const newGuest = {
      guest_id: guestId,
      guest_name: cleanName,
      country: "",
      email: "",
      phone: "",
      review_left: false,
      direct_followup_sent: false,
      preferences: "",
      notes: `Created automatically from booking ${booking.booking_id}.`,
      last_contacted_date: todayISO(),
      next_followup_date: "",
    };

    return {
      guestId,
      nextGuests: [...guests, newGuest],
      created: true,
    };
  };

  const buildCleaningTaskForBooking = (booking) => {
    return {
      cleaning_id: uid("CLEAN"),
      property_id: booking.property_id,
      booking_id: booking.booking_id,
      checkout_date: booking.checkout_date,
      next_checkin_date: "",
      cleaner_name: cleaners[0]?.name || "",
      cleaning_status: "Scheduled",
      linen_status: "Not Checked",
      damage_check: "Not Checked",
      supplies_restocked: false,
      photos_uploaded: false,
      time_completed: "",
      cleaning_cost: toNumber(booking.cleaning_fee),
      notes: `Created automatically from booking ${booking.booking_id} for ${booking.guest_name}.`,
    };
  };

  const save = (booking, automationOptions = {}) => {
    if (!booking.booking_id) {
      const bookingId = uid("BK");
      let nextBooking = {
        ...booking,
        booking_id: bookingId,
      };

      let guestCreated = false;
      let cleaningCreated = false;

      if (automationOptions.createGuest) {
        const guestResult = getOrCreateGuestForBooking(nextBooking);
        nextBooking = {
          ...nextBooking,
          guest_id: guestResult.guestId,
        };
        guestCreated = guestResult.created;

        if (guestResult.nextGuests !== guests) {
          setGuests(guestResult.nextGuests);
        }
      }

      if (automationOptions.createCleaningTask) {
        const alreadyHasCleaningForBooking = cleaning.some(
          (task) => task.booking_id === bookingId
        );

        if (!alreadyHasCleaningForBooking) {
          setCleaning([...cleaning, buildCleaningTaskForBooking(nextBooking)]);
          cleaningCreated = true;
        }
      }

      setBookings([...bookings, nextBooking]);

      const noticeParts = ["Booking saved"];

      if (automationOptions.createGuest) {
        noticeParts.push(
          guestCreated ? "guest record created" : "existing guest linked"
        );
      }

      if (automationOptions.createCleaningTask && cleaningCreated) {
        noticeParts.push("cleaning task created");
      }

      setSaveNotice(`${noticeParts.join(", ")}.`);
    } else {
      setBookings(
        bookings.map((existingBooking) =>
          existingBooking.booking_id === booking.booking_id
            ? booking
            : existingBooking
        )
      );

      setSaveNotice("Booking updated.");
    }

    setEditing(null);
  };

  const del = (id) => {
    const confirmed = window.confirm(
      "Delete this booking? This will not automatically delete the connected guest or cleaning task. Continue?"
    );

    if (!confirmed) return;

    setBookings(bookings.filter((booking) => booking.booking_id !== id));
    setEditing(null);
    setSaveNotice("Booking deleted.");
  };

  const getProp = (id) =>
    properties.find((property) => property.property_id === id);

  const totalFilteredRevenue = filtered.reduce(
    (sum, booking) => sum + bookingTotal(booking),
    0
  );

  const totalFilteredNights = filtered.reduce(
    (sum, booking) =>
      sum + calcNights(booking.checkin_date, booking.checkout_date),
    0
  );

  return (
    <div className="page">
      <PageHeader
        title="Booking Calendar"
        subtitle="Every reservation across every channel — Airbnb, Booking.com, WhatsApp, Instagram, direct."
        helper="Add every booking here, even if it came from WhatsApp or a direct guest. This is how the app calculates revenue, occupancy, cleaning tasks, and profit."
        actions={
          <>
            <button
              className="btn-secondary"
              onClick={() => downloadCSV("bookings.csv", filtered)}
              disabled={filtered.length === 0}
              title={
                filtered.length === 0
                  ? "Add bookings before exporting"
                  : "Export current bookings"
              }
            >
              <Download size={14} />
              Export CSV
            </button>

            <button
              className="btn-primary"
              onClick={startNewBooking}
              disabled={!hasProperties}
              title={
                !hasProperties
                  ? "Add a property before creating bookings"
                  : "Add booking"
              }
            >
              <Plus size={14} />
              Add Booking
            </button>
          </>
        }
      />

      {saveNotice && (
        <div className="account-alert success" style={{ marginBottom: 18 }}>
          <span>{saveNotice}</span>
        </div>
      )}

      {!hasProperties ? (
        <NoPropertyState setPage={setPage} />
      ) : (
        <>
          {!hasBookings && <EmptyBookingsState onAddBooking={startNewBooking} />}

          {hasBookings && (
            <div className="metric-grid" style={{ marginBottom: 18 }}>
              <div className="metric-card teal">
                <div className="metric-label">Filtered Revenue</div>
                <div className="metric-value">
                  {fmtCurrency(totalFilteredRevenue, cur)}
                </div>
                <div className="metric-sub">
                  {filtered.length} booking{filtered.length === 1 ? "" : "s"} shown
                </div>
              </div>

              <div className="metric-card sand">
                <div className="metric-label">Filtered Nights</div>
                <div className="metric-value">{totalFilteredNights}</div>
                <div className="metric-sub">Nights from current filters</div>
              </div>

              <div className="metric-card sand">
                <div className="metric-label">All Bookings</div>
                <div className="metric-value">{bookings.length}</div>
                <div className="metric-sub">Total booking records</div>
              </div>

              <div className="metric-card amber">
                <div className="metric-label">Selected Status</div>
                <div className="metric-value" style={{ fontSize: 24 }}>
                  {statusFilter === "ALL" ? "All" : statusFilter}
                </div>
                <div className="metric-sub">
                  Current booking status filter
                </div>
              </div>
            </div>
          )}

          {hasBookings && (
            <div className="status-filters">
              {["ALL", ...STATUSES].map((status) => (
                <button
                  key={status}
                  className={`status-filter-btn ${
                    status === statusFilter ? "active" : ""
                  }`}
                  onClick={() => setStatusFilter(status)}
                >
                  {status === "ALL" ? "All Status" : status}
                </button>
              ))}
            </div>
          )}

          <div className="card" style={{ overflow: "hidden" }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Property</th>
                    <th>Platform</th>
                    <th>Check-in</th>
                    <th>Check-out</th>
                    <th className="td-right">Nights</th>
                    <th className="td-right">Total</th>
                    <th>Payment</th>
                    <th>Status</th>
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
                        {hasBookings
                          ? "No bookings match the current filter."
                          : "No bookings yet. Use the Add Booking button to create your first reservation."}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((booking) => {
                      const nights = calcNights(
                        booking.checkin_date,
                        booking.checkout_date
                      );

                      return (
                        <tr
                          key={booking.booking_id}
                          className="tr-clickable"
                          onClick={() => setEditing(booking)}
                        >
                          <td>
                            <div className="fw-bold">
                              {booking.guest_name || "Unnamed guest"}
                            </div>
                            <div className="td-muted">
                              {booking.booking_id}
                              {booking.guest_id ? ` · ${booking.guest_id}` : ""}
                            </div>
                          </td>

                          <td>
                            {getProp(booking.property_id)?.property_name ||
                              "—"}
                          </td>

                          <td>
                            <Chip
                              tone={
                                [
                                  "Direct",
                                  "WhatsApp",
                                  "Instagram",
                                  "Referral",
                                ].includes(booking.platform)
                                  ? "teal"
                                  : "blue"
                              }
                            >
                              {booking.platform || "—"}
                            </Chip>
                          </td>

                          <td className="num">
                            {fmtDateShort(booking.checkin_date)}
                          </td>

                          <td className="num">
                            {fmtDateShort(booking.checkout_date)}
                          </td>

                          <td className="td-right num">{nights}</td>

                          <td className="td-right num fw-bold">
                            {fmtCurrency(bookingTotal(booking), cur)}
                          </td>

                          <td>
                            <Chip tone={paymentStatusChip(booking.payment_status)}>
                              {booking.payment_status}
                            </Chip>
                          </td>

                          <td>
                            <Chip tone={bookingStatusChip(booking.booking_status)}>
                              {booking.booking_status}
                            </Chip>
                          </td>

                          <td>
                            <ChevronRight size={14} color="var(--muted)" />
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {editing && (
        <BookingForm
          record={editing}
          onClose={() => setEditing(null)}
          onSave={save}
          onDelete={del}
          properties={properties}
          currency={cur}
        />
      )}
    </div>
  );
}
