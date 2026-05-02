import { useMemo, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { MetricCard, Chip, PageHeader } from "../components/index.jsx";
import {
  bookingTotal,
  calcNights,
  fmtCurrency,
  fmtPct,
  fmtDateShort,
  isDirectPlatform,
  supplyStatus,
  inSelectedMonth,
  daysInMonth,
  bookingStatusChip,
  paymentStatusChip,
  cleaningStatusChip,
  supplyChip,
} from "../utils/helpers.js";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Star,
  Bell,
  Package,
  Wrench,
  Sparkles,
  Home,
  Database,
  ArrowRight,
  CheckCircle2,
  PlusCircle,
  Users,
  ReceiptText,
  ClipboardList,
  Circle,
  Settings,
  Download,
} from "lucide-react";

const SETUP_PROGRESS_STORAGE_KEY = "jak_dashboard_setup_progress";
const SETUP_EXPANDED_STORAGE_KEY = "jak_dashboard_setup_expanded";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeSettings(value) {
  return value && typeof value === "object" ? value : {};
}

function loadSetupProgress() {
  try {
    const raw = localStorage.getItem(SETUP_PROGRESS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSetupProgress(nextProgress) {
  try {
    localStorage.setItem(SETUP_PROGRESS_STORAGE_KEY, JSON.stringify(nextProgress));
  } catch {
    // Keep dashboard usable if browser storage is blocked.
  }
}


function loadSetupExpandedPreference() {
  try {
    const raw = localStorage.getItem(SETUP_EXPANDED_STORAGE_KEY);

    if (raw === null) return false;

    return raw === "true";
  } catch {
    return false;
  }
}

function saveSetupExpandedPreference(isExpanded) {
  try {
    localStorage.setItem(SETUP_EXPANDED_STORAGE_KEY, String(Boolean(isExpanded)));
  } catch {
    // Keep dashboard usable if browser storage is blocked.
  }
}

function getSetupChecklist({
  properties,
  bookings,
  expenses,
  supplies,
  cleaning,
  maintenance,
  settings,
  savedProgress,
}) {
  const cleaners = safeArray(settings.cleaners);
  const vendors = safeArray(settings.vendors);

  const hasBusinessInfo = Boolean(
    String(settings.business_name || "").trim() ||
      String(settings.host_name || "").trim() ||
      String(settings.host_phone || "").trim() ||
      String(settings.host_email || "").trim()
  );

  const hasRatesReviewed =
    Number(settings.platform_fee_percentage || 0) > 0 ||
    Number(settings.management_fee_percentage || 0) > 0 ||
    Number(settings.tax_reserve_percentage || 0) > 0 ||
    savedProgress.reviewedFees === true;

  return [
    {
      id: "businessInfo",
      title: "Add business / host information",
      body: "Add your business name, host phone, email, and default currency.",
      completed: hasBusinessInfo || savedProgress.businessInfo === true,
      page: "settings",
      action: "Open Settings",
    },
    {
      id: "property",
      title: "Add your first property",
      body: "Create at least one property so bookings, cleaning, and reports have somewhere to connect.",
      completed: properties.length > 0,
      page: "settings",
      action: "Add Property",
    },
    {
      id: "team",
      title: "Add cleaner or vendor details",
      body: "Add at least one cleaner or vendor so operations can be assigned properly.",
      completed: cleaners.length > 0 || vendors.length > 0 || savedProgress.team === true,
      page: "settings",
      action: "Manage Team",
    },
    {
      id: "booking",
      title: "Add your first booking",
      body: "Bookings activate revenue, occupancy, check-in, checkout, and owner report calculations.",
      completed: bookings.length > 0,
      page: "bookings",
      action: "Add Booking",
    },
    {
      id: "expense",
      title: "Add your first expense",
      body: "Expenses allow the app to calculate actual profit instead of only gross revenue.",
      completed: expenses.length > 0,
      page: "revenue",
      action: "Add Expense",
    },
    {
      id: "supply",
      title: "Add your first supply item",
      body: "Supply tracking helps catch low-stock items before guests arrive.",
      completed: supplies.length > 0,
      page: "supplies",
      action: "Add Supply",
    },
    {
      id: "operations",
      title: "Add one operations record",
      body: "Add a cleaning task or maintenance issue to start tracking day-to-day work.",
      completed: cleaning.length > 0 || maintenance.length > 0 || savedProgress.operations === true,
      page: "cleaning",
      action: "Open Operations",
    },
    {
      id: "fees",
      title: "Review fees and tax reserve",
      body: "Confirm platform fee, management fee, and tax reserve percentages.",
      completed: hasRatesReviewed,
      page: "settings",
      action: "Review Fees",
      canManuallyComplete: true,
    },
    {
      id: "backup",
      title: "Export your first backup",
      body: "Download a backup file so customer data is protected before testing resets or imports.",
      completed:
        savedProgress.backupExported === true ||
        Boolean(localStorage.getItem("jak_backup_exported_at")),
      page: "settings",
      action: "Open Backup Tools",
      canManuallyComplete: true,
    },
  ];
}

function SetupProgressCard({
  checklist,
  onGoToPage,
  onMarkComplete,
  compact = false,
  expanded = true,
  onToggleExpanded,
}) {
  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const percent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div className="card" style={{ padding: compact ? 18 : 22, marginBottom: 22 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 14,
          flexWrap: "wrap",
          marginBottom: 14,
        }}
      >
        <div>
          <h3 className="section-title" style={{ marginBottom: 6 }}>Setup Checklist</h3>
          <p
            style={{
              color: "var(--muted)",
              fontSize: 13,
              lineHeight: 1.6,
              maxWidth: 720,
            }}
          >
            Complete these setup items to turn the dashboard into a live operating system for your property or hosting business.
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
          <button
            className="btn-ghost"
            style={{ fontSize: 12 }}
            onClick={() => onToggleExpanded?.()}
            type="button"
          >
            {expanded ? "Hide Checklist" : "Show Checklist"}
          </button>

          <Chip tone={percent === 100 ? "green" : "teal"}>
            {completedCount}/{totalCount} Complete
          </Chip>
        </div>
      </div>

      {percent === 100 && (
        <div
          className="setup-complete-banner"
          role="status"
          aria-live="polite"
        >
          🎉 Setup Complete! Your host workspace is fully configured.
        </div>
      )}

      <div
        style={{
          width: "100%",
          height: 10,
          borderRadius: 999,
          background: "var(--sand-soft)",
          border: "1px solid var(--line)",
          overflow: "hidden",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: "var(--teal)",
            transition: "width 180ms ease",
          }}
        />
      </div>

      {expanded && (
        <div style={{ display: "grid", gap: 10 }}>
        {checklist.map((item) => (
          <div
            key={item.id}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              gap: 12,
              alignItems: "center",
              padding: "12px 14px",
              border: "1px solid var(--line)",
              borderRadius: "var(--radius-sm)",
              background: item.completed ? "var(--teal-soft)" : "var(--sand-soft)",
            }}
          >
            {item.completed ? <CheckCircle2 size={18} color="var(--teal)" /> : <Circle size={18} color="var(--muted)" />}

            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 13.5,
                  color: "var(--navy)",
                  marginBottom: 2,
                }}
              >
                {item.title}
              </div>
              {!compact && (
                <div style={{ color: "var(--muted)", fontSize: 12.5, lineHeight: 1.45 }}>
                  {item.body}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!item.completed && item.canManuallyComplete && (
                <button className="btn-ghost" style={{ fontSize: 12 }} onClick={() => onMarkComplete(item.id)}>
                  Mark Done
                </button>
              )}

              <button
                className={item.completed ? "btn-ghost" : "btn-secondary"}
                style={{ fontSize: 12 }}
                onClick={() => onGoToPage(item.page)}
              >
                {item.action}
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        ))}
        </div>
      )}
    </div>
  );
}

function EmptyDashboardSetup({
  setPage,
  restoreSampleData,
  checklist,
  onMarkComplete,
  setupExpanded,
  onToggleSetupExpanded,
}) {
  const handleRestoreDemo = () => {
    const confirmed = window.confirm("This will restore the sample demo data. Continue?");

    if (!confirmed) return;

    if (typeof restoreSampleData === "function") {
      restoreSampleData();
    }
  };

  const setupSteps = [
    {
      title: "Add your first property",
      body: "Set up the property name, location, owner details, default rates, check-in time, Wi-Fi, and notes.",
      icon: Home,
      action: "Go to Settings",
      page: "settings",
    },
    {
      title: "Add your first booking",
      body: "Once a property exists, add a booking to start tracking revenue, guest stays, cleaning, and reports.",
      icon: Calendar,
      action: "Add Booking",
      page: "bookings",
    },
    {
      title: "Add your team and vendors",
      body: "Add cleaners, maintenance vendors, and service providers so your operations stay organized.",
      icon: Users,
      action: "Manage Team",
      page: "settings",
    },
    {
      title: "Track expenses and supplies",
      body: "Log JPS, NWC, internet, cleaning, repairs, inventory, and restocking costs.",
      icon: ReceiptText,
      action: "Open Revenue",
      page: "revenue",
    },
  ];

  return (
    <div className="page">
      <PageHeader
        title="Welcome to your Host Operations Kit"
        subtitle="Your workspace is blank and ready for real data. Start by adding your first property, then build your bookings, guests, expenses, supplies, cleaning schedule, and reports from there."
        actions={
          <>
            <button className="btn-secondary" onClick={handleRestoreDemo}>
              <Database size={14} />
              Restore Demo Data
            </button>
            <button className="btn-primary" onClick={() => setPage("settings")}>
              <PlusCircle size={14} />
              Add First Property
            </button>
          </>
        }
      />

      <div className="card-sand" style={{ padding: 22, marginBottom: 22 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h3 className="section-title" style={{ marginBottom: 6 }}>Start from scratch</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, maxWidth: 760 }}>
              This is the correct state for a new customer. No sample properties, bookings, guests, supplies,
              maintenance tasks, leads, owner reports, or tax reserve records are currently loaded.
            </p>
          </div>

          <Chip tone="teal">Live Blank Workspace</Chip>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 22 }}>
        {setupSteps.map((step) => {
          const Icon = step.icon;

          return (
            <div key={step.title} className="card" style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 14 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 14,
                    display: "grid",
                    placeItems: "center",
                    background: "var(--teal-soft)",
                    color: "var(--teal)",
                    border: "1px solid #9FD8CF",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={20} />
                </div>

                <div>
                  <h3 style={{ fontSize: 16, marginBottom: 5 }}>{step.title}</h3>
                  <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>{step.body}</p>
                </div>
              </div>

              <button className="btn-secondary" onClick={() => setPage(step.page)}>
                {step.action}
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>

      <SetupProgressCard
        checklist={checklist}
        onGoToPage={setPage}
        onMarkComplete={onMarkComplete}
        expanded={setupExpanded}
        onToggleExpanded={toggleSetupExpanded}
      />
    </div>
  );
}

function EmptyCard({ title, body, buttonLabel, onClick }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 className="section-title" style={{ marginBottom: 6 }}>{title}</h3>
      <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
        {body}
      </p>
      {buttonLabel && onClick && (
        <button className="btn-secondary" onClick={onClick}>
          {buttonLabel}
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
}

export default function Dashboard({ setPage, monthFilter, propFilter }) {
  const {
    bookings: rawBookings,
    expenses: rawExpenses,
    maintenance: rawMaintenance,
    supplies: rawSupplies,
    cleaning: rawCleaning,
    properties: rawProperties,
    settings: rawSettings,
    restoreSampleData,
  } = useApp();

  const bookings = safeArray(rawBookings);
  const expenses = safeArray(rawExpenses);
  const maintenance = safeArray(rawMaintenance);
  const supplies = safeArray(rawSupplies);
  const cleaning = safeArray(rawCleaning);
  const properties = safeArray(rawProperties);
  const settings = safeSettings(rawSettings);

  const [savedSetupProgress, setSavedSetupProgress] = useState(() => loadSetupProgress());
  const [setupExpanded, setSetupExpanded] = useState(() => loadSetupExpandedPreference());

  const cur = settings.default_currency || "JMD";

  const goToPage = (page) => {
    if (typeof setPage === "function") {
      setPage(page);
    }
  };

  const toggleSetupExpanded = () => {
    setSetupExpanded((previous) => {
      const next = !previous;
      saveSetupExpandedPreference(next);
      return next;
    });
  };

  const markSetupComplete = (id) => {
    setSavedSetupProgress((previous) => {
      const next = { ...previous, [id]: true };
      saveSetupProgress(next);
      return next;
    });
  };

  const setupChecklist = useMemo(
    () =>
      getSetupChecklist({
        properties,
        bookings,
        expenses,
        supplies,
        cleaning,
        maintenance,
        settings,
        savedProgress: savedSetupProgress,
      }),
    [properties, bookings, expenses, supplies, cleaning, maintenance, settings, savedSetupProgress]
  );

  const hasNoProperties = properties.length === 0;

  if (hasNoProperties) {
    return (
      <EmptyDashboardSetup
        setPage={goToPage}
        restoreSampleData={restoreSampleData}
        checklist={setupChecklist}
        onMarkComplete={markSetupComplete}
        setupExpanded={setupExpanded}
        onToggleSetupExpanded={toggleSetupExpanded}
      />
    );
  }

  const selectedMonth = monthFilter || new Date().toISOString().slice(0, 7);
  const selectedPropFilter = propFilter || "ALL";

  const filteredBookings = (selectedPropFilter === "ALL"
    ? bookings
    : bookings.filter((booking) => booking.property_id === selectedPropFilter)
  ).filter(
    (booking) =>
      booking.booking_status !== "Cancelled" &&
      (inSelectedMonth(booking.checkin_date, selectedMonth) ||
        inSelectedMonth(booking.checkout_date, selectedMonth))
  );

  const filteredExpenses = (selectedPropFilter === "ALL"
    ? expenses
    : expenses.filter(
        (expense) => expense.property_id === selectedPropFilter || !expense.property_id
      )
  ).filter((expense) => inSelectedMonth(expense.expense_date, selectedMonth));

  const filteredCleaning = selectedPropFilter === "ALL"
    ? cleaning
    : cleaning.filter((task) => task.property_id === selectedPropFilter);

  const filteredMaintenance = selectedPropFilter === "ALL"
    ? maintenance
    : maintenance.filter((issue) => issue.property_id === selectedPropFilter);

  const filteredSupplies = selectedPropFilter === "ALL"
    ? supplies
    : supplies.filter((supply) => supply.property_id === selectedPropFilter || !supply.property_id);

  const grossRevenue = filteredBookings.reduce((sum, booking) => sum + bookingTotal(booking), 0);
  const bookedNights = filteredBookings.reduce(
    (sum, booking) => sum + calcNights(booking.checkin_date, booking.checkout_date),
    0
  );
  const occupancy = bookedNights / daysInMonth(selectedMonth);
  const directRevenue = filteredBookings
    .filter((booking) => isDirectPlatform(booking.platform))
    .reduce((sum, booking) => sum + bookingTotal(booking), 0);

  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const platformFeePercentage = Number(settings.platform_fee_percentage || 0);
  const managementFeePercentage = Number(settings.management_fee_percentage || 0);
  const taxReservePercentage = Number(settings.tax_reserve_percentage || 0);
  const platformFees = grossRevenue * platformFeePercentage;
  const managementFee = grossRevenue * managementFeePercentage;
  const taxReserve = grossRevenue * taxReservePercentage;

  const cleaningCost = filteredExpenses
    .filter((expense) => expense.category === "Cleaning")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const utilityCost = filteredExpenses
    .filter((expense) => ["JPS", "NWC", "Internet", "Utilities"].includes(expense.category))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const maintenanceCost = filteredExpenses
    .filter((expense) => ["Repairs", "Maintenance"].includes(expense.category))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const suppliesCost = filteredExpenses
    .filter((expense) => ["Supplies", "Linen", "Guest Amenity"].includes(expense.category))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  const otherExpenses = Math.max(0, totalExpenses - cleaningCost - utilityCost - maintenanceCost - suppliesCost);

  const netProfit = grossRevenue - platformFees - totalExpenses - managementFee - taxReserve;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingBookings = filteredBookings
    .filter((booking) => new Date(`${booking.checkin_date}T00:00:00`) >= today)
    .sort((a, b) => new Date(a.checkin_date) - new Date(b.checkin_date))
    .slice(0, 5);

  const cleaningDue = filteredCleaning
    .filter((task) => !["Completed", "Cancelled"].includes(task.cleaning_status))
    .sort((a, b) => new Date(a.checkout_date) - new Date(b.checkout_date))
    .slice(0, 5);

  const urgentMaint = filteredMaintenance.filter((issue) =>
    ["Urgent", "High"].includes(issue.priority) && !["Completed", "Cancelled"].includes(issue.status)
  );

  const lowStock = filteredSupplies
    .map((supply) => ({
      ...supply,
      _status: supplyStatus(supply.current_quantity, supply.reorder_level),
    }))
    .filter((supply) => ["Low Stock", "Out of Stock"].includes(supply._status));

  const alerts = [
    ...urgentMaint.map((issue) => ({
      type: "Maintenance",
      tone: issue.priority === "Urgent" ? "red" : "amber",
      title: issue.issue_title,
      sub: `${issue.priority} · ${issue.status}`,
      icon: Wrench,
      page: "maintenance",
    })),
    ...lowStock.map((supply) => ({
      type: "Supply",
      tone: supply._status === "Out of Stock" ? "red" : "amber",
      title: supply.item_name,
      sub: `${supply._status} · ${supply.current_quantity} ${supply.unit || ""}`,
      icon: Package,
      page: "supplies",
    })),
    ...cleaningDue
      .filter((task) => new Date(`${task.checkout_date}T00:00:00`) <= today)
      .map((task) => ({
        type: "Cleaning",
        tone: "blue",
        title: "Cleaning due",
        sub: `${fmtDateShort(task.checkout_date)} · ${task.cleaning_status}`,
        icon: Sparkles,
        page: "cleaning",
      })),
  ].slice(0, 6);

  let health = 100;
  health -= urgentMaint.length * 10;
  health -= lowStock.length * 5;
  health -= cleaningDue.filter((task) => new Date(`${task.checkout_date}T00:00:00`) < today).length * 5;
  health = Math.max(0, health);

  const healthLabel =
    health >= 90 ? "Healthy" : health >= 75 ? "Needs Attention" : health >= 50 ? "Risky" : "Critical";

  const healthTone = health >= 90 ? "green" : health >= 75 ? "amber" : health >= 50 ? "amber" : "red";

  const profitBreakdown = [
    { label: "Gross Revenue", value: grossRevenue, bold: true },
    { label: `− Platform Fees (${fmtPct(platformFeePercentage)})`, value: -platformFees },
    { label: "− Cleaning Costs", value: -cleaningCost },
    { label: "− Utilities", value: -utilityCost },
    { label: "− Maintenance & Repairs", value: -maintenanceCost },
    { label: "− Supplies / Restocking", value: -suppliesCost },
    { label: "− Other Expenses", value: -otherExpenses },
    { label: `− Management Fee (${fmtPct(managementFeePercentage)})`, value: -managementFee },
    { label: `− Tax Reserve (${fmtPct(taxReservePercentage)})`, value: -taxReserve },
  ];

  const getProp = (id) => properties.find((property) => property.property_id === id);

  const hasNoBookings = bookings.length === 0;
  const hasNoExpenses = expenses.length === 0;
  const hasNoSupplies = supplies.length === 0;
  const hasNoMaintenance = maintenance.length === 0;
  const hasNoCleaning = cleaning.length === 0;

  return (
    <div className="page">
      <PageHeader
        title="Host Dashboard"
        subtitle={`Snapshot for ${
          selectedPropFilter === "ALL" ? "all properties" : getProp(selectedPropFilter)?.property_name || ""
        } — ${selectedMonth}`}
        actions={
          <>
            <button className="btn-secondary" onClick={() => goToPage("settings")}>
              <Settings size={14} />
              Setup
            </button>
            <button className="btn-secondary" onClick={() => goToPage("bookings")}>
              + Add Booking
            </button>
            <button className="btn-primary" onClick={() => goToPage("revenue")}>
              + Add Expense
            </button>
          </>
        }
      />

      <SetupProgressCard
        checklist={setupChecklist}
        onGoToPage={goToPage}
        onMarkComplete={markSetupComplete}
        compact
        expanded={setupExpanded}
        onToggleExpanded={toggleSetupExpanded}
      />

      {(hasNoBookings || hasNoExpenses || hasNoSupplies || hasNoMaintenance) && (
        <div className="card-sand" style={{ padding: 18, marginBottom: 22 }}>
          <h3 className="section-title" style={{ marginBottom: 6 }}>Continue setting up your workspace</h3>
          <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 14 }}>
            Your property is added. Now add bookings, expenses, supplies, and maintenance records so the dashboard can calculate real revenue, occupancy, profit, tax reserve, and operational alerts.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {hasNoBookings && (
              <button className="btn-secondary" onClick={() => goToPage("bookings")}>Add Booking</button>
            )}
            {hasNoExpenses && (
              <button className="btn-secondary" onClick={() => goToPage("revenue")}>Add Expense</button>
            )}
            {hasNoSupplies && (
              <button className="btn-secondary" onClick={() => goToPage("supplies")}>Add Supply</button>
            )}
            {hasNoMaintenance && (
              <button className="btn-secondary" onClick={() => goToPage("maintenance")}>Add Maintenance</button>
            )}
            {hasNoCleaning && (
              <button className="btn-secondary" onClick={() => goToPage("cleaning")}>Add Cleaning</button>
            )}
          </div>
        </div>
      )}

      <div className="metric-grid">
        <MetricCard
          label="Gross Revenue"
          value={fmtCurrency(grossRevenue, cur)}
          sub={`${filteredBookings.length} bookings this month`}
          tone="navy"
          icon={DollarSign}
        />
        <MetricCard
          label="Net Profit"
          value={fmtCurrency(netProfit, cur)}
          sub="After expenses, fees, and reserve"
          tone={netProfit >= 0 ? "teal" : "red"}
          icon={TrendingUp}
        />
        <MetricCard
          label="Occupancy"
          value={fmtPct(occupancy)}
          sub={`${bookedNights} booked nights`}
          tone="sand"
          icon={Calendar}
        />
        <MetricCard
          label="Operations Health"
          value={`${health}%`}
          sub={healthLabel}
          tone={healthTone}
          icon={Star}
        />
      </div>

      <div className="grid-2" style={{ alignItems: "start", marginTop: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header">
            <div>
              <h3 className="section-title" style={{ marginBottom: 4 }}>Upcoming Bookings</h3>
              <p className="text-muted text-small">Next confirmed stays from current filters.</p>
            </div>
            <button className="btn-ghost" onClick={() => goToPage("bookings")}>View All</button>
          </div>

          {upcomingBookings.length === 0 ? (
            <EmptyCard
              title="No upcoming bookings"
              body="Add a booking to activate check-in tracking, occupancy, and revenue calculations."
              buttonLabel="Add Booking"
              onClick={() => goToPage("bookings")}
            />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Guest</th>
                    <th>Check-in</th>
                    <th className="td-right">Total</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcomingBookings.map((booking) => (
                    <tr key={booking.booking_id} className="tr-clickable" onClick={() => goToPage("bookings")}>
                      <td>
                        <div className="fw-bold">{booking.guest_name || "Unnamed guest"}</div>
                        <div className="td-muted">{getProp(booking.property_id)?.property_name || "—"}</div>
                      </td>
                      <td className="num">{fmtDateShort(booking.checkin_date)}</td>
                      <td className="td-right num fw-bold">{fmtCurrency(bookingTotal(booking), cur)}</td>
                      <td>
                        <Chip tone={bookingStatusChip(booking.booking_status)}>{booking.booking_status}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="card-header">
            <div>
              <h3 className="section-title" style={{ marginBottom: 4 }}>Alerts</h3>
              <p className="text-muted text-small">Urgent maintenance, low stock, and cleaning tasks.</p>
            </div>
            <Bell size={18} color="var(--muted)" />
          </div>

          {alerts.length === 0 ? (
            <EmptyCard title="No urgent alerts" body="Your current filters do not show urgent maintenance, overdue cleaning, or low-stock items." />
          ) : (
            <div>
              {alerts.map((alert, index) => {
                const Icon = alert.icon;
                return (
                  <div key={`${alert.type}-${alert.title}-${index}`} className={`alert-item ${alert.tone}`} onClick={() => goToPage(alert.page)}>
                    <Icon size={18} className="alert-icon" />
                    <div className="alert-body">
                      <div className="alert-title">{alert.title}</div>
                      <div className="alert-sub">{alert.sub}</div>
                    </div>
                    <ArrowRight size={14} />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start", marginTop: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 className="section-title">Profit Snapshot</h3>
          <div className="profit-table">
            {profitBreakdown.map((row) => (
              <div key={row.label} className="profit-row">
                <span className={`profit-label ${row.bold ? "bold" : ""}`}>{row.label}</span>
                <span className={`profit-value ${row.value < 0 ? "negative" : ""}`}>{fmtCurrency(row.value, cur)}</span>
              </div>
            ))}
            <div className="profit-row total">
              <span style={{ color: "var(--teal)", fontWeight: 700 }}>Estimated Net Profit</span>
              <span className="profit-value teal">{fmtCurrency(netProfit, cur)}</span>
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 className="section-title">Quick Stats</h3>
          <div className="profit-table">
            <div className="profit-row">
              <span className="profit-label">Direct Revenue</span>
              <span className="profit-value">{fmtCurrency(directRevenue, cur)}</span>
            </div>
            <div className="profit-row">
              <span className="profit-label">Tax Reserve</span>
              <span className="profit-value">{fmtCurrency(taxReserve, cur)}</span>
            </div>
            <div className="profit-row">
              <span className="profit-label">Cleaning Tasks Due</span>
              <span className="profit-value">{cleaningDue.length}</span>
            </div>
            <div className="profit-row">
              <span className="profit-label">Urgent / High Maintenance</span>
              <span className="profit-value">{urgentMaint.length}</span>
            </div>
            <div className="profit-row">
              <span className="profit-label">Low Stock Items</span>
              <span className="profit-value">{lowStock.length}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ alignItems: "start", marginTop: 18 }}>
        <div className="card" style={{ padding: 18 }}>
          <div className="card-header">
            <div>
              <h3 className="section-title" style={{ marginBottom: 4 }}>Cleaning Queue</h3>
              <p className="text-muted text-small">Open cleaning tasks by checkout date.</p>
            </div>
            <button className="btn-ghost" onClick={() => goToPage("cleaning")}>Open</button>
          </div>
          {cleaningDue.length === 0 ? (
            <EmptyCard title="No cleaning tasks due" body="Create cleaning tasks from bookings or add them manually." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Checkout</th>
                    <th>Cleaner</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {cleaningDue.map((task) => (
                    <tr key={task.cleaning_id} className="tr-clickable" onClick={() => goToPage("cleaning")}>
                      <td className="num">{fmtDateShort(task.checkout_date)}</td>
                      <td>{task.cleaner_name || "Unassigned"}</td>
                      <td>
                        <Chip tone={cleaningStatusChip(task.cleaning_status)}>{task.cleaning_status}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <div className="card-header">
            <div>
              <h3 className="section-title" style={{ marginBottom: 4 }}>Low Stock</h3>
              <p className="text-muted text-small">Items at or below reorder level.</p>
            </div>
            <button className="btn-ghost" onClick={() => goToPage("supplies")}>Open</button>
          </div>
          {lowStock.length === 0 ? (
            <EmptyCard title="No low-stock items" body="Add supplies and reorder levels to track inventory warnings." />
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="td-right">Qty</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStock.slice(0, 5).map((supply) => (
                    <tr key={supply.supply_id} className="tr-clickable" onClick={() => goToPage("supplies")}>
                      <td className="fw-bold">{supply.item_name}</td>
                      <td className="td-right num">{supply.current_quantity}</td>
                      <td>
                        <Chip tone={supplyChip(supply._status)}>{supply._status}</Chip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="card-sand" style={{ padding: 18, marginTop: 18 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div>
            <h3 className="section-title" style={{ marginBottom: 4 }}>Backup reminder</h3>
            <p style={{ color: "var(--muted)", fontSize: 13, lineHeight: 1.6 }}>
              Export a backup before large edits, imports, resets, or production testing.
            </p>
          </div>
          <button className="btn-secondary" onClick={() => goToPage("settings")}>
            <Download size={14} />
            Open Backup Tools
          </button>
        </div>
        </div>
      )}
    </div>
  );
}
