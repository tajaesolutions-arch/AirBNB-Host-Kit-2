// ============================================================
//  OWNER REPORT, TAX RESERVE, SOPS, MESSAGES, SETTINGS
// ============================================================

import { useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import {
  PageHeader,
  Disclaimer,
  Modal,
  ConfirmBar,
} from "../components/index.jsx";
import {
  bookingTotal,
  calcNights,
  fmtCurrency,
  fmtPct,
  inSelectedMonth,
  daysInMonth,
  uid as uidHelper,
  normalizeCurrency,
  SUPPORTED_CURRENCIES,
} from "../utils/helpers.js";
import {
  Copy,
  CheckCircle2,
  Plus,
  Trash2,
  Download,
  Upload,
} from "lucide-react";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeSettings(value) {
  return value && typeof value === "object" ? value : {};
}

function toNumber(value) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
}

const getCurrentMonth = () => new Date().toISOString().slice(0, 7);

// ============================================================
//  OWNER REPORT PAGE
// ============================================================

export function OwnerReport({ monthFilter }) {
  const {
    properties: rawProperties,
    bookings: rawBookings,
    expenses: rawExpenses,
    maintenance: rawMaintenance,
    cleaning: rawCleaning,
    settings: rawSettings,
  } = useApp();

  const properties = safeArray(rawProperties);
  const bookings = safeArray(rawBookings);
  const expenses = safeArray(rawExpenses);
  const maintenance = safeArray(rawMaintenance);
  const cleaning = safeArray(rawCleaning);
  const settings = safeSettings(rawSettings);

  const [selectedProp, setSelectedProp] = useState(
    properties[0]?.property_id || ""
  );
  const [reportMonth, setReportMonth] = useState(
    monthFilter || getCurrentMonth()
  );
  const [extraNotes, setExtraNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const cur = normalizeCurrency(settings.default_currency || "JMD");

  const prop = properties.find(
    (property) => property.property_id === selectedProp
  );

  const propBookings = bookings.filter(
    (booking) =>
      booking.property_id === selectedProp &&
      booking.booking_status !== "Cancelled" &&
      (inSelectedMonth(booking.checkin_date, reportMonth) ||
        inSelectedMonth(booking.checkout_date, reportMonth))
  );

  const propExpenses = expenses.filter(
    (expense) =>
      (expense.property_id === selectedProp || !expense.property_id) &&
      inSelectedMonth(expense.expense_date, reportMonth)
  );

  const propMaint = maintenance.filter(
    (issue) => issue.property_id === selectedProp
  );

  const propCleaning = cleaning.filter(
    (task) =>
      task.property_id === selectedProp &&
      inSelectedMonth(task.checkout_date, reportMonth)
  );

  const grossRevenue = propBookings.reduce(
    (sum, booking) => sum + bookingTotal(booking),
    0
  );

  const airbnbRev = propBookings
    .filter((booking) => booking.platform === "Airbnb")
    .reduce((sum, booking) => sum + bookingTotal(booking), 0);

  const directRev = propBookings
    .filter((booking) =>
      ["Direct", "WhatsApp", "Instagram", "Google", "Referral"].includes(
        booking.platform
      )
    )
    .reduce((sum, booking) => sum + bookingTotal(booking), 0);

  const cleaningCost = propExpenses
    .filter((expense) => expense.category === "Cleaning")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const utilityCost = propExpenses
    .filter((expense) =>
      ["JPS", "NWC", "Internet", "Utilities"].includes(expense.category)
    )
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const repairsCost = propExpenses
    .filter((expense) => ["Repairs", "Maintenance"].includes(expense.category))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const suppliesCost = propExpenses
    .filter((expense) =>
      ["Supplies", "Linen", "Guest Amenity"].includes(expense.category)
    )
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const otherCost = propExpenses
    .filter(
      (expense) =>
        ![
          "Cleaning",
          "JPS",
          "NWC",
          "Internet",
          "Utilities",
          "Repairs",
          "Maintenance",
          "Supplies",
          "Linen",
          "Guest Amenity",
        ].includes(expense.category)
    )
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const totalExpenses =
    cleaningCost + utilityCost + repairsCost + suppliesCost + otherCost;

  const managementFee =
    grossRevenue * Number(settings.management_fee_percentage || 0);

  const taxReserve = grossRevenue * Number(settings.tax_reserve_percentage || 0);

  const ownerPayout = grossRevenue - totalExpenses - managementFee - taxReserve;

  const bookedNights = propBookings.reduce(
    (sum, booking) =>
      sum + calcNights(booking.checkin_date, booking.checkout_date),
    0
  );

  const occupancy =
    daysInMonth(reportMonth) > 0 ? bookedNights / daysInMonth(reportMonth) : 0;

  const avgNightly =
    bookedNights > 0
      ? propBookings.reduce(
          (sum, booking) =>
            sum +
            (Number(booking.nightly_rate) || 0) *
              calcNights(booking.checkin_date, booking.checkout_date),
          0
        ) / bookedNights
      : 0;

  const openMaint = propMaint.filter(
    (issue) => issue.status !== "Completed" && issue.status !== "Cancelled"
  );

  const completedMaint = propMaint.filter(
    (issue) =>
      issue.status === "Completed" &&
      inSelectedMonth(issue.completion_date, reportMonth)
  );

  const reportText = `MONTHLY OWNER REPORT
${prop?.property_name || ""} — ${prop?.parish_town || ""}
Period: ${reportMonth}
Prepared by: ${settings.business_name || settings.host_name || ""}
Currency: ${cur}
Date: ${new Date().toLocaleDateString("en-JM")}

═══════════════════════════════════
REVENUE SUMMARY
═══════════════════════════════════
Gross revenue:        ${fmtCurrency(grossRevenue, cur)}
Airbnb revenue:       ${fmtCurrency(airbnbRev, cur)}
Direct booking:       ${fmtCurrency(directRev, cur)}
Total bookings:       ${propBookings.length}
Booked nights:        ${bookedNights}
Occupancy:            ${fmtPct(occupancy)}
Avg nightly rate:     ${fmtCurrency(avgNightly, cur)}

═══════════════════════════════════
EXPENSES
═══════════════════════════════════
Cleaning:             ${fmtCurrency(cleaningCost, cur)}
Utilities:            ${fmtCurrency(utilityCost, cur)}
Repairs:              ${fmtCurrency(repairsCost, cur)}
Supplies:             ${fmtCurrency(suppliesCost, cur)}
Other:                ${fmtCurrency(otherCost, cur)}
Total expenses:       ${fmtCurrency(totalExpenses, cur)}

═══════════════════════════════════
OWNER PAYOUT (ESTIMATED)
═══════════════════════════════════
Gross revenue:        ${fmtCurrency(grossRevenue, cur)}
Less expenses:       −${fmtCurrency(totalExpenses, cur)}
Less mgmt fee:       −${fmtCurrency(managementFee, cur)} (${fmtPct(
    settings.management_fee_percentage
  )})
Less tax reserve:    −${fmtCurrency(taxReserve, cur)} (${fmtPct(
    settings.tax_reserve_percentage
  )})
─────────────────────────────────
Est. owner payout:    ${fmtCurrency(ownerPayout, cur)}

═══════════════════════════════════
MAINTENANCE
═══════════════════════════════════
Open issues: ${openMaint.length}
${
  openMaint
    .map(
      (issue) =>
        `  • ${issue.issue_title} (${issue.priority}) — ${issue.status}`
    )
    .join("\n") || "  None"
}

Completed this month: ${completedMaint.length}
${
  completedMaint
    .map(
      (issue) =>
        `  • ${issue.issue_title} — ${fmtCurrency(issue.actual_cost, cur)}`
    )
    .join("\n") || "  None"
}

═══════════════════════════════════
CLEANING
═══════════════════════════════════
Turnovers completed:  ${
    propCleaning.filter((task) => task.cleaning_status === "Completed").length
  }
Turnovers scheduled:  ${
    propCleaning.filter((task) => task.cleaning_status === "Scheduled").length
  }

═══════════════════════════════════
NOTES
═══════════════════════════════════
${extraNotes || "(None)"}

── End of Report ──`;

  const handleCopy = () => {
    navigator.clipboard?.writeText(reportText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (properties.length === 0) {
    return (
      <div className="page">
        <PageHeader
          title="Owner Report"
          subtitle="Generate a clean monthly summary for the property owner."
          helper="Add a property first before generating owner reports."
        />

        <div className="card-sand" style={{ padding: 22 }}>
          <h3 className="section-title">No properties yet</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
            Add your first property in Settings, then return here to generate an
            owner report.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <PageHeader
        title="Owner Report"
        subtitle="Generate a clean monthly summary for the property owner."
        helper="If you manage a property for someone else, this gives them a clear monthly summary of income, costs, repairs, and payout."
      />

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="card" style={{ padding: 18, marginBottom: 14 }}>
            <h3 className="section-title">Report Settings</h3>

            <div className="field">
              <label className="field-label">Property</label>
              <select
                value={selectedProp}
                onChange={(event) => setSelectedProp(event.target.value)}
              >
                {properties.map((property) => (
                  <option
                    key={property.property_id}
                    value={property.property_id}
                  >
                    {property.property_name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Report Month</label>
              <input
                type="month"
                value={reportMonth}
                onChange={(event) => setReportMonth(event.target.value)}
              />
            </div>

            <div className="field">
              <label className="field-label">Notes / Recommendations</label>
              <textarea
                value={extraNotes}
                onChange={(event) => setExtraNotes(event.target.value)}
                rows={4}
                placeholder="Recommended actions for next month..."
              />
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%" }}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <CheckCircle2 size={14} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={14} /> Copy Report to Clipboard
                </>
              )}
            </button>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 className="section-title">Payout Summary</h3>

            {[
              ["Gross Revenue", fmtCurrency(grossRevenue, cur), "fw-bold"],
              ["Occupancy", fmtPct(occupancy), ""],
              ["Total Expenses", `−${fmtCurrency(totalExpenses, cur)}`, ""],
              ["Mgmt Fee", `−${fmtCurrency(managementFee, cur)}`, ""],
              ["Tax Reserve", `−${fmtCurrency(taxReserve, cur)}`, ""],
            ].map(([label, value, className]) => (
              <div key={label} className="profit-row">
                <span className="profit-label">{label}</span>
                <span className={`profit-value ${className}`}>{value}</span>
              </div>
            ))}

            <div className="profit-row total">
              <span style={{ color: "var(--teal)", fontWeight: 700 }}>
                Est. Owner Payout
              </span>
              <span className="profit-value teal">
                {fmtCurrency(ownerPayout, cur)}
              </span>
            </div>
          </div>
        </div>

        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <h3 className="section-title" style={{ marginBottom: 0 }}>
              Report Preview
            </h3>

            <button className="btn-ghost" onClick={handleCopy}>
              <Copy size={13} /> {copied ? "Copied!" : "Copy"}
            </button>
          </div>

          <div className="report-preview">{reportText}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  TAX RESERVE PAGE
// ============================================================

export function TaxReserve({ monthFilter }) {
  const { settings: rawSettings, setSettings, bookings: rawBookings } = useApp();

  const settings = safeSettings(rawSettings);
  const bookings = safeArray(rawBookings);

  const [rate, setRate] = useState(() =>
    Number(settings.tax_reserve_percentage ?? 0)
  );

  const cur = normalizeCurrency(settings.default_currency || "JMD");

  const selectedMonth = monthFilter || getCurrentMonth();

  const months = [...Array(12)].map((_, index) => {
    const date = new Date(selectedMonth + "-01");
    date.setMonth(date.getMonth() - 11 + index);
    return date.toISOString().slice(0, 7);
  });

  const checklist = [
    "Export monthly bookings summary from Airbnb",
    "Export platform payout statement",
    "Compile direct booking income records",
    "Collect all expense receipts for the period",
    "Prepare summary of cleaning staff payments",
    "Gather maintenance vendor invoices",
    "Print or export bank statements",
    "Confirm tax reserve amount with accountant",
    "Book appointment with Jamaican accountant",
    "Submit all documents to accountant",
    "Confirm filing is complete",
  ];

  const [checked, setChecked] = useState(() => checklist.map(() => false));

  const toggle = (index) =>
    setChecked((current) => {
      const next = [...current];
      next[index] = !next[index];
      return next;
    });

  const updateRate = (event) => {
    const nextRate = Number(event.target.value) / 100;

    setRate(nextRate);
    setSettings((previousSettings) => ({
      ...previousSettings,
      tax_reserve_percentage: nextRate,
    }));
  };

  return (
    <div className="page">
      <PageHeader
        title="Tax / GCT Reserve Tracker"
        subtitle="Set aside money from rental revenue for possible tax obligations."
        helper={`Currently reserving ${(rate * 100).toFixed(
          1
        )}% of gross revenue. Edit the percentage in Settings → Tax Reserve %.`}
      />

      <Disclaimer text="This tool is for planning and organisation only. It is NOT legal, accounting, or tax advice. Tax rules may change and obligations vary by host, property, platform, and business structure. Confirm requirements with a qualified Jamaican accountant or tax professional." />

      <div className="grid-2" style={{ alignItems: "start" }}>
        <div>
          <div className="card" style={{ padding: 18, marginBottom: 14 }}>
            <h3 className="section-title">Reserve Percentage</h3>

            <div className="field">
              <label className="field-label">
                Tax Reserve % — editable planning estimate
              </label>

              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={(rate * 100).toFixed(1)}
                onChange={updateRate}
              />

              <p className="field-helper">
                This percentage applies to gross booking revenue. It is a
                planning estimate only.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: 18 }}>
            <h3 className="section-title">Monthly Revenue & Reserve</h3>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th className="td-right">Bookings Revenue</th>
                    <th className="td-right">Est. Reserve</th>
                  </tr>
                </thead>

                <tbody>
                  {months.map((month) => {
                    const monthBookings = bookings.filter(
                      (booking) =>
                        booking.booking_status !== "Cancelled" &&
                        (inSelectedMonth(booking.checkin_date, month) ||
                          inSelectedMonth(booking.checkout_date, month))
                    );

                    const revenue = monthBookings.reduce(
                      (sum, booking) => sum + bookingTotal(booking),
                      0
                    );

                    const reserve = revenue * rate;

                    return (
                      <tr key={month}>
                        <td className="num">{month}</td>
                        <td className="td-right num">
                          {fmtCurrency(revenue, cur)}
                        </td>
                        <td
                          className="td-right num"
                          style={{
                            color: "var(--amber)",
                            fontWeight: 600,
                          }}
                        >
                          {fmtCurrency(reserve, cur)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 className="section-title">Accountant Handoff Checklist</h3>

          <p
            style={{
              fontSize: 12.5,
              color: "var(--muted)",
              marginBottom: 14,
              lineHeight: 1.6,
            }}
          >
            Use this list when preparing documents for your accountant or tax
            professional.
          </p>

          <div className="sop-items" style={{ border: "none" }}>
            {checklist.map((item, index) => (
              <div
                key={item}
                className={`sop-item ${checked[index] ? "checked" : ""}`}
                onClick={() => toggle(index)}
              >
                <div
                  className={`sop-checkbox ${
                    checked[index] ? "checked" : ""
                  }`}
                >
                  {checked[index] && <CheckCircle2 size={13} color="#fff" />}
                </div>

                <span className="sop-text">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  SETTINGS PAGE
// ============================================================

export function Settings() {
  const {
    properties: rawProperties,
    setProperties,
    settings: rawSettings,
    setSettings,
  } = useApp();

  const properties = safeArray(rawProperties);
  const settings = safeSettings(rawSettings);
  const cleaners = safeArray(settings.cleaners);
  const vendors = safeArray(settings.vendors);
  const currentCurrency = normalizeCurrency(settings.default_currency || "JMD");

  const [editingProp, setEditingProp] = useState(null);
  const [propForm, setPropForm] = useState(null);
  const [newCleaner, setNewCleaner] = useState({ name: "", phone: "" });
  const [newVendor, setNewVendor] = useState({ name: "", category: "" });

  const updateSetting = (key, value) =>
    setSettings((previousSettings) => ({
      ...previousSettings,
      [key]: value,
    }));

  const startNewProp = () => {
    setEditingProp("new");
    setPropForm({
      property_name: "",
      parish_town: "",
      property_type: "Apartment",
      bedrooms: 2,
      bathrooms: 1,
      max_guests: 4,
      owner_name: "",
      owner_email: "",
      default_nightly_rate: 0,
      default_cleaning_fee: 0,
      default_checkin_time: "15:00",
      default_checkout_time: "11:00",
      wifi_name: "",
      wifi_password: "",
      address: "",
      notes: "",
      active: true,
    });
  };

  const startEditProp = (property) => {
    setEditingProp(property.property_id);
    setPropForm({ ...property });
  };

  const saveProp = () => {
    if (!String(propForm?.property_name || "").trim()) return;

    const normalizedProperty = {
      ...propForm,
      property_name: String(propForm.property_name || "").trim(),
      bedrooms: toNumber(propForm.bedrooms),
      bathrooms: toNumber(propForm.bathrooms),
      max_guests: Math.max(1, toNumber(propForm.max_guests)),
      default_nightly_rate: toNumber(propForm.default_nightly_rate),
      default_cleaning_fee: toNumber(propForm.default_cleaning_fee),
    };

    if (editingProp === "new") {
      setProperties([
        ...properties,
        {
          ...normalizedProperty,
          property_id: uidHelper("PROP"),
        },
      ]);
    } else {
      setProperties(
        properties.map((property) =>
          property.property_id === editingProp ? normalizedProperty : property
        )
      );
    }

    setEditingProp(null);
    setPropForm(null);
  };

  const deleteProp = (id) => {
    const confirmed = window.confirm(
      "Delete this property? Existing bookings and records attached to this property may lose their property reference."
    );

    if (!confirmed) return;

    setProperties(properties.filter((property) => property.property_id !== id));
    setEditingProp(null);
    setPropForm(null);
  };

  const addCleaner = () => {
    if (!String(newCleaner.name || "").trim()) return;

    updateSetting("cleaners", [
      ...cleaners,
      {
        name: String(newCleaner.name || "").trim(),
        phone: String(newCleaner.phone || "").trim(),
      },
    ]);

    setNewCleaner({ name: "", phone: "" });
  };

  const removeCleaner = (index) =>
    updateSetting(
      "cleaners",
      cleaners.filter((_, cleanerIndex) => cleanerIndex !== index)
    );

  const addVendor = () => {
    if (!String(newVendor.name || "").trim()) return;

    updateSetting("vendors", [
      ...vendors,
      {
        name: String(newVendor.name || "").trim(),
        category: String(newVendor.category || "").trim(),
      },
    ]);

    setNewVendor({ name: "", category: "" });
  };

  const removeVendor = (index) =>
    updateSetting(
      "vendors",
      vendors.filter((_, vendorIndex) => vendorIndex !== index)
    );

  const SectionTitle = ({ children }) => (
    <div
      style={{
        padding: "14px 0 10px",
        fontFamily: "Fraunces, serif",
        fontSize: 16,
        fontWeight: 600,
        borderBottom: "2px solid var(--navy)",
        marginBottom: 14,
        color: "var(--navy)",
      }}
    >
      {children}
    </div>
  );

  return (
    <div className="page">
      <PageHeader
        title="Settings"
        subtitle="Configure your properties, fees, currency, backup tools, and team."
        helper="Start here before adding bookings. Set your property details, default fees, currency, and cleaner names first."
      />

      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <SectionTitle>Business Information</SectionTitle>

        <div className="form-grid-2">
          <div className="field">
            <label className="field-label">Business / Host Name</label>
            <input
              value={settings.business_name || ""}
              onChange={(event) =>
                updateSetting("business_name", event.target.value)
              }
            />
          </div>

          <div className="field">
            <label className="field-label">Default Currency</label>
            <select
              value={currentCurrency}
              onChange={(event) =>
                updateSetting(
                  "default_currency",
                  normalizeCurrency(event.target.value)
                )
              }
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </select>

            <p className="field-helper">
              The dashboard stores values as JMD and converts display totals
              when another currency is selected.
            </p>
          </div>

          <div className="field">
            <label className="field-label">Host Phone</label>
            <input
              value={settings.host_phone || ""}
              onChange={(event) =>
                updateSetting("host_phone", event.target.value)
              }
            />
          </div>

          <div className="field">
            <label className="field-label">Host Email</label>
            <input
              value={settings.host_email || ""}
              onChange={(event) =>
                updateSetting("host_email", event.target.value)
              }
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <SectionTitle>Fee & Reserve Percentages</SectionTitle>

        <div className="form-grid-2">
          <div className="field">
            <label className="field-label">Platform Fee %</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={+(
                Number(settings.platform_fee_percentage || 0) * 100
              ).toFixed(2)}
              onChange={(event) =>
                updateSetting(
                  "platform_fee_percentage",
                  Number(event.target.value) / 100
                )
              }
            />
          </div>

          <div className="field">
            <label className="field-label">Management Fee %</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={+(
                Number(settings.management_fee_percentage || 0) * 100
              ).toFixed(2)}
              onChange={(event) =>
                updateSetting(
                  "management_fee_percentage",
                  Number(event.target.value) / 100
                )
              }
            />
          </div>

          <div className="field">
            <label className="field-label">Tax Reserve %</label>
            <input
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={+(
                Number(settings.tax_reserve_percentage || 0) * 100
              ).toFixed(2)}
              onChange={(event) =>
                updateSetting(
                  "tax_reserve_percentage",
                  Number(event.target.value) / 100
                )
              }
            />
          </div>

          <div className="field">
            <label className="field-label">Default Check-in Time</label>
            <input
              type="time"
              value={settings.default_checkin_time ?? ""}
              onChange={(event) =>
                updateSetting("default_checkin_time", event.target.value)
              }
            />
          </div>

          <div className="field">
            <label className="field-label">Default Checkout Time</label>
            <input
              type="time"
              value={settings.default_checkout_time ?? ""}
              onChange={(event) =>
                updateSetting("default_checkout_time", event.target.value)
              }
            />
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginBottom: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 14,
          }}
        >
          <SectionTitle>Properties</SectionTitle>

          <button className="btn-primary" onClick={startNewProp}>
            <Plus size={14} /> Add Property
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {properties.map((property) => (
            <div
              key={property.property_id}
              style={{
                padding: "14px 16px",
                border: "1px solid var(--line)",
                borderRadius: 10,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>
                  {property.property_name}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    marginTop: 3,
                  }}
                >
                  {property.parish_town} · {property.property_type} ·{" "}
                  {property.bedrooms} BR · Sleeps {property.max_guests}
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: "var(--muted)",
                    marginTop: 3,
                  }}
                >
                  Default rate:{" "}
                  {fmtCurrency(
                    property.default_nightly_rate || 0,
                    currentCurrency
                  )}
                  {" · "}
                  Cleaning:{" "}
                  {fmtCurrency(
                    property.default_cleaning_fee || 0,
                    currentCurrency
                  )}
                </div>
              </div>

              <button
                className="btn-ghost"
                onClick={() => startEditProp(property)}
                style={{ fontSize: 12 }}
              >
                Edit
              </button>
            </div>
          ))}

          {properties.length === 0 && (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              No properties yet. Add your first property to start tracking.
            </p>
          )}
        </div>
      </div>

      <BackupDataCard />

      <ResetDashboardDataCard />

      {editingProp && propForm && (
        <Modal
          open
          onClose={() => {
            setEditingProp(null);
            setPropForm(null);
          }}
          title={editingProp === "new" ? "Add Property" : "Edit Property"}
          wide
          footer={
            <>
              {editingProp !== "new" && (
                <button
                  className="btn-danger"
                  onClick={() => deleteProp(editingProp)}
                >
                  <Trash2 size={13} /> Delete
                </button>
              )}

              <div className="modal-footer-spacer" />

              <ConfirmBar
                onCancel={() => {
                  setEditingProp(null);
                  setPropForm(null);
                }}
                onSave={saveProp}
                saveLabel={
                  editingProp === "new" ? "Add Property" : "Save Changes"
                }
              />
            </>
          }
        >
          <div className="form-grid-2">
            <div className="field" style={{ gridColumn: "span 2" }}>
              <label className="field-label">Property Name *</label>
              <input
                value={propForm.property_name || ""}
                onChange={(event) =>
                  setPropForm((current) => ({
                    ...current,
                    property_name: event.target.value,
                  }))
                }
                placeholder="e.g. Sunset Villa Montego Bay"
              />
            </div>

            <div className="field">
              <label className="field-label">Parish / Town</label>
              <input
                value={propForm.parish_town || ""}
                onChange={(event) =>
                  setPropForm((current) => ({
                    ...current,
                    parish_town: event.target.value,
                  }))
                }
                placeholder="e.g. Montego Bay, St. James"
              />
            </div>

            <div className="field">
              <label className="field-label">Property Type</label>
              <select
                value={propForm.property_type || "Apartment"}
                onChange={(event) =>
                  setPropForm((current) => ({
                    ...current,
                    property_type: event.target.value,
                  }))
                }
              >
                {[
                  "Apartment",
                  "Villa",
                  "Condo",
                  "House",
                  "Studio",
                  "Cottage",
                  "Guesthouse",
                  "Other",
                ].map((type) => (
                  <option key={type}>{type}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label className="field-label">Bedrooms</label>
              <input
                type="number"
                min={0}
                value={propForm.bedrooms || 0}
                onChange={(event) =>
                  setPropForm((current) => ({
                    ...current,
                    bedrooms: Number(event.target.value),
                  }))
                }
              />
            </div>

            <div className="field">
              <label className="field-label">Bathrooms</label>
              <input
                type="number"
                min={0}
                step={0.5}
                value={propForm.bathrooms || 0}
                onChange={(event) =>
                  setPropForm((current) => ({
                    ...current,
                    bathrooms: Number(event.target.value),
                  }))
                }
              />
            </div>

            <div className="field">
              <label className="field-label">Max Guests</label>
              <input
                type="number"
                min={1}
                value={propForm.max_guests || 2}
                onChange={(event) =>
                  setPropForm((current) => ({
                    ...current,
                    max_guests: Number(event.target.value),
                  }))
                }
              />
            </div>

            <div className="field">
              <label className="field-label">
                Default Nightly Rate ({currentCurrency})
              </label>
              <input
                type="number"
                min={0}
                value={propForm.default_nightly_rate || 0}
                onChange={(event) =>
                  setPropForm((current) => ({
                    ...current,
                    default_nightly_rate: Number(event.target.value),
                  }))
                }
              />
            </div>

            <div className="field">
              <label className="field-label">
                Default Cleaning Fee ({currentCurrency})
              </label>
              <input
                type="number"
                min={0}
                value={propForm.default_cleaning_fee || 0}
                onChange={(event) =>
                  setPropForm((current) => ({
                    ...current,
                    default_cleaning_fee: Number(event.target.value),
                  }))
                }
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ============================================================
//  BACKUP DATA CARD
// ============================================================

function BackupDataCard() {
  const { getBackupData, importBackupData } = useApp();

  const importInputRef = useRef(null);

  const [backupLoading, setBackupLoading] = useState(false);
  const [backupMessage, setBackupMessage] = useState("");
  const [backupError, setBackupError] = useState("");

  const handleExportBackup = () => {
    setBackupMessage("");
    setBackupError("");

    try {
      const backupData = getBackupData();
      const prettyJson = JSON.stringify(backupData, null, 2);
      const blob = new Blob([prettyJson], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const dateStamp = new Date().toISOString().slice(0, 10);
      const link = document.createElement("a");

      link.href = url;
      link.download = `airbnb-host-kit-backup-${dateStamp}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setBackupMessage(
        "Backup exported successfully. Keep the file somewhere safe."
      );
    } catch (error) {
      setBackupError(error?.message || "Could not export backup file.");
    }
  };

  const handleImportClick = () => {
    setBackupMessage("");
    setBackupError("");
    importInputRef.current?.click();
  };

  const handleImportBackup = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const confirmed = window.confirm(
      "Importing this backup will replace your current dashboard records. Continue?"
    );

    if (!confirmed) {
      event.target.value = "";
      return;
    }

    setBackupLoading(true);
    setBackupMessage("");
    setBackupError("");

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const imported = importBackupData(parsed);

      setBackupMessage(
        `Backup imported successfully. Restored ${imported.properties.length} properties, ${imported.bookings.length} bookings, ${imported.guests.length} guests, ${imported.expenses.length} expenses, ${imported.supplies.length} supplies, ${imported.maintenance.length} maintenance records, and ${imported.leads.length} leads.`
      );
    } catch (error) {
      setBackupError(
        error?.message ||
          "Could not import backup. Make sure you selected a valid JSON backup file."
      );
    } finally {
      setBackupLoading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="card settings-reset-card">
      <div className="settings-reset-header">
        <div>
          <h2>Backup, Export & Import</h2>
          <p>
            Download a full JSON backup of this dashboard or restore a previous
            backup file.
          </p>
        </div>
      </div>

      {backupMessage && (
        <div className="account-alert success">
          <span>{backupMessage}</span>
        </div>
      )}

      {backupError && (
        <div className="account-alert error">
          <span>{backupError}</span>
        </div>
      )}

      <div className="settings-reset-grid">
        <div className="settings-reset-option">
          <h3>Export Backup</h3>
          <p>
            Downloads all properties, bookings, guests, cleaning tasks,
            maintenance records, supplies, expenses, leads, and settings.
          </p>

          <button
            type="button"
            className="btn-primary"
            onClick={handleExportBackup}
            disabled={backupLoading}
          >
            <Download size={14} /> Export Backup
          </button>
        </div>

        <div className="settings-reset-option">
          <h3>Import Backup</h3>
          <p>
            Restores a previously exported JSON backup and replaces the current
            dashboard records.
          </p>

          <input
            ref={importInputRef}
            type="file"
            accept="application/json,.json"
            onChange={handleImportBackup}
            style={{ display: "none" }}
          />

          <button
            type="button"
            className="btn-secondary"
            onClick={handleImportClick}
            disabled={backupLoading}
          >
            <Upload size={14} />
            {backupLoading ? "Importing..." : "Import Backup"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
//  RESET DASHBOARD DATA CARD
// ============================================================

function ResetDashboardDataCard() {
  const { resetToBlankData, restoreSampleData } = useApp();

  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [resetError, setResetError] = useState("");

  const handleResetBlank = () => {
    const confirmed = window.confirm(
      "This will permanently clear all dashboard records and blank out the workspace for this account. Continue?"
    );

    if (!confirmed) return;

    setResetLoading(true);
    setResetMessage("");
    setResetError("");

    try {
      resetToBlankData();
      setResetMessage("Your dashboard is now blank.");
    } catch (error) {
      setResetError(error?.message || "Could not reset account data.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetSample = () => {
    const confirmed = window.confirm(
      "This will replace your current dashboard records with sample data. Continue?"
    );

    if (!confirmed) return;

    setResetLoading(true);
    setResetMessage("");
    setResetError("");

    try {
      restoreSampleData();
      setResetMessage("Sample data has been reloaded.");
    } catch (error) {
      setResetError(error?.message || "Could not reload sample data.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="card settings-reset-card">
      <div className="settings-reset-header">
        <div>
          <h2>Reset Dashboard Data</h2>
          <p>
            Start over with a blank workspace or reload the sample data for demo
            testing.
          </p>
        </div>
      </div>

      {resetMessage && (
        <div className="account-alert success">
          <span>{resetMessage}</span>
        </div>
      )}

      {resetError && (
        <div className="account-alert error">
          <span>{resetError}</span>
        </div>
      )}

      <div className="settings-reset-grid">
        <div className="settings-reset-option">
          <h3>Blank Template</h3>
          <p>Clears dashboard records and gives you a blank workspace.</p>

          <button
            type="button"
            className="btn-danger"
            onClick={handleResetBlank}
            disabled={resetLoading}
          >
            {resetLoading ? "Resetting..." : "Reset to Blank Template"}
          </button>
        </div>

        <div className="settings-reset-option">
          <h3>Sample Data</h3>
          <p>Reloads sample Jamaica Airbnb host data for testing.</p>

          <button
            type="button"
            className="btn-secondary"
            onClick={handleResetSample}
            disabled={resetLoading}
          >
            {resetLoading ? "Loading..." : "Reset to Sample Data"}
          </button>
        </div>
      </div>
    </div>
  );
}
// ============================================================
//  SOPS PAGE
// ============================================================

export function SOPs() {
  const sopSections = [
    {
      title: "Guest Check-in SOP",
      items: [
        "Confirm guest arrival date, check-in time, and number of guests.",
        "Send check-in instructions with address, access details, Wi-Fi, and house rules.",
        "Verify that the property is cleaned, staged, and stocked before arrival.",
        "Confirm key box, smart lock, or access method is working.",
        "Send welcome message on the morning of check-in.",
      ],
    },
    {
      title: "Guest Checkout SOP",
      items: [
        "Send checkout reminder the evening before departure.",
        "Confirm checkout time and any special departure instructions.",
        "Ask guest to report damages, missing items, or issues before leaving.",
        "Notify cleaner once the guest has checked out.",
        "Review property condition after turnover is completed.",
      ],
    },
    {
      title: "Cleaning Turnover SOP",
      items: [
        "Strip beds and replace all linen and towels.",
        "Clean bathrooms, kitchen, bedrooms, living areas, and outdoor spaces.",
        "Restock toilet paper, soap, garbage bags, coffee, tea, and guest amenities.",
        "Check for damages, missing items, stains, leaks, or maintenance issues.",
        "Send completion photos or confirmation before next guest arrival.",
      ],
    },
    {
      title: "Maintenance SOP",
      items: [
        "Log the issue with property, priority, date, and estimated cost.",
        "Assign the issue to a vendor or internal team member.",
        "Update the issue status after inspection or repair.",
        "Save receipts, photos, and notes for owner reporting.",
        "Mark as completed only after verifying the fix.",
      ],
    },
  ];

  const initialState = sopSections.map((section) =>
    section.items.map(() => false)
  );

  const [checked, setChecked] = useState(initialState);

  const toggleItem = (sectionIndex, itemIndex) => {
    setChecked((current) =>
      current.map((sectionChecks, currentSectionIndex) =>
        currentSectionIndex === sectionIndex
          ? sectionChecks.map((itemChecked, currentItemIndex) =>
              currentItemIndex === itemIndex ? !itemChecked : itemChecked
            )
          : sectionChecks
      )
    );
  };

  return (
    <div className="page">
      <PageHeader
        title="SOPs"
        subtitle="Standard operating procedures for check-ins, checkouts, cleaning, and maintenance."
        helper="Use these checklists to keep turnovers consistent and reduce missed steps."
      />

      {sopSections.map((section, sectionIndex) => (
        <div className="sop-section" key={section.title}>
          <div className="sop-section-title">
            <ClipboardList size={16} />
            <span>{section.title}</span>
          </div>

          <div className="sop-items">
            {section.items.map((item, itemIndex) => {
              const itemChecked = checked[sectionIndex]?.[itemIndex] || false;

              return (
                <div
                  key={item}
                  className={`sop-item ${itemChecked ? "checked" : ""}`}
                  onClick={() => toggleItem(sectionIndex, itemIndex)}
                >
                  <div
                    className={`sop-checkbox ${
                      itemChecked ? "checked" : ""
                    }`}
                  >
                    {itemChecked && <CheckCircle2 size={13} color="#fff" />}
                  </div>

                  <span className="sop-text">{item}</span>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================
//  MESSAGES PAGE
// ============================================================

export function Messages() {
  const messageTemplates = [
    {
      title: "Booking Confirmation",
      category: "Pre-arrival",
      body: `Hi {{guest_name}}, thanks for booking {{property_name}}.

Your stay is confirmed for {{checkin_date}} to {{checkout_date}}.

We’re looking forward to hosting you. I’ll send your check-in details closer to your arrival date.`,
    },
    {
      title: "Check-in Instructions",
      category: "Check-in",
      body: `Hi {{guest_name}}, here are your check-in details for {{property_name}}.

Address: {{property_address}}
Check-in time: {{checkin_time}}
Wi-Fi: {{wifi_name}}
Password: {{wifi_password}}

Please let me know once you arrive safely.`,
    },
    {
      title: "Checkout Reminder",
      category: "Checkout",
      body: `Hi {{guest_name}}, just a quick reminder that checkout is tomorrow at {{checkout_time}}.

Before leaving, please check for personal items, turn off AC/lights, and secure the property.

Thanks again for staying with us.`,
    },
    {
      title: "Review Request",
      category: "Post-stay",
      body: `Hi {{guest_name}}, thank you again for staying at {{property_name}}.

If you enjoyed your stay, we’d appreciate a quick review. It helps future guests book with confidence.

Safe travels.`,
    },
    {
      title: "Maintenance Follow-up",
      category: "Issue handling",
      body: `Hi {{guest_name}}, thanks for letting us know about the issue.

We’ve logged it and are working on getting it resolved as quickly as possible. I’ll keep you updated once I have confirmation from the team.`,
    },
  ];

  const [openIndex, setOpenIndex] = useState(0);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard?.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  return (
    <div className="page">
      <PageHeader
        title="Messages"
        subtitle="Reusable guest message templates for bookings, check-ins, checkouts, reviews, and issue handling."
        helper="Copy these templates into WhatsApp, Airbnb, Instagram, or your booking platform."
      />

      {messageTemplates.map((template, index) => {
        const isOpen = openIndex === index;
        const isCopied = copiedIndex === index;

        return (
          <div className="msg-card" key={template.title}>
            <div
              className="msg-card-header"
              onClick={() => setOpenIndex(isOpen ? null : index)}
            >
              <div className="msg-card-meta">
                <div className="msg-num">{index + 1}</div>

                <div>
                  <div className="msg-title">{template.title}</div>
                  <div className="msg-cat">{template.category}</div>
                </div>
              </div>

              <div className="msg-actions">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleCopy(template.body, index);
                  }}
                >
                  {isCopied ? (
                    <>
                      <CheckCircle2 size={13} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={13} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {isOpen && (
              <div className="msg-body-wrap">
                <textarea
                  className="msg-textarea"
                  value={template.body}
                  readOnly
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
