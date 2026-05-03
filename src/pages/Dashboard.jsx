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
  SUPPORTED_CURRENCIES,
  CURRENCY_DISPLAY_NAMES,
  getCurrencyHelperText,
  normalizeCurrency,
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
  Circle,
  Settings,
} from "lucide-react";

const SETUP_PROGRESS_STORAGE_KEY = "jak_dashboard_setup_progress";
const SETUP_CHECKLIST_OPEN_STORAGE_KEY = "jak_setup_checklist_open";

function safeArray(value) {
  return Array.isArray(value) ? value : [];
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
    localStorage.setItem(
      SETUP_PROGRESS_STORAGE_KEY,
      JSON.stringify(nextProgress)
    );
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
      completed:
        cleaners.length > 0 ||
        vendors.length > 0 ||
        savedProgress.team === true,
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
      completed:
        cleaning.length > 0 ||
        maintenance.length > 0 ||
        savedProgress.operations === true,
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
}) {
  const [isOpen, setIsOpen] = useState(() => {
    try {
      const savedValue = localStorage.getItem(SETUP_CHECKLIST_OPEN_STORAGE_KEY);

      if (savedValue === "true") return true;
      if (savedValue === "false") return false;

      return !compact;
    } catch {
      return !compact;
    }
  });

  const completedCount = checklist.filter((item) => item.completed).length;
  const totalCount = checklist.length;
  const percent =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const toggleChecklist = () => {
    setIsOpen((previousValue) => {
      const nextValue = !previousValue;

      try {
        localStorage.setItem(
          SETUP_CHECKLIST_OPEN_STORAGE_KEY,
          String(nextValue)
        );
      } catch {
        // Keep the UI working even if browser storage is blocked.
      }

      return nextValue;
    });
  };

  return (
    <div className={`card setup-progress-card ${isOpen ? "open" : "closed"}`}>
      <div className="setup-progress-header">
        <div className="setup-progress-copy">
          <h3 className="section-title setup-progress-title">
            Setup Checklist
          </h3>

          <p className="setup-progress-text">
            Complete these setup items to turn the dashboard into a live
            operating system for your property or hosting business.
          </p>
        </div>

        <div className="setup-progress-actions">
          <Chip tone={percent === 100 ? "green" : "teal"}>
            {completedCount}/{totalCount} Complete
          </Chip>

          <button
            type="button"
            className="btn-ghost setup-toggle-btn"
            onClick={toggleChecklist}
            aria-expanded={isOpen}
            aria-controls="setup-checklist-content"
          >
            {isOpen ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      <div className="setup-progress-bar">
        <div
          className="setup-progress-bar-fill"
          style={{ width: `${percent}%` }}
        />
      </div>

      {isOpen && (
        <div id="setup-checklist-content" className="setup-checklist-grid">
          {checklist.map((item) => (
            <div
              key={item.id}
              className={`setup-checklist-item ${
                item.completed ? "completed" : ""
              }`}
            >
              <div className="setup-checklist-icon">
                {item.completed ? (
                  <CheckCircle2 size={18} color="var(--teal)" />
                ) : (
                  <Circle size={18} color="var(--muted)" />
                )}
              </div>

              <div className="setup-checklist-body">
                <div className="setup-checklist-title">{item.title}</div>

                {!compact && (
                  <div className="setup-checklist-description">
                    {item.body}
                  </div>
                )}
              </div>

              <div className="setup-checklist-actions">
                {!item.completed && item.canManuallyComplete && (
                  <button
                    type="button"
                    className="btn-ghost setup-mini-btn"
                    onClick={() => onMarkComplete(item.id)}
                  >
                    Done
                  </button>
                )}

                <button
                  type="button"
                  className={
                    item.completed
                      ? "btn-ghost setup-mini-btn"
                      : "btn-secondary setup-mini-btn"
                  }
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
}) {
  const handleRestoreDemo = () => {
    const confirmed = window.confirm(
      "This will restore the sample demo data. Continue?"
    );

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
      title: "Track expenses, supplies, and utilities",
      body: "Log utilities, internet, cleaning, repairs, inventory, and restocking costs across your properties.",
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
            <h3 className="section-title" style={{ marginBottom: 6 }}>
              Start from scratch
            </h3>

            <p
              style={{
                color: "var(--muted)",
                fontSize: 13,
                lineHeight: 1.6,
                maxWidth: 760,
              }}
            >
              This is the correct state for a new customer. No sample properties,
              bookings, guests, supplies, maintenance tasks, leads, owner
              reports, or tax reserve records are currently loaded.
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
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 14,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 12,
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
                  <h3 style={{ fontSize: 16, marginBottom: 5 }}>
                    {step.title}
                  </h3>

                  <p
                    style={{
                      color: "var(--muted)",
                      fontSize: 13,
                      lineHeight: 1.6,
                    }}
                  >
                    {step.body}
                  </p>
                </div>
              </div>

              <button
                className="btn-secondary"
                onClick={() => setPage(step.page)}
              >
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
      />
    </div>
  );
}

function EmptyCard({ title, body, buttonLabel, onClick }) {
  return (
    <div className="card" style={{ padding: 18 }}>
      <h3 className="section-title" style={{ marginBottom: 6 }}>
        {title}
      </h3>

      <p
        style={{
          color: "var(--muted)",
          fontSize: 13,
          lineHeight: 1.6,
          marginBottom: 14,
        }}
      >
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

export default function Dashboard({
  setPage,
  monthFilter,
  setMonthFilter,
  propFilter,
  setPropFilter,
}) {
  const {
    bookings: rawBookings,
    expenses: rawExpenses,
    maintenance: rawMaintenance,
    supplies: rawSupplies,
    cleaning: rawCleaning,
    properties: rawProperties,
    settings: rawSettings,
    setSettings,
    restoreSampleData,
  } = useApp();

  const bookings = safeArray(rawBookings);
  const expenses = safeArray(rawExpenses);
  const maintenance = safeArray(rawMaintenance);
  const supplies = safeArray(rawSupplies);
  const cleaning = safeArray(rawCleaning);
  const properties = safeArray(rawProperties);
  const settings = rawSettings || {};

  const [savedSetupProgress, setSavedSetupProgress] = useState(() =>
    loadSetupProgress()
  );

  const cur = settings.default_currency || "JMD";
  const selectedCurrency = normalizeCurrency(cur);

  const goToPage = (nextPage) => {
    if (typeof setPage === "function") {
      setPage(nextPage);
    }
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
    [
      properties,
      bookings,
      expenses,
      supplies,
      cleaning,
      maintenance,
      settings,
      savedSetupProgress,
    ]
  );

  const hasNoProperties = properties.length === 0;

  if (hasNoProperties) {
    return (
      <EmptyDashboardSetup
        setPage={goToPage}
        restoreSampleData={restoreSampleData}
        checklist={setupChecklist}
        onMarkComplete={markSetupComplete}
      />
    );
  }

  const selectedMonth = monthFilter || new Date().toISOString().slice(0, 7);
  const selectedPropFilter =
    !propFilter || propFilter === "all" || propFilter === "ALL"
      ? "ALL"
      : propFilter;

  const filterByProp = (arr, key = "property_id") =>
    selectedPropFilter === "ALL"
      ? arr
      : arr.filter((x) => x[key] === selectedPropFilter || !x[key]);

  const monthBookings = filterByProp(bookings).filter(
    (booking) =>
      booking.booking_status !== "Cancelled" &&
      (inSelectedMonth(booking.checkin_date, selectedMonth) ||
        inSelectedMonth(booking.checkout_date, selectedMonth))
  );

  const monthExpenses = filterByProp(expenses).filter((expense) =>
    inSelectedMonth(expense.expense_date, selectedMonth)
  );

  const grossRevenue = monthBookings.reduce(
    (sum, booking) => sum + bookingTotal(booking),
    0
  );

  const airbnbRevenue = monthBookings
    .filter((booking) => booking.platform === "Airbnb")
    .reduce((sum, booking) => sum + bookingTotal(booking), 0);

  const directRevenue = monthBookings
    .filter((booking) => isDirectPlatform(booking.platform))
    .reduce((sum, booking) => sum + bookingTotal(booking), 0);

  const bookedNights = monthBookings.reduce(
    (sum, booking) =>
      sum + calcNights(booking.checkin_date, booking.checkout_date),
    0
  );

  const activePropsCount =
    selectedPropFilter === "ALL"
      ? properties.filter((property) => property.active !== false).length
      : 1;

  const availableNights =
    daysInMonth(selectedMonth) * Math.max(1, activePropsCount);

  const occupancy = availableNights > 0 ? bookedNights / availableNights : 0;

  const roomRevenue = monthBookings.reduce(
    (sum, booking) =>
      sum +
      (Number(booking.nightly_rate) || 0) *
        calcNights(booking.checkin_date, booking.checkout_date),
    0
  );

  const avgNightly = bookedNights > 0 ? roomRevenue / bookedNights : 0;

  const cleaningCost = monthExpenses
    .filter((expense) => expense.category === "Cleaning")
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const utilityCost = monthExpenses
    .filter((expense) =>
      ["JPS", "NWC", "Internet", "Utilities"].includes(expense.category)
    )
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const maintenanceCost = monthExpenses
    .filter((expense) => ["Repairs", "Maintenance"].includes(expense.category))
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const suppliesCost = monthExpenses
    .filter((expense) =>
      ["Supplies", "Linen", "Guest Amenity"].includes(expense.category)
    )
    .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);

  const otherExpenses = monthExpenses
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

  const platformFeePercentage = Number(settings.platform_fee_percentage || 0);
  const managementFeePercentage = Number(
    settings.management_fee_percentage || 0
  );
  const taxReservePercentage = Number(settings.tax_reserve_percentage || 0);

  const platformFees = grossRevenue * platformFeePercentage;
  const managementFee = grossRevenue * managementFeePercentage;
  const taxReserve = grossRevenue * taxReservePercentage;

  const netProfit =
    grossRevenue -
    platformFees -
    cleaningCost -
    utilityCost -
    maintenanceCost -
    suppliesCost -
    managementFee -
    taxReserve -
    otherExpenses;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = filterByProp(bookings)
    .filter((booking) => {
      const checkinDate = new Date(booking.checkin_date);
      const diff = (checkinDate - today) / 86400000;

      return (
        diff >= 0 &&
        diff <= 14 &&
        booking.booking_status === "Confirmed"
      );
    })
    .sort((a, b) => new Date(a.checkin_date) - new Date(b.checkin_date))
    .slice(0, 5);

  const upcomingCheckouts = filterByProp(bookings)
    .filter((booking) => {
      const checkoutDate = new Date(booking.checkout_date);
      const diff = (checkoutDate - today) / 86400000;

      return (
        diff >= 0 &&
        diff <= 14 &&
        ["Checked In", "Confirmed"].includes(booking.booking_status)
      );
    })
    .sort((a, b) => new Date(a.checkout_date) - new Date(b.checkout_date))
    .slice(0, 5);

  const lowStock = filterByProp(supplies).filter(
    (supply) =>
      Number(supply.current_quantity) <= Number(supply.reorder_level)
  );

  const urgentMaint = filterByProp(maintenance).filter(
    (issue) =>
      ["Urgent", "High"].includes(issue.priority) &&
      !["Completed", "Cancelled"].includes(issue.status)
  );

  const cleaningDue = filterByProp(cleaning).filter((task) =>
    ["Scheduled", "In Progress"].includes(task.cleaning_status)
  );

  let health = 100;
  health -= urgentMaint.length * 10;
  health -= lowStock.length * 5;
  health -=
    cleaningDue.filter((task) => new Date(task.checkout_date) < today).length *
    5;
  health = Math.max(0, health);

  const healthLabel =
    health >= 90
      ? "Healthy"
      : health >= 75
      ? "Needs Attention"
      : health >= 50
      ? "Risky"
      : "Critical";

  const healthTone =
    health >= 90
      ? "green"
      : health >= 75
      ? "amber"
      : health >= 50
      ? "amber"
      : "red";

  const profitBreakdown = [
    { label: "Gross Revenue", value: grossRevenue, bold: true },
    {
      label: `− Platform Fees (${fmtPct(platformFeePercentage)})`,
      value: -platformFees,
    },
    { label: "− Cleaning Costs", value: -cleaningCost },
    { label: "− Utilities (JPS, NWC, Internet)", value: -utilityCost },
    { label: "− Maintenance & Repairs", value: -maintenanceCost },
    { label: "− Supplies / Restocking", value: -suppliesCost },
    { label: "− Other Expenses", value: -otherExpenses },
    {
      label: `− Management Fee (${fmtPct(managementFeePercentage)})`,
      value: -managementFee,
    },
    {
      label: `− Tax Reserve (${fmtPct(taxReservePercentage)})`,
      value: -taxReserve,
    },
  ];

  const getProp = (id) =>
    properties.find((property) => property.property_id === id);

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
          selectedPropFilter === "ALL"
            ? "all properties"
            : getProp(selectedPropFilter)?.property_name || ""
        } — ${selectedMonth}`}
        actions={
          <>
            <button
              className="btn-secondary"
              onClick={() => goToPage("settings")}
            >
              <Settings size={14} />
              Setup
            </button>

            <button
              className="btn-secondary"
              onClick={() => goToPage("bookings")}
            >
              + Add Booking
            </button>

            <button
              className="btn-primary"
              onClick={() => goToPage("revenue")}
            >
              + Add Expense
            </button>
          </>
        }
      />
      <div className="card dashboard-filter-card">
        <div className="dashboard-filter-row">
          <div className="dashboard-filter-group">
            <label className="dashboard-filter-label" htmlFor="dashboard-property-filter">
              Property
            </label>
            <select
              id="dashboard-property-filter"
              className="topbar-control"
              value={propFilter || "ALL"}
              onChange={(event) => setPropFilter?.(event.target.value)}
            >
              <option value="ALL">All Properties</option>
              {properties.map((property) => (
                <option key={property.property_id} value={property.property_id}>
                  {property.property_name}
                </option>
              ))}
            </select>
          </div>

          <div className="dashboard-filter-group">
            <label className="dashboard-filter-label" htmlFor="dashboard-month-filter">
              Month
            </label>
            <input
              id="dashboard-month-filter"
              className="topbar-control"
              type="month"
              value={selectedMonth}
              onChange={(event) => setMonthFilter?.(event.target.value)}
            />
          </div>

          <div className="dashboard-filter-group">
            <label className="dashboard-filter-label" htmlFor="dashboard-currency-filter">
              Currency
            </label>
            <select
              id="dashboard-currency-filter"
              className="topbar-control"
              value={selectedCurrency}
              title={getCurrencyHelperText(selectedCurrency)}
              onChange={(event) =>
                setSettings?.((previous) => ({
                  ...(previous ?? {}),
                  default_currency: normalizeCurrency(event.target.value),
                }))
              }
            >
              {SUPPORTED_CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency} — {CURRENCY_DISPLAY_NAMES[currency]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <SetupProgressCard
        checklist={setupChecklist}
        onGoToPage={goToPage}
        onMarkComplete={markSetupComplete}
        compact
      />

      {(hasNoBookings || hasNoExpenses || hasNoSupplies || hasNoMaintenance) && (
        <div className="card-sand" style={{ padding: 18, marginBottom: 22 }}>
          <h3 className="section-title" style={{ marginBottom: 6 }}>
            Continue setting up your workspace
          </h3>

          <p
            style={{
              color: "var(--muted)",
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 14,
            }}
          >
            Your property is added. Now add bookings, expenses, supplies, and
            maintenance records so the dashboard can calculate real revenue,
            occupancy, profit, tax reserve, and operational alerts.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {hasNoBookings && (
              <button
                className="btn-secondary"
                onClick={() => goToPage("bookings")}
              >
                Add Booking
              </button>
            )}

            {hasNoExpenses && (
              <button
                className="btn-secondary"
                onClick={() => goToPage("revenue")}
              >
                Add Expense
              </button>
            )}

            {hasNoSupplies && (
              <button
                className="btn-secondary"
                onClick={() => goToPage("supplies")}
              >
                Add Supply
              </button>
            )}

            {hasNoMaintenance && (
              <button
                className="btn-secondary"
                onClick={() => goToPage("maintenance")}
              >
                Add Maintenance Issue
              </button>
            )}
          </div>
        </div>
      )}

      <div className="metric-grid">
        <MetricCard
          tone="navy"
          label="Booking Revenue"
          value={fmtCurrency(grossRevenue, cur)}
          sub={`${monthBookings.length} bookings this month`}
          icon={DollarSign}
        />

        <MetricCard
          tone={netProfit >= 0 ? "teal" : "red"}
          label="Net Profit (Est.)"
          value={fmtCurrency(netProfit, cur)}
          sub="After all fees & expenses"
          icon={TrendingUp}
        />

        <MetricCard
          label="Occupancy"
          value={fmtPct(occupancy)}
          sub={`${bookedNights} / ${availableNights} nights booked`}
          icon={Calendar}
        />

        <MetricCard
          label="Avg Nightly Rate"
          value={fmtCurrency(avgNightly, cur)}
          sub="Excludes cleaning fee"
          icon={Star}
        />
      </div>

      <div className="metric-grid" style={{ marginBottom: 22 }}>
        <MetricCard
          tone="sand"
          label="Airbnb Revenue"
          value={fmtCurrency(airbnbRevenue, cur)}
          sub="Platform bookings"
        />

        <MetricCard
          tone="sand"
          label="Direct Revenue"
          value={fmtCurrency(directRevenue, cur)}
          sub="WhatsApp, IG, Direct"
        />

        <MetricCard
          tone="sand"
          label="Cleaning Cost"
          value={fmtCurrency(cleaningCost, cur)}
          sub="Logged this month"
        />

        <MetricCard
          tone="amber"
          label="Tax Reserve (Est.)"
          value={fmtCurrency(taxReserve, cur)}
          sub={`${fmtPct(taxReservePercentage)} — planning only`}
        />
      </div>

      <div className="grid-2" style={{ marginBottom: 22 }}>
        <div className="card" style={{ padding: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 14,
            }}
          >
            <h3 className="section-title" style={{ margin: 0 }}>
              🚨 Action Required
            </h3>

            <Bell size={16} color="var(--muted)" />
          </div>

          {urgentMaint.length === 0 &&
            lowStock.length === 0 &&
            cleaningDue.length === 0 && (
              <p style={{ color: "var(--muted)", fontSize: 13 }}>
                No urgent alerts right now.
              </p>
            )}

          {urgentMaint.slice(0, 3).map((issue) => (
            <div
              key={issue.issue_id}
              className="alert-item red"
              onClick={() => goToPage("maintenance")}
            >
              <Wrench
                size={15}
                className="alert-icon"
                color="var(--red)"
              />

              <div className="alert-body">
                <div className="alert-title">{issue.issue_title}</div>
                <div className="alert-sub">
                  {getProp(issue.property_id)?.property_name} •{" "}
                  {issue.priority}
                </div>
              </div>

              <Chip tone="red">{issue.status}</Chip>
            </div>
          ))}

          {lowStock.slice(0, 3).map((supply) => (
            <div
              key={supply.supply_id}
              className="alert-item amber"
              onClick={() => goToPage("supplies")}
            >
              <Package
                size={15}
                className="alert-icon"
                color="var(--amber)"
              />

              <div className="alert-body">
                <div className="alert-title">{supply.item_name}</div>
                <div className="alert-sub">
                  {supply.current_quantity} {supply.unit} left · reorder at{" "}
                  {supply.reorder_level}
                </div>
              </div>

              <Chip
                tone={supplyChip(
                  supplyStatus(
                    supply.current_quantity,
                    supply.reorder_level
                  )
                )}
              >
                {supplyStatus(supply.current_quantity, supply.reorder_level)}
              </Chip>
            </div>
          ))}

          {cleaningDue.slice(0, 2).map((task) => (
            <div
              key={task.cleaning_id}
              className="alert-item blue"
              onClick={() => goToPage("cleaning")}
            >
              <Sparkles
                size={15}
                className="alert-icon"
                color="var(--blue)"
              />

              <div className="alert-body">
                <div className="alert-title">
                  {getProp(task.property_id)?.property_name} turnover
                </div>
                <div className="alert-sub">
                  Checkout {fmtDateShort(task.checkout_date)} ·{" "}
                  {task.cleaner_name}
                </div>
              </div>

              <Chip tone={cleaningStatusChip(task.cleaning_status)}>
                {task.cleaning_status}
              </Chip>
            </div>
          ))}
        </div>

        <div
          className="card-sand"
          style={{ padding: 18, borderRadius: "var(--radius)" }}
        >
          <h3 className="section-title" style={{ margin: "0 0 4px" }}>
            Property Health
          </h3>

          <p
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 16,
            }}
          >
            Operations score for selected scope
          </p>

          <div className="health-score">
            {health}
            <span style={{ fontSize: 20, color: "var(--muted)" }}>/100</span>
          </div>

          <div style={{ marginTop: 10 }}>
            <Chip tone={healthTone}>{healthLabel}</Chip>
          </div>

          <div className="health-breakdown">
            −10 per urgent maintenance issue
            <br />
            −5 per low stock item
            <br />
            −5 per overdue cleaning task
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 22 }}>
        <div className="card" style={{ padding: 18 }}>
          <h3 className="section-title">Next Check-ins</h3>

          {upcoming.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              {hasNoBookings
                ? "No bookings yet. Add your first booking to see upcoming check-ins here."
                : "No check-ins in the next 14 days."}
            </p>
          ) : (
            upcoming.map((booking) => (
              <div key={booking.booking_id} className="upcoming-item">
                <div>
                  <div className="upcoming-name">{booking.guest_name}</div>
                  <div className="upcoming-prop">
                    {getProp(booking.property_id)?.property_name} ·{" "}
                    {booking.platform}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {fmtDateShort(booking.checkin_date)}
                  </div>

                  <Chip tone={bookingStatusChip(booking.booking_status)}>
                    {booking.booking_status}
                  </Chip>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="card" style={{ padding: 18 }}>
          <h3 className="section-title">Next Checkouts / Turnovers</h3>

          {upcomingCheckouts.length === 0 ? (
            <p style={{ color: "var(--muted)", fontSize: 13 }}>
              {hasNoBookings
                ? "No bookings yet. Add bookings to generate checkout and turnover activity."
                : "No checkouts in the next 14 days."}
            </p>
          ) : (
            upcomingCheckouts.map((booking) => (
              <div key={booking.booking_id} className="upcoming-item">
                <div>
                  <div className="upcoming-name">{booking.guest_name}</div>
                  <div className="upcoming-prop">
                    {getProp(booking.property_id)?.property_name}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>
                    {fmtDateShort(booking.checkout_date)}
                  </div>

                  <Chip tone={paymentStatusChip(booking.payment_status)}>
                    {booking.payment_status}
                  </Chip>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {hasNoBookings && hasNoExpenses ? (
        <div className="grid-2" style={{ marginBottom: 22 }}>
          <EmptyCard
            title="No booking data yet"
            body="Add your first booking to activate revenue, occupancy, check-in, checkout, tax reserve, and owner report calculations."
            buttonLabel="Add Booking"
            onClick={() => goToPage("bookings")}
          />

          <EmptyCard
            title="No expense data yet"
            body="Add your first expense so the dashboard can calculate true profit instead of only gross revenue."
            buttonLabel="Add Expense"
            onClick={() => goToPage("revenue")}
          />
        </div>
      ) : (
        <div className="card" style={{ padding: 18, marginBottom: 22 }}>
          <h3 className="section-title">Monthly Profit Breakdown</h3>

          <p
            style={{
              fontSize: 12,
              color: "var(--muted)",
              marginBottom: 14,
            }}
          >
            Revenue alone is not profit. Here&apos;s what you actually keep
            after all costs.
          </p>

          <div className="profit-table">
            {profitBreakdown.map((row, index) => (
              <div key={index} className="profit-row">
                <span
                  className={row.bold ? "profit-label bold" : "profit-label"}
                >
                  {row.label}
                </span>

                <span
                  className={`profit-value ${
                    row.value < 0 ? "" : "positive"
                  }`}
                >
                  {fmtCurrency(row.value, cur)}
                </span>
              </div>
            ))}

            <div className="profit-row total">
              <span className="fw-bold" style={{ color: "var(--teal)" }}>
                Net Profit (Estimated)
              </span>

              <span
                className={`profit-value ${
                  netProfit >= 0 ? "teal" : "negative"
                }`}
              >
                {fmtCurrency(netProfit, cur)}
              </span>
            </div>
          </div>
        </div>
      )}

      {hasNoCleaning && (
        <div className="card" style={{ padding: 18, marginTop: 22 }}>
          <h3 className="section-title">Cleaning schedule not started</h3>

          <p
            style={{
              color: "var(--muted)",
              fontSize: 13,
              lineHeight: 1.6,
              marginBottom: 14,
            }}
          >
            Add cleaning tasks manually, or later connect cleaning tasks to new
            bookings so turnovers are created automatically after checkout.
          </p>

          <button
            className="btn-secondary"
            onClick={() => goToPage("cleaning")}
          >
            Open Cleaning Schedule
            <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
