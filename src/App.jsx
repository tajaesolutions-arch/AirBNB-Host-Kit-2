import { useState } from "react";
import { AppProvider } from "./context/AppContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";

// Pages
import Dashboard from "./pages/Dashboard.jsx";
import Bookings from "./pages/Bookings.jsx";

import {
  Guests,
  Cleaning,
  Maintenance,
} from "./pages/GuestsCleaningMaintenance.jsx";

import {
  Supplies,
  Revenue,
  Leads,
} from "./pages/SuppliesRevenuLeads.jsx";

import {
  OwnerReport,
  TaxReserve,
  SOPs,
  Messages,
  Settings,
} from "./pages/OwnerReportTaxSOPsMessagesSettings.jsx";

// Default month = current YYYY-MM
const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [propFilter, setPropFilter] = useState("all");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((currentValue) => !currentValue);
  };

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return (
          <Dashboard
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "bookings":
      case "booking-calendar":
        return (
          <Bookings
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "guests":
      case "guest-crm":
        return (
          <Guests
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "cleaning":
      case "cleaning-schedule":
        return (
          <Cleaning
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "maintenance":
      case "maintenance-tracker":
        return (
          <Maintenance
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "supplies":
      case "supplies-inventory":
        return (
          <Supplies
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "revenue":
      case "revenue-profit":
        return (
          <Revenue
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "leads":
      case "direct-leads":
      case "direct-booking":
        return (
          <Leads
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "owner":
      case "owner-report":
      case "owner-reports":
      case "ownerReport":
        return (
          <OwnerReport
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "tax":
      case "tax-reserve":
      case "taxReserve":
      case "gct":
        return (
          <TaxReserve
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "sops":
      case "sop":
      case "SOPs":
      case "SOP":
      case "checklists":
        return <SOPs />;

      case "messages":
      case "templates":
      case "guest-messages":
        return <Messages />;

      case "settings":
      case "account":
      case "my-account":
        return <Settings />;

      default:
        return (
          <Dashboard
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );
    }
  };

  return (
    <AppProvider>
      <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar
          page={page}
          setPage={setPage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
        />

        <main className="main-content">
          <TopBar
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            propFilter={propFilter}
            setPropFilter={setPropFilter}
            onAccountClick={() => setPage("settings")}
          />

          <div className="page-scroll-frame">
            {renderPage()}
          </div>
        </main>
      </div>
    </AppProvider>
  );
}
