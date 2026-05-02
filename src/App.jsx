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
        return (
          <Bookings
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "guests":
        return (
          <Guests
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "cleaning":
        return (
          <Cleaning
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "maintenance":
        return (
          <Maintenance
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "supplies":
        return (
          <Supplies
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "revenue":
        return (
          <Revenue
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "leads":
        return (
          <Leads
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "owner-report":
      case "ownerReport":
        return (
          <OwnerReport
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "tax-reserve":
      case "taxReserve":
        return (
          <TaxReserve
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "sops":
      case "SOPs":
        return <SOPs />;

      case "messages":
        return <Messages />;

      case "settings":
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
      <div className="app-shell">
        <Sidebar page={page} setPage={setPage} />

        <main className="main-content">
          <TopBar
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            propFilter={propFilter}
            setPropFilter={setPropFilter}
            onAccountClick={() => setPage("settings")}
          />

          <div className="page-content">
            {renderPage()}
          </div>
        </main>
      </div>
    </AppProvider>
  );
}
