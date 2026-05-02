import { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";

import Dashboard from "./pages/Dashboard.jsx";
import Bookings from "./pages/Bookings.jsx";
import Account from "./pages/Account.jsx";
import { Guests, Cleaning, Maintenance } from "./pages/GuestsCleaningMaintenance.jsx";
import { Supplies, Revenue, Leads } from "./pages/SuppliesRevenuLeads.jsx";
import {
  OwnerReport,
  TaxReserve,
  SOPs,
  Messages,
  Settings,
} from "./pages/OwnerReportTaxSOPsMessagesSettings.jsx";

import "./styles.css";

const currentMonth = () => new Date().toISOString().slice(0, 7);

function LoadingScreen({ label = "Loading your host dashboard…" }) {
  return <div className="loading-screen">{label}</div>;
}

function DashboardShell() {
  const [page, setPage] = useState("dashboard");
  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [propFilter, setPropFilter] = useState("ALL");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const { loading, error, saving } = useApp();

  const closeSidebar = () => setSidebarOpen(false);

  const renderPage = () => {
    const shared = { monthFilter, propFilter, setPage };

    switch (page) {
      case "dashboard":
        return <Dashboard {...shared} />;
      case "bookings":
        return <Bookings {...shared} />;
      case "guests":
        return <Guests {...shared} />;
      case "cleaning":
        return <Cleaning {...shared} />;
      case "maintenance":
        return <Maintenance {...shared} />;
      case "supplies":
        return <Supplies {...shared} />;
      case "revenue":
        return <Revenue {...shared} />;
      case "leads":
        return <Leads {...shared} />;
      case "owner":
        return <OwnerReport {...shared} />;
      case "tax":
        return <TaxReserve {...shared} />;
      case "sops":
        return <SOPs {...shared} />;
      case "messages":
        return <Messages {...shared} />;
      case "settings":
        return <Settings {...shared} />;
      case "account":
        return <Account {...shared} />;
      default:
        return <Dashboard {...shared} />;
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="app-layout">
      <Sidebar
        page={page}
        setPage={(nextPage) => {
          setPage(nextPage);
          closeSidebar();
        }}
      />

      {sidebarOpen && (
        <>
          <div className="sidebar-overlay open" onClick={closeSidebar} />
          <Sidebar
            page={page}
            setPage={(nextPage) => {
              setPage(nextPage);
              closeSidebar();
            }}
            mobile
            onClose={closeSidebar}
          />
        </>
      )}

      <div className="main-content">
        <TopBar
          monthFilter={monthFilter}
          setMonthFilter={setMonthFilter}
          propFilter={propFilter}
          setPropFilter={setPropFilter}
          onMenuClick={() => setSidebarOpen(true)}
        />

        <div className="account-toolbar">
          <button className="btn-secondary" onClick={() => setPage("account")}>
            My Account
          </button>
        </div>

        {error && <div className="app-error-bar">{error}</div>}
        {saving && <div className="app-saving-bar">Saving changes…</div>}

        <main>{renderPage()}</main>
      </div>
    </div>
  );
}

function AuthGate() {
  const { user, loading, authError } = useAuth();

  if (loading) {
    return <LoadingScreen label="Checking your secure session…" />;
  }

  if (authError) {
    return (
      <div className="loading-screen" style={{ padding: 24, textAlign: "center" }}>
        <div>
          <strong>Authentication Setup Issue</strong>
          <p style={{ marginTop: 8, maxWidth: 520 }}>{authError}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return (
    <AppProvider>
      <DashboardShell />
    </AppProvider>
  );
}
