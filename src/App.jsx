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

import * as OwnerPages from "./pages/OwnerReportTaxSOPsMessagesSettings.jsx";

// Default month = current YYYY-MM
const currentMonth = () => new Date().toISOString().slice(0, 7);

function MissingPage({ pageName }) {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">{pageName}</h1>
        <p className="page-subtitle">
          This page component was not found in the current source file.
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [propFilter, setPropFilter] = useState("all");

  const OwnerReportPage =
    OwnerPages.OwnerReport ||
    OwnerPages.OwnerReportPage ||
    (() => <MissingPage pageName="Owner Report" />);

  const TaxReservePage =
    OwnerPages.TaxReserve ||
    OwnerPages.TaxReservePage ||
    (() => <MissingPage pageName="Tax Reserve" />);

  const SOPsPage =
    OwnerPages.SOPs ||
    OwnerPages.SOP ||
    OwnerPages.Sops ||
    OwnerPages.SOPPage ||
    OwnerPages.SOPsPage ||
    OwnerPages.SOPTemplates ||
    OwnerPages.SOPLibrary ||
    OwnerPages.StandardOperatingProcedures ||
    (() => <MissingPage pageName="SOPs" />);

  const MessagesPage =
    OwnerPages.Messages ||
    OwnerPages.MessagesPage ||
    (() => <MissingPage pageName="Messages" />);

  const SettingsPage =
    OwnerPages.Settings ||
    OwnerPages.SettingsPage ||
    (() => <MissingPage pageName="Settings" />);

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
          <OwnerReportPage
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "tax-reserve":
      case "taxReserve":
        return (
          <TaxReservePage
            monthFilter={monthFilter}
            propFilter={propFilter}
          />
        );

      case "sops":
      case "SOPs":
      case "sop":
      case "SOP":
        return <SOPsPage />;

      case "messages":
        return <MessagesPage />;

      case "settings":
      case "account":
      case "my-account":
        return <SettingsPage />;

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

          <div className="page-scroll-frame">
            {renderPage()}
          </div>
        </main>
      </div>
    </AppProvider>
  );
}
