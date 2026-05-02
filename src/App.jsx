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

const Dashboard = pickComponent(DashboardModule, ["Dashboard", "DashboardPage"], "Dashboard");
const Bookings = pickComponent(BookingsModule, ["Bookings", "BookingsPage"], "Bookings");

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
  "Tax/GCT Reserve"
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

const Account = pickComponent(AccountModule, ["Account", "AccountPage"], "My Account");

function LoadingScreen({ label = "Loading your host dashboard…" }) {
  return (
    <div className="loading-screen">
      {label}
    </div>
  );
}

function DashboardShell() {
  const [page, setPage] = useState("dashboard");
  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [propFilter, setPropFilter] = useState("ALL");

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("hostSidebarCollapsed") === "true";
  });

  const toggleSidebarCollapsed = () => {
    setSidebarCollapsed((previousValue) => {
      const nextValue = !previousValue;
      localStorage.setItem("hostSidebarCollapsed", String(nextValue));
      return nextValue;
    });
  };

  const goToPage = (nextPage) => {
    setPage(nextPage);
  };

  const renderPage = () => {
    const shared = { monthFilter, propFilter, setPage: goToPage };

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
        return <OwnerReport {...shared} />;

      case "tax":
      case "tax-reserve":
      case "gct":
        return <TaxReserve {...shared} />;

      case "sops":
      case "sop":
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

        <main className="app-main">
          <TopBar
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            propFilter={propFilter}
            setPropFilter={setPropFilter}
          />

          <div className="account-toolbar">
            <button className="btn-secondary" onClick={() => setPage("account")}>
              My Account
            </button>
          </div>

          <div className="page-scroll-frame">
            {renderPage()}
          </div>
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
