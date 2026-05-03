import { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import { AppProvider } from "./context/AppContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";

import * as DashboardModule from "./pages/Dashboard.jsx";
import * as BookingsModule from "./pages/Bookings.jsx";
import * as GuestCleaningMaintenanceModule from "./pages/GuestsCleaningMaintenance.jsx";
import * as SuppliesRevenueLeadsModule from "./pages/SuppliesRevenuLeads.jsx";
import * as OwnerTaxMessagesSettingsModule from "./pages/OwnerReportTaxSOPsMessagesSettings.jsx";
import * as AccountModule from "./pages/Account.jsx";

import "./styles.css";

const currentMonth = () => new Date().toISOString().slice(0, 7);


const PAGE_TITLES = {
  dashboard: "Dashboard",
  bookings: "Booking Calendar",
  guests: "Guest CRM",
  cleaning: "Cleaning Schedule",
  maintenance: "Maintenance",
  supplies: "Supplies",
  revenue: "Revenue & Profit",
  leads: "Direct Leads",
  owner: "Owner Report",
  tax: "Tax Reserve",
  sops: "SOPs",
  messages: "Messages",
  settings: "Settings",
  account: "My Account",
};

function pickComponent(moduleObject, possibleNames, fallbackLabel) {
  for (const name of possibleNames) {
    if (moduleObject?.[name]) return moduleObject[name];
  }

  if (moduleObject?.default) return moduleObject.default;

  return function MissingPage() {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">{fallbackLabel}</h1>
          <p className="page-subtitle">
            This page component was not found. Check the export name in the page file.
          </p>
        </div>
      </div>
    );
  };
}

const Dashboard = pickComponent(
  DashboardModule,
  ["Dashboard", "DashboardPage"],
  "Dashboard"
);

const Bookings = pickComponent(
  BookingsModule,
  ["Bookings", "BookingsPage"],
  "Bookings"
);

const Guests = pickComponent(
  GuestCleaningMaintenanceModule,
  ["Guests", "GuestsPage"],
  "Guests"
);

const Cleaning = pickComponent(
  GuestCleaningMaintenanceModule,
  ["Cleaning", "CleaningPage"],
  "Cleaning"
);

const Maintenance = pickComponent(
  GuestCleaningMaintenanceModule,
  ["Maintenance", "MaintenancePage"],
  "Maintenance"
);

const Supplies = pickComponent(
  SuppliesRevenueLeadsModule,
  ["Supplies", "SuppliesPage"],
  "Supplies"
);

const Revenue = pickComponent(
  SuppliesRevenueLeadsModule,
  ["Revenue", "RevenuePage"],
  "Revenue"
);

const Leads = pickComponent(
  SuppliesRevenueLeadsModule,
  ["Leads", "DirectLeads", "DirectLeadsPage"],
  "Direct Booking Leads"
);

const OwnerReport = pickComponent(
  OwnerTaxMessagesSettingsModule,
  ["OwnerReport", "OwnerReportPage"],
  "Owner Report"
);

const TaxReserve = pickComponent(
  OwnerTaxMessagesSettingsModule,
  ["TaxReserve", "TaxReservePage"],
  "Tax Reserve Tracker"
);

const SOPs = pickComponent(
  OwnerTaxMessagesSettingsModule,
  ["SOPs", "SOPsPage", "SOPChecklistLibrary"],
  "SOP Checklists"
);

const Messages = pickComponent(
  OwnerTaxMessagesSettingsModule,
  ["Messages", "MessagesPage", "GuestMessageTemplates"],
  "Guest Message Templates"
);

const Settings = pickComponent(
  OwnerTaxMessagesSettingsModule,
  ["Settings", "SettingsPage"],
  "Settings"
);

const Account = pickComponent(
  AccountModule,
  ["Account", "AccountPage"],
  "My Account"
);


class PageErrorBoundary extends Error {
  constructor(error) {
    super(error?.message || "Unknown page error");
    this.originalError = error;
  }
}

function SafePage({ children, pageName }) {
  try {
    return children();
  } catch (error) {
    const wrapped = new PageErrorBoundary(error);
    return (
      <div className="page">
        <div className="card" style={{ padding: 16 }}>
          <h2>Page failed to render</h2>
          <p><strong>Page:</strong> {pageName}</p>
          <p>{wrapped.message}</p>
        </div>
      </div>
    );
  }
}

function LoadingScreen({ label = "Loading your host dashboard…" }) {
  return <div className="loading-screen">{label}</div>;
}

function DashboardShell() {
  const [page, setPage] = useState("dashboard");
  const [pageAction, setPageAction] = useState(null);
  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [propFilter, setPropFilter] = useState("ALL");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem("hostSidebarCollapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((previousValue) => {
      const nextValue = !previousValue;

      try {
        localStorage.setItem("hostSidebarCollapsed", String(nextValue));
      } catch {
        // Keep the app usable if browser storage is blocked.
      }

      return nextValue;
    });
  };

  const closeMobileSidebar = () => {
    setMobileSidebarOpen(false);
  };

  const goToPage = (nextPage, action = null) => {
    setPage(nextPage);
    setPageAction(action);
    closeMobileSidebar();
  };

  const clearPageAction = () => {
    setPageAction(null);
  };

  const renderPage = () => {
    const shared = {
      monthFilter,
      propFilter,
      setPage: goToPage,
      pageAction,
      onPageActionHandled: clearPageAction,
    };

    switch (page) {
      case "dashboard":
        return <Dashboard {...shared} />;

      case "bookings":
      case "booking-calendar":
        return <Bookings {...shared} />;

      case "guests":
      case "guest-crm":
        return <Guests {...shared} />;

      case "cleaning":
      case "cleaning-schedule":
        return <Cleaning {...shared} />;

      case "maintenance":
      case "maintenance-tracker":
        return <Maintenance {...shared} />;

      case "supplies":
      case "supplies-inventory":
        return <Supplies {...shared} />;

      case "revenue":
      case "revenue-profit":
        return <Revenue {...shared} />;

      case "leads":
      case "direct-leads":
      case "direct-booking":
        return <Leads {...shared} />;

      case "owner":
      case "owner-report":
      case "owner-reports":
      case "ownerReport":
        return <OwnerReport {...shared} />;

      case "tax":
      case "tax-reserve":
      case "taxReserve":
      case "gct":
        return <TaxReserve {...shared} />;

      case "sops":
      case "sop":
      case "SOPs":
      case "SOP":
      case "checklists":
        return <SOPs {...shared} />;

      case "messages":
      case "templates":
      case "guest-messages":
        return <Messages {...shared} />;

      case "settings":
        return <Settings {...shared} />;

      case "account":
      case "my-account":
        return <Account {...shared} />;

      default:
        return <Dashboard {...shared} />;
    }
  };

  return (
    <AppProvider>
      <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar
          page={page}
          setPage={goToPage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />

        {mobileSidebarOpen && (
          <>
            <div
              className="sidebar-overlay mobile-sidebar-overlay open"
              onClick={closeMobileSidebar}
            />

            <Sidebar
              page={page}
              setPage={goToPage}
              collapsed={false}
              mobile
              onClose={closeMobileSidebar}
            />
          </>
        )}

        <main className="app-main main-content">
          <TopBar
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            propFilter={propFilter}
            setPropFilter={setPropFilter}
            onMenuClick={() => setMobileSidebarOpen(true)}
            onAccountClick={() => goToPage("account")}
            onToggleSidebar={toggleSidebarCollapsed}
            pageTitle={PAGE_TITLES[page] || "Dashboard"}
          />

          <div className="page-scroll-frame"><SafePage pageName={page}>{() => renderPage()}</SafePage></div>
        </main>
      </div>
    </AppProvider>
  );
}

function AuthGate() {
  const { user, loading, authError } = useAuth();

  if (loading) {
    return <LoadingScreen label="Checking your secure session…" />;
  }

  if (authError) {
    return (
      <div className="auth-setup-error">
        <div>
          <strong>Authentication Setup Issue</strong>
          <p>{authError}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <DashboardShell />;
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}