// ============================================================
//  SUPPLIES, REVENUE, AND DIRECT LEADS PAGES
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
  fmtCurrency,
  fmtDateShort,
  downloadCSV,
  supplyStatus,
  supplyChip,
  bookingTotal,
  fmtPct,
  isDirectPlatform,
  inSelectedMonth,
  leadStatusChip,
} from "../utils/helpers.js";
import { EXPENSE_CATEGORIES } from "../data/sampleData.js";
import {
  Plus,
  Download,
  ChevronRight,
  Trash2,
  AlertCircle,
  Package,
  ReceiptText,
  MessageSquare,
} from "lucide-react";

const SUPPLY_CATEGORIES = [
  "Bathroom",
  "Kitchen",
  "Cleaning",
  "Linen",
  "Guest Amenity",
  "Maintenance",
];

const UNITS = ["rolls", "bottles", "packs", "pieces", "sets", "bags", "kg", "L"];

const LEAD_SOURCES = [
  "Instagram",
  "WhatsApp",
  "Google",
  "Past Guest",
  "Referral",
  "Website",
  "Phone Call",
  "Other",
];

const LEAD_STATUSES = [
  "New",
  "Interested",
  "Quote Sent",
  "Follow Up",
  "Booked",
  "Lost",
  "No Response",
];

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
//  SUPPLIES PAGE
// ============================================================

function SupplyForm({ record, onClose, onSave, onDelete, properties, currency }) {
  const [s, setS] = useState({ ...record });
  const [errors, setErrors] = useState([]);

  const set = (key, value) => {
    setS((previous) => ({ ...previous, [key]: value }));
    setErrors([]);
  };

  const validate = () => {
    const nextErrors = [];

    if (!String(s.item_name || "").trim()) {
      nextErrors.push("Item name is required.");
    }

    if (toNumber(s.current_quantity) < 0) {
      nextErrors.push("Current quantity cannot be negative.");
    }

    if (toNumber(s.reorder_level) < 0) {
      nextErrors.push("Reorder level cannot be negative.");
    }

    if (toNumber(s.unit_cost) < 0) {
      nextErrors.push("Unit cost cannot be negative.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      ...s,
      item_name: String(s.item_name || "").trim(),
      supplier: String(s.supplier || "").trim(),
      current_quantity: toNumber(s.current_quantity),
      reorder_level: toNumber(s.reorder_level),
      unit_cost: toNumber(s.unit_cost),
      notes: String(s.notes || "").trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={record.supply_id ? "Edit Supply" : "Add Supply Item"}
      wide
      footer={
        <>
          {record.supply_id && (
            <button
              className="btn-danger"
              onClick={() => onDelete(record.supply_id)}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
          <div className="modal-footer-spacer" />
          <ConfirmBar
            onCancel={onClose}
            onSave={handleSave}
            saveLabel={record.supply_id ? "Save Changes" : "Create Item"}
          />
        </>
      }
    >
      <ValidationMessage errors={errors} />

      <div className="form-grid-2">
        <Field label="Item Name">
          <input
            value={s.item_name || ""}
            onChange={(event) => set("item_name", event.target.value)}
            placeholder="e.g. Tissue, Bath Towels, Detergent"
          />
        </Field>

        <Field label="Category">
          <select
            value={s.category || "Bathroom"}
            onChange={(event) => set("category", event.target.value)}
          >
            {SUPPLY_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field
        label="Property"
        helper="Leave blank if this item is shared across all properties."
      >
        <select
          value={s.property_id || ""}
          onChange={(event) => set("property_id", event.target.value)}
        >
          <option value="">All Properties (shared)</option>
          {properties.map((property) => (
            <option key={property.property_id} value={property.property_id}>
              {property.property_name}
            </option>
          ))}
        </select>
      </Field>

      <div className="form-grid-2">
        <Field label="Current Quantity">
          <input
            type="number"
            min="0"
            value={s.current_quantity ?? 0}
            onChange={(event) => set("current_quantity", event.target.value)}
          />
        </Field>

        <Field
          label="Reorder Level"
          helper="Low-stock alert triggers at or below this level."
        >
          <input
            type="number"
            min="0"
            value={s.reorder_level ?? 0}
            onChange={(event) => set("reorder_level", event.target.value)}
          />
        </Field>

        <Field label="Unit">
          <select
            value={s.unit || "pieces"}
            onChange={(event) => set("unit", event.target.value)}
          >
            {UNITS.map((unit) => (
              <option key={unit}>{unit}</option>
            ))}
          </select>
        </Field>

        <Field label={`Unit Cost (${currency})`}>
          <input
            type="number"
            min="0"
            value={s.unit_cost ?? 0}
            onChange={(event) => set("unit_cost", event.target.value)}
          />
        </Field>

        <Field label="Supplier">
          <input
            value={s.supplier || ""}
            onChange={(event) => set("supplier", event.target.value)}
            placeholder="MegaMart, PriceSmart, Hi-Lo..."
          />
        </Field>

        <Field label="Last Restocked">
          <input
            type="date"
            value={s.last_restocked_date || ""}
            onChange={(event) => set("last_restocked_date", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={s.notes || ""}
          onChange={(event) => set("notes", event.target.value)}
          rows={2}
          placeholder="Supplier notes, restock notes, quality notes..."
        />
      </Field>
    </Modal>
  );
}

export function Supplies({ propFilter }) {
  const {
    supplies: rawSupplies,
    setSupplies,
    properties: rawProperties,
    settings: rawSettings,
  } = useApp();

  const supplies = safeArray(rawSupplies);
  const properties = safeArray(rawProperties);
  const settings = safeSettings(rawSettings);

  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const cur = settings.default_currency || "JMD";
  const selectedPropFilter = propFilter || "ALL";

  const filtered = (selectedPropFilter === "ALL"
    ? supplies
    : supplies.filter(
        (supply) =>
          supply.property_id === selectedPropFilter || !supply.property_id
      )
  )
    .map((supply) => ({
      ...supply,
      _status: supplyStatus(supply.current_quantity, supply.reorder_level),
    }))
    .filter((supply) => statusFilter === "ALL" || supply._status === statusFilter)
    .sort((a, b) => {
      const order = { "Out of Stock": 0, "Low Stock": 1, "In Stock": 2 };
      return (order[a._status] ?? 3) - (order[b._status] ?? 3);
    });

  const empty = {
    supply_id: "",
    property_id: "",
    item_name: "",
    category: "Bathroom",
    current_quantity: 0,
    unit: "pieces",
    reorder_level: 0,
    unit_cost: 0,
    supplier: "",
    last_restocked_date: todayISO(),
    notes: "",
  };

  const save = (supply) => {
    if (!supply.supply_id) {
      setSupplies([...supplies, { ...supply, supply_id: uid("SUP") }]);
    } else {
      setSupplies(
        supplies.map((existingSupply) =>
          existingSupply.supply_id === supply.supply_id ? supply : existingSupply
        )
      );
    }

    setEditing(null);
  };

  const del = (id) => {
    const confirmed = window.confirm(
      "Delete this supply item? This cannot be undone."
    );

    if (!confirmed) return;

    setSupplies(supplies.filter((supply) => supply.supply_id !== id));
    setEditing(null);
  };

  const getProp = (id) =>
    properties.find((property) => property.property_id === id);

  const hasSupplies = supplies.length > 0;
  const lowStockCount = supplies.filter(
    (supply) =>
      supplyStatus(supply.current_quantity, supply.reorder_level) === "Low Stock"
  ).length;
  const outOfStockCount = supplies.filter(
    (supply) =>
      supplyStatus(supply.current_quantity, supply.reorder_level) ===
      "Out of Stock"
  ).length;

  return (
    <div className="page">
      <PageHeader
        title="Supplies Inventory"
        subtitle="Track every consumable and linen item so the property never runs out of essentials."
        helper="Set a reorder level for each item. When current quantity drops to or below it, you'll see a low-stock alert on the dashboard."
        actions={
          <>
            <button
              className="btn-secondary"
              onClick={() => downloadCSV("supplies.csv", filtered)}
              disabled={filtered.length === 0}
              title={
                filtered.length === 0
                  ? "Add supplies before exporting"
                  : "Export current supplies"
              }
            >
              <Download size={14} />
              Export
            </button>

            <button className="btn-primary" onClick={() => setEditing(empty)}>
              <Plus size={14} />
              Add Item
            </button>
          </>
        }
      />

      {!hasSupplies && (
        <EmptyActionState
          icon={Package}
          title="No supplies yet"
          body="Add your first inventory item so the app can track essentials like tissue, soap, towels, sheets, garbage bags, coffee, cleaning products, and low-stock alerts."
          buttonLabel="Add First Supply"
          onClick={() => setEditing(empty)}
        />
      )}

      {hasSupplies && (
        <>
          <div className="metric-grid" style={{ marginBottom: 18 }}>
            <div className="metric-card sand">
              <div className="metric-label">Tracked Items</div>
              <div className="metric-value">{supplies.length}</div>
              <div className="metric-sub">Total inventory records</div>
            </div>

            <div className="metric-card amber">
              <div className="metric-label">Low Stock</div>
              <div className="metric-value">{lowStockCount}</div>
              <div className="metric-sub">Needs restock soon</div>
            </div>

            <div className="metric-card red">
              <div className="metric-label">Out of Stock</div>
              <div className="metric-value">{outOfStockCount}</div>
              <div className="metric-sub">Urgent restock required</div>
            </div>

            <div className="metric-card teal">
              <div className="metric-label">Visible Items</div>
              <div className="metric-value">{filtered.length}</div>
              <div className="metric-sub">Based on current filters</div>
            </div>
          </div>

          <div className="status-filters">
            {["ALL", "Out of Stock", "Low Stock", "In Stock"].map((status) => (
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
        </>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Item</th>
                <th>Property</th>
                <th>Category</th>
                <th className="td-right">Current</th>
                <th className="td-right">Reorder At</th>
                <th>Unit</th>
                <th className="td-right">Unit Cost</th>
                <th>Last Restocked</th>
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
                    {hasSupplies
                      ? "No supplies match the current filter."
                      : "No supplies tracked yet. Add tissue, soap, towels, sheets, garbage bags, cleaning products, and more."}
                  </td>
                </tr>
              ) : (
                filtered.map((supply) => (
                  <tr
                    key={supply.supply_id}
                    className="tr-clickable"
                    onClick={() => setEditing(supply)}
                  >
                    <td className="fw-bold">
                      {supply.item_name || "Unnamed item"}
                    </td>
                    <td>
                      {getProp(supply.property_id)?.property_name ||
                        "All Properties"}
                    </td>
                    <td>{supply.category || "—"}</td>
                    <td className="td-right num fw-bold">
                      {supply.current_quantity}
                    </td>
                    <td className="td-right num" style={{ color: "var(--muted)" }}>
                      {supply.reorder_level}
                    </td>
                    <td>{supply.unit || "—"}</td>
                    <td className="td-right num">
                      {fmtCurrency(supply.unit_cost, cur)}
                    </td>
                    <td className="num">
                      {fmtDateShort(supply.last_restocked_date)}
                    </td>
                    <td>
                      <Chip tone={supplyChip(supply._status)}>
                        {supply._status}
                      </Chip>
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
        <SupplyForm
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

// ============================================================
//  REVENUE & PROFIT PAGE
// ============================================================

function ExpenseForm({ record, onClose, onSave, onDelete, properties, currency }) {
  const [e, setE] = useState({ ...record });
  const [errors, setErrors] = useState([]);

  const set = (key, value) => {
    setE((previous) => ({ ...previous, [key]: value }));
    setErrors([]);
  };

  const validate = () => {
    const nextErrors = [];

    if (!e.expense_date) {
      nextErrors.push("Expense date is required.");
    }

    if (!e.category) {
      nextErrors.push("Category is required.");
    }

    if (toNumber(e.amount) <= 0) {
      nextErrors.push("Amount must be greater than zero.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      ...e,
      vendor: String(e.vendor || "").trim(),
      description: String(e.description || "").trim(),
      amount: toNumber(e.amount),
      receipt_link: String(e.receipt_link || "").trim(),
      notes: String(e.notes || "").trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={record.expense_id ? "Edit Expense" : "Add Expense"}
      wide
      footer={
        <>
          {record.expense_id && (
            <button
              className="btn-danger"
              onClick={() => onDelete(record.expense_id)}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
          <div className="modal-footer-spacer" />
          <ConfirmBar
            onCancel={onClose}
            onSave={handleSave}
            saveLabel={record.expense_id ? "Save Changes" : "Create Expense"}
          />
        </>
      }
    >
      <ValidationMessage errors={errors} />

      <div className="form-grid-2">
        <Field label="Property">
          <select
            value={e.property_id || ""}
            onChange={(event) => set("property_id", event.target.value)}
          >
            <option value="">All / Shared</option>
            {properties.map((property) => (
              <option key={property.property_id} value={property.property_id}>
                {property.property_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Date">
          <input
            type="date"
            value={e.expense_date || ""}
            onChange={(event) => set("expense_date", event.target.value)}
          />
        </Field>

        <Field label="Category">
          <select
            value={e.category || "Cleaning"}
            onChange={(event) => set("category", event.target.value)}
          >
            {EXPENSE_CATEGORIES.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </Field>

        <Field label={`Amount (${currency})`}>
          <input
            type="number"
            min="0"
            value={e.amount ?? 0}
            onChange={(event) => set("amount", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Description / Vendor">
        <input
          value={e.description || ""}
          onChange={(event) => set("description", event.target.value)}
          placeholder="e.g. Monthly electricity bill — JPS"
        />
      </Field>

      <div className="form-grid-2">
        <Field label="Paid By">
          <select
            value={e.paid_by || "Manager"}
            onChange={(event) => set("paid_by", event.target.value)}
          >
            {["Manager", "Owner", "Co-host", "Cleaner"].map((value) => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </Field>

        <Field label="Receipt Link">
          <input
            value={e.receipt_link || ""}
            onChange={(event) => set("receipt_link", event.target.value)}
            placeholder="Google Drive link..."
          />
        </Field>
      </div>

      <Field label="Notes">
        <textarea
          value={e.notes || ""}
          onChange={(event) => set("notes", event.target.value)}
          rows={2}
          placeholder="Expense notes, reimbursement notes, payment notes..."
        />
      </Field>
    </Modal>
  );
}

export function Revenue({ monthFilter, propFilter }) {
  const {
    expenses: rawExpenses,
    setExpenses,
    bookings: rawBookings,
    properties: rawProperties,
    settings: rawSettings,
  } = useApp();

  const expenses = safeArray(rawExpenses);
  const bookings = safeArray(rawBookings);
  const properties = safeArray(rawProperties);
  const settings = safeSettings(rawSettings);

  const [editing, setEditing] = useState(null);

  const cur = settings.default_currency || "JMD";
  const selectedMonth = monthFilter || new Date().toISOString().slice(0, 7);
  const selectedPropFilter = propFilter || "ALL";

  const filterExp =
    selectedPropFilter === "ALL"
      ? expenses
      : expenses.filter(
          (expense) =>
            expense.property_id === selectedPropFilter || !expense.property_id
        );

  const filterBk =
    selectedPropFilter === "ALL"
      ? bookings
      : bookings.filter((booking) => booking.property_id === selectedPropFilter);

  const monthExpenses = filterExp
    .filter((expense) => inSelectedMonth(expense.expense_date, selectedMonth))
    .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date));

  const monthBookings = filterBk.filter(
    (booking) =>
      booking.booking_status !== "Cancelled" &&
      (inSelectedMonth(booking.checkin_date, selectedMonth) ||
        inSelectedMonth(booking.checkout_date, selectedMonth))
  );

  const grossRevenue = monthBookings.reduce(
    (sum, booking) => sum + bookingTotal(booking),
    0
  );

  const directRevenue = monthBookings
    .filter((booking) => isDirectPlatform(booking.platform))
    .reduce((sum, booking) => sum + bookingTotal(booking), 0);

  const totalExpenses = monthExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0
  );

  const platformFees = grossRevenue * Number(settings.platform_fee_percentage || 0);
  const managementFee =
    grossRevenue * Number(settings.management_fee_percentage || 0);
  const taxReserve = grossRevenue * Number(settings.tax_reserve_percentage || 0);
  const netProfit =
    grossRevenue - platformFees - totalExpenses - managementFee - taxReserve;

  const byCategory = {};
  monthExpenses.forEach((expense) => {
    byCategory[expense.category] =
      (byCategory[expense.category] || 0) + Number(expense.amount || 0);
  });

  const catEntries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const maxCat = Math.max(...catEntries.map(([, value]) => value), 1);

  const empty = {
    expense_id: "",
    property_id: "",
    expense_date: todayISO(),
    category: "Cleaning",
    vendor: "",
    description: "",
    amount: 0,
    reimbursable: false,
    paid_by: "Manager",
    receipt_link: "",
    notes: "",
  };

  const save = (expense) => {
    if (!expense.expense_id) {
      setExpenses([...expenses, { ...expense, expense_id: uid("EXP") }]);
    } else {
      setExpenses(
        expenses.map((existingExpense) =>
          existingExpense.expense_id === expense.expense_id
            ? expense
            : existingExpense
        )
      );
    }

    setEditing(null);
  };

  const del = (id) => {
    const confirmed = window.confirm(
      "Delete this expense? This cannot be undone."
    );

    if (!confirmed) return;

    setExpenses(expenses.filter((expense) => expense.expense_id !== id));
    setEditing(null);
  };

  const getProp = (id) =>
    properties.find((property) => property.property_id === id);

  const hasExpenses = expenses.length > 0;

  return (
    <div className="page">
      <PageHeader
        title="Revenue & Profit Tracker"
        subtitle={`Real money in, real money out — ${selectedMonth}`}
        helper="Revenue alone is not profit. Log every expense here so you can see exactly what you keep after cleaning, utilities, repairs, supplies, and fees."
        actions={
          <>
            <button
              className="btn-secondary"
              onClick={() => downloadCSV("expenses.csv", monthExpenses)}
              disabled={monthExpenses.length === 0}
              title={
                monthExpenses.length === 0
                  ? "Add expenses before exporting"
                  : "Export current month expenses"
              }
            >
              <Download size={14} />
              Export
            </button>

            <button className="btn-primary" onClick={() => setEditing(empty)}>
              <Plus size={14} />
              Add Expense
            </button>
          </>
        }
      />

      {!hasExpenses && (
        <EmptyActionState
          icon={ReceiptText}
          title="No expenses yet"
          body="Add your first expense so the app can calculate true net profit instead of only gross booking revenue. Track cleaning, JPS, NWC, internet, repairs, supplies, vendor payments, and shared costs."
          buttonLabel="Add First Expense"
          onClick={() => setEditing(empty)}
        />
      )}

      <div className="metric-grid" style={{ marginBottom: 22 }}>
        <div className="metric-card navy">
          <div className="metric-label">Gross Revenue</div>
          <div className="metric-value num">{fmtCurrency(grossRevenue, cur)}</div>
          <div className="metric-sub">{monthBookings.length} bookings</div>
        </div>

        <div className="metric-card sand">
          <div className="metric-label">Total Expenses</div>
          <div className="metric-value num">{fmtCurrency(totalExpenses, cur)}</div>
          <div className="metric-sub">{monthExpenses.length} entries</div>
        </div>

        <div className="metric-card sand">
          <div className="metric-label">Direct Revenue</div>
          <div className="metric-value num">{fmtCurrency(directRevenue, cur)}</div>
          <div className="metric-sub">Direct, WhatsApp, IG, referral</div>
        </div>

        <div className={`metric-card ${netProfit >= 0 ? "teal" : "red"}`}>
          <div className="metric-label">Net Profit</div>
          <div className="metric-value num">{fmtCurrency(netProfit, cur)}</div>
          <div className="metric-sub">After fees, expenses, and reserves</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 22, alignItems: "start" }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 className="section-title">Expenses This Month</h3>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Property</th>
                  <th className="td-right">Amount</th>
                  <th></th>
                </tr>
              </thead>

              <tbody>
                {monthExpenses.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        padding: 36,
                        textAlign: "center",
                        color: "var(--muted)",
                        lineHeight: 1.6,
                      }}
                    >
                      {hasExpenses
                        ? "No expenses logged for the selected month or property filter."
                        : "No expenses logged yet. Add cleaning, utilities, repairs, supplies, and vendor payments here."}
                    </td>
                  </tr>
                ) : (
                  monthExpenses.map((expense) => (
                    <tr
                      key={expense.expense_id}
                      className="tr-clickable"
                      onClick={() => setEditing(expense)}
                    >
                      <td className="num">
                        {fmtDateShort(expense.expense_date)}
                      </td>
                      <td>
                        <Chip tone="gray">{expense.category}</Chip>
                      </td>
                      <td>{expense.description || expense.vendor || "—"}</td>
                      <td>
                        {getProp(expense.property_id)?.property_name || "Shared"}
                      </td>
                      <td className="td-right num fw-bold">
                        {fmtCurrency(expense.amount, cur)}
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

        <div
          className="card-sand"
          style={{ padding: 18, borderRadius: "var(--radius)" }}
        >
          <h3 className="section-title">Expenses by Category</h3>

          {catEntries.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              No expenses to show for this month.
            </p>
          ) : (
            catEntries.map(([category, value]) => (
              <div key={category} className="exp-bar-row">
                <div className="exp-bar-labels">
                  <span>{category}</span>
                  <span className="num fw-bold">
                    {fmtCurrency(value, cur)}
                  </span>
                </div>
                <div className="exp-bar-track">
                  <div
                    className="exp-bar-fill"
                    style={{ width: `${(value / maxCat) * 100}%` }}
                  />
                </div>
              </div>
            ))
          )}

          <div className="spacer" />

          <h3 className="section-title">Fees + Reserves</h3>
          <div className="profit-table">
            <div className="profit-row">
              <span className="profit-label">
                Platform Fees ({fmtPct(settings.platform_fee_percentage || 0)})
              </span>
              <span className="profit-value">
                {fmtCurrency(platformFees, cur)}
              </span>
            </div>
            <div className="profit-row">
              <span className="profit-label">
                Management Fee ({fmtPct(settings.management_fee_percentage || 0)})
              </span>
              <span className="profit-value">
                {fmtCurrency(managementFee, cur)}
              </span>
            </div>
            <div className="profit-row">
              <span className="profit-label">
                Tax Reserve ({fmtPct(settings.tax_reserve_percentage || 0)})
              </span>
              <span className="profit-value">
                {fmtCurrency(taxReserve, cur)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <ExpenseForm
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

// ============================================================
//  DIRECT LEADS PAGE
// ============================================================

function LeadForm({ record, onClose, onSave, onDelete, properties, currency }) {
  const [l, setL] = useState({ ...record });
  const [errors, setErrors] = useState([]);

  const set = (key, value) => {
    setL((previous) => ({ ...previous, [key]: value }));
    setErrors([]);
  };

  const validate = () => {
    const nextErrors = [];

    if (!String(l.lead_name || "").trim()) {
      nextErrors.push("Lead name is required.");
    }

    if (!isValidEmail(l.email)) {
      nextErrors.push("Enter a valid email address or leave the field blank.");
    }

    if (toNumber(l.number_of_guests) < 1) {
      nextErrors.push("Number of guests must be at least 1.");
    }

    if (toNumber(l.budget) < 0) {
      nextErrors.push("Budget cannot be negative.");
    }

    setErrors(nextErrors);
    return nextErrors.length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    onSave({
      ...l,
      lead_name: String(l.lead_name || "").trim(),
      phone: String(l.phone || "").trim(),
      email: String(l.email || "").trim(),
      dates_requested: String(l.dates_requested || "").trim(),
      number_of_guests: Math.max(1, toNumber(l.number_of_guests)),
      budget: toNumber(l.budget),
      message_template_used: String(l.message_template_used || "").trim(),
      notes: String(l.notes || "").trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={record.lead_id ? "Edit Lead" : "Add Direct Booking Lead"}
      wide
      footer={
        <>
          {record.lead_id && (
            <button
              className="btn-danger"
              onClick={() => onDelete(record.lead_id)}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
          <div className="modal-footer-spacer" />
          <ConfirmBar
            onCancel={onClose}
            onSave={handleSave}
            saveLabel={record.lead_id ? "Save Changes" : "Create Lead"}
          />
        </>
      }
    >
      <ValidationMessage errors={errors} />

      <div className="form-grid-2">
        <Field label="Lead Name">
          <input
            value={l.lead_name || ""}
            onChange={(event) => set("lead_name", event.target.value)}
            placeholder="e.g. Samantha Reid"
          />
        </Field>

        <Field label="Source">
          <select
            value={l.source || "Instagram"}
            onChange={(event) => set("source", event.target.value)}
          >
            {LEAD_SOURCES.map((source) => (
              <option key={source}>{source}</option>
            ))}
          </select>
        </Field>

        <Field label="Phone / WhatsApp">
          <input
            value={l.phone || ""}
            onChange={(event) => set("phone", event.target.value)}
            placeholder="+1 876 000 0000"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={l.email || ""}
            onChange={(event) => set("email", event.target.value)}
            placeholder="lead@email.com"
          />
        </Field>

        <Field label="Property Interested">
          <select
            value={l.property_interested || ""}
            onChange={(event) => set("property_interested", event.target.value)}
          >
            <option value="">— Any Property —</option>
            {properties.map((property) => (
              <option key={property.property_id} value={property.property_id}>
                {property.property_name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Dates Requested">
          <input
            value={l.dates_requested || ""}
            onChange={(event) => set("dates_requested", event.target.value)}
            placeholder="e.g. July 10–14"
          />
        </Field>

        <Field label="Number of Guests">
          <input
            type="number"
            min="1"
            value={l.number_of_guests ?? 1}
            onChange={(event) => set("number_of_guests", event.target.value)}
          />
        </Field>

        <Field label={`Budget (${currency})`}>
          <input
            type="number"
            min="0"
            value={l.budget ?? 0}
            onChange={(event) => set("budget", event.target.value)}
          />
        </Field>

        <Field label="Status">
          <select
            value={l.status || "New"}
            onChange={(event) => set("status", event.target.value)}
          >
            {LEAD_STATUSES.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </Field>

        <Field label="Follow-up Date">
          <input
            type="date"
            value={l.followup_date || ""}
            onChange={(event) => set("followup_date", event.target.value)}
          />
        </Field>
      </div>

      <label className="toggle-row">
        <input
          type="checkbox"
          checked={!!l.quote_sent}
          onChange={(event) => set("quote_sent", event.target.checked)}
        />
        Quote sent to this lead
      </label>

      <Field label="Message Template Used">
        <input
          value={l.message_template_used || ""}
          onChange={(event) => set("message_template_used", event.target.value)}
          placeholder="e.g. Direct Booking Inquiry Reply"
        />
      </Field>

      <Field label="Notes">
        <textarea
          value={l.notes || ""}
          onChange={(event) => set("notes", event.target.value)}
          rows={3}
          placeholder="Lead notes, objection, follow-up plan, quoted rate..."
        />
      </Field>
    </Modal>
  );
}

export function Leads({ propFilter }) {
  const {
    leads: rawLeads,
    setLeads,
    properties: rawProperties,
    settings: rawSettings,
  } = useApp();

  const leads = safeArray(rawLeads);
  const properties = safeArray(rawProperties);
  const settings = safeSettings(rawSettings);

  const [editing, setEditing] = useState(null);
  const [statusFilter, setStatusFilter] = useState("ALL");

  const cur = settings.default_currency || "JMD";
  const selectedPropFilter = propFilter || "ALL";

  const filtered = (selectedPropFilter === "ALL"
    ? leads
    : leads.filter(
        (lead) =>
          lead.property_interested === selectedPropFilter ||
          !lead.property_interested
      )
  ).filter((lead) => statusFilter === "ALL" || lead.status === statusFilter);

  const empty = {
    lead_id: "",
    lead_name: "",
    source: "Instagram",
    phone: "",
    email: "",
    property_interested: "",
    dates_requested: "",
    number_of_guests: 1,
    budget: 0,
    quote_sent: false,
    followup_date: todayISO(),
    status: "New",
    message_template_used: "",
    notes: "",
  };

  const save = (lead) => {
    if (!lead.lead_id) {
      setLeads([...leads, { ...lead, lead_id: uid("LEAD") }]);
    } else {
      setLeads(
        leads.map((existingLead) =>
          existingLead.lead_id === lead.lead_id ? lead : existingLead
        )
      );
    }

    setEditing(null);
  };

  const del = (id) => {
    const confirmed = window.confirm(
      "Delete this lead? This cannot be undone."
    );

    if (!confirmed) return;

    setLeads(leads.filter((lead) => lead.lead_id !== id));
    setEditing(null);
  };

  const getProp = (id) =>
    properties.find((property) => property.property_id === id);

  const hasLeads = leads.length > 0;
  const quoteSentCount = leads.filter((lead) => lead.quote_sent).length;
  const bookedCount = leads.filter((lead) => lead.status === "Booked").length;
  const followUpCount = leads.filter((lead) =>
    ["Follow Up", "Quote Sent", "Interested", "New"].includes(lead.status)
  ).length;

  return (
    <div className="page">
      <PageHeader
        title="Direct Booking Leads"
        subtitle="Track every enquiry from Instagram, WhatsApp, Google, past guests, and referrals."
        helper="Not every guest has to come from Airbnb. Track direct leads here, follow up, and convert more enquiries into bookings — with no platform fees."
        actions={
          <>
            <button
              className="btn-secondary"
              onClick={() => downloadCSV("leads.csv", filtered)}
              disabled={filtered.length === 0}
              title={
                filtered.length === 0
                  ? "Add leads before exporting"
                  : "Export current leads"
              }
            >
              <Download size={14} />
              Export
            </button>

            <button className="btn-primary" onClick={() => setEditing(empty)}>
              <Plus size={14} />
              Add Lead
            </button>
          </>
        }
      />

      {!hasLeads && (
        <EmptyActionState
          icon={MessageSquare}
          title="No direct booking leads yet"
          body="Add enquiries from WhatsApp, Instagram, Google, phone calls, past guests, and referrals. This turns random messages into a follow-up pipeline that can convert into direct bookings."
          buttonLabel="Add First Lead"
          onClick={() => setEditing(empty)}
        />
      )}

      {hasLeads && (
        <>
          <div className="metric-grid" style={{ marginBottom: 18 }}>
            <div className="metric-card sand">
              <div className="metric-label">Total Leads</div>
              <div className="metric-value">{leads.length}</div>
              <div className="metric-sub">All lead records</div>
            </div>

            <div className="metric-card teal">
              <div className="metric-label">Quotes Sent</div>
              <div className="metric-value">{quoteSentCount}</div>
              <div className="metric-sub">Leads that received pricing</div>
            </div>

            <div className="metric-card amber">
              <div className="metric-label">Follow-up Needed</div>
              <div className="metric-value">{followUpCount}</div>
              <div className="metric-sub">Active leads to work</div>
            </div>

            <div className="metric-card green">
              <div className="metric-label">Booked</div>
              <div className="metric-value">{bookedCount}</div>
              <div className="metric-sub">Converted direct leads</div>
            </div>
          </div>

          <div className="status-filters">
            {["ALL", ...LEAD_STATUSES].map((status) => (
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
        </>
      )}

      <div className="card" style={{ overflow: "hidden" }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lead</th>
                <th>Source</th>
                <th>Contact</th>
                <th>Property</th>
                <th>Dates</th>
                <th>Guests</th>
                <th className="td-right">Budget</th>
                <th>Quote</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th></th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    style={{
                      padding: 36,
                      textAlign: "center",
                      color: "var(--muted)",
                      lineHeight: 1.6,
                    }}
                  >
                    {hasLeads
                      ? "No leads match the current filter."
                      : "No direct leads yet. Add leads from WhatsApp, Instagram, referrals, Google, phone calls, or past guests."}
                  </td>
                </tr>
              ) : (
                filtered.map((lead) => (
                  <tr
                    key={lead.lead_id}
                    className="tr-clickable"
                    onClick={() => setEditing(lead)}
                  >
                    <td>
                      <div className="fw-bold">
                        {lead.lead_name || "Unnamed lead"}
                      </div>
                      <div className="td-muted">{lead.lead_id}</div>
                    </td>
                    <td>
                      <Chip tone="teal">{lead.source}</Chip>
                    </td>
                    <td>{lead.phone || lead.email || "—"}</td>
                    <td>
                      {getProp(lead.property_interested)?.property_name || "—"}
                    </td>
                    <td>{lead.dates_requested || "—"}</td>
                    <td className="num">{lead.number_of_guests || "—"}</td>
                    <td className="td-right num">
                      {lead.budget ? fmtCurrency(lead.budget, cur) : "—"}
                    </td>
                    <td>
                      {lead.quote_sent ? (
                        <Chip tone="green">Sent</Chip>
                      ) : (
                        <Chip tone="gray">No</Chip>
                      )}
                    </td>
                    <td>
                      <Chip tone={leadStatusChip(lead.status)}>
                        {lead.status}
                      </Chip>
                    </td>
                    <td className="num">{fmtDateShort(lead.followup_date)}</td>
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
        <LeadForm
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