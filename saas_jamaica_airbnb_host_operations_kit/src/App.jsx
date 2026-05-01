import { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import Sidebar from "./components/Sidebar.jsx";
import TopBar from "./components/TopBar.jsx";

// Pages
import Dashboard from "./pages/Dashboard.jsx";
import Bookings from "./pages/Bookings.jsx";
import { Guests, Cleaning, Maintenance } from "./pages/GuestsCleaningMaintenance.jsx";
import { Supplies, Revenue, Leads } from "./pages/SuppliesRevenuLeads.jsx";
import {
  OwnerReport, TaxReserve, SOPs, Messages, Settings,
} from "./pages/OwnerReportTaxSOPsMessagesSettings.jsx";

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
      case "dashboard": return <Dashboard {...shared} />;
      case "bookings": return <Bookings {...shared} />;
      case "guests": return <Guests {...shared} />;
      case "cleaning": return <Cleaning {...shared} />;
      case "maintenance": return <Maintenance {...shared} />;
      case "supplies": return <Supplies {...shared} />;
      case "revenue": return <Revenue {...shared} />;
      case "leads": return <Leads {...shared} />;
      case "owner": return <OwnerReport {...shared} />;
      case "tax": return <TaxReserve {...shared} />;
      case "sops": return <SOPs {...shared} />;
      case "messages": return <Messages {...shared} />;
      case "settings": return <Settings {...shared} />;
      default: return <Dashboard {...shared} />;
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="app-layout">
      <Sidebar page={page} setPage={(p) => { setPage(p); closeSidebar(); }} />

      {sidebarOpen && (
        <>
          <div className="sidebar-overlay open" onClick={closeSidebar} />
          <Sidebar
            page={page}
            setPage={(p) => { setPage(p); closeSidebar(); }}
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
        {error && <div className="app-error-bar">{error}</div>}
        {saving && <div className="app-saving-bar">Saving changes…</div>}
        <main>{renderPage()}</main>
      </div>
    </div>
  );
}

function AuthGate() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen label="Checking your secure session…" />;
  if (!user) return <AuthScreen />;
  return (
    <AppProvider>
      <DashboardShell />
    </AppProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
