import { useState } from "react";
import { AppProvider } from "./context/AppContext.jsx";
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

// Default month = current YYYY-MM
const currentMonth = () => new Date().toISOString().slice(0, 7);

export default function App() {
  const [page, setPage]               = useState("dashboard");
  const [monthFilter, setMonthFilter] = useState(currentMonth());
  const [propFilter, setPropFilter]   = useState("ALL");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const renderPage = () => {
    const shared = { monthFilter, propFilter, setPage };
    switch (page) {
      case "dashboard":   return <Dashboard   {...shared} />;
      case "bookings":    return <Bookings    {...shared} />;
      case "guests":      return <Guests      {...shared} />;
      case "cleaning":    return <Cleaning    {...shared} />;
      case "maintenance": return <Maintenance {...shared} />;
      case "supplies":    return <Supplies    {...shared} />;
      case "revenue":     return <Revenue     {...shared} />;
      case "leads":       return <Leads       {...shared} />;
      case "owner":       return <OwnerReport {...shared} />;
      case "tax":         return <TaxReserve  {...shared} />;
      case "sops":        return <SOPs        {...shared} />;
      case "messages":    return <Messages    {...shared} />;
      case "settings":    return <Settings    {...shared} />;
      default:            return <Dashboard   {...shared} />;
    }
  };

  return (
    <AppProvider>
      <div className="app-layout">
        {/* Desktop sidebar (always visible) */}
        <Sidebar page={page} setPage={(p) => { setPage(p); closeSidebar(); }} />

        {/* Mobile sidebar (overlay) */}
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
          <main>{renderPage()}</main>
        </div>
      </div>
    </AppProvider>
  );
}
