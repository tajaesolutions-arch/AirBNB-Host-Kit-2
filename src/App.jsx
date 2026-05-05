import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import RoleSelectionScreen from "./auth/RoleSelectionScreen.jsx";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import FirstTimeSetup from "./components/FirstTimeSetup.jsx";
import Sidebar from "./components/Sidebar.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { Menu } from "lucide-react";

import * as DashboardModule from "./pages/Dashboard.jsx";
import * as BookingsModule from "./pages/Bookings.jsx";
import * as GuestCleaningMaintenanceModule from "./pages/GuestsCleaningMaintenance.jsx";
import * as SuppliesRevenueLeadsModule from "./pages/SuppliesRevenuLeads.jsx";
import * as OwnerTaxMessagesSettingsModule from "./pages/OwnerReportTaxSOPsMessagesSettings.jsx";
import * as AccountModule from "./pages/Account.jsx";
import * as SmartToolsModule from "./pages/SmartTools.jsx";
import UsersAccess from "./pages/UsersAccess.jsx";
import PropertyManagerPortal from "./pages/PropertyManagerPortal.jsx";
import CleanerPortal from "./pages/CleanerPortal.jsx";
import OwnerPortal from "./pages/OwnerPortal.jsx";

import "./styles.css";
import { canAccessPage as canAccessByPermissions, getDefaultPageForRole } from "./utils/permissions.js";

const currentMonth = () => new Date().toISOString().slice(0, 7);


const PAGE_TITLES = {
  dashboard: "Dashboard",
  "property-manager": "Property Manager Portal",
  "cleaner-portal": "Cleaner Portal",
  "owner-portal": "Owner Portal",
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
  "smart-tools": "Smart Tools",
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


const SmartTools = pickComponent(
  SmartToolsModule,
  ["SmartTools", "SmartToolsPage"],
  "Smart Tools"
);

function LoadingScreen({ label = "Loading your host dashboard…" }) {
  return <div className="loading-screen">{label}</div>;
}

function LocalModeBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="local-mode-banner" role="status">
      <span>Cloud sync not configured. Data is saved locally in this browser only.</span>
      <button type="button" className="btn-ghost" onClick={() => setDismissed(true)} aria-label="Dismiss local mode notice">Dismiss</button>
    </div>
  );
}

function DashboardShell() {
  const { isSupabaseConfigured, effectiveRole, permissions, assignedPropertyIds, assignedPropertyRecordIds, membershipsLoading, membershipsError, refetchMemberships, isHostLike } = useAuth();
  const role = effectiveRole || "host";
  const roleDefaultPage = getDefaultPageForRole(role);
  const [page, setPage] = useState(() => (canAccessByPermissions("dashboard", permissions || { role }) ? "dashboard" : roleDefaultPage));
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
    const safePage = nextPage;

    if (!canAccessByPermissions(safePage, permissions || { role })) {
      setPage(roleDefaultPage);
      setPageAction({ type: "access-denied", requestedPage: safePage });
      closeMobileSidebar();
      return;
    }

    setPage(safePage);
    setPageAction(action);
    closeMobileSidebar();
  };

  const clearPageAction = () => {
    setPageAction(null);
  };

  useEffect(() => {
    if (!canAccessByPermissions(page, permissions || { role })) {
      setPage(roleDefaultPage);
      setPageAction({ type: "access-denied", requestedPage: page });
    }
  }, [role, page, permissions, roleDefaultPage]);

  const renderPage = () => {
    const safeCurrentPage = page;

    if (!canAccessByPermissions(safeCurrentPage, permissions || { role })) {
      return <Dashboard monthFilter={monthFilter} setMonthFilter={setMonthFilter} propFilter={propFilter} setPropFilter={setPropFilter} setPage={goToPage} pageAction={{ type: "access-denied", requestedPage: safeCurrentPage }} onPageActionHandled={clearPageAction} />;
    }

    const shared = {
      monthFilter,
      setMonthFilter,
      propFilter,
      setPropFilter,
      setPage: goToPage,
      pageAction,
      onPageActionHandled: clearPageAction,
      permissions,
      effectiveRole: role,
      assignedPropertyIds,
      assignedPropertyRecordIds,
      isHostLike,
    };

    switch (page) {
      case "dashboard":
        return <Dashboard {...shared} />;

      case "property-manager":
        return <PropertyManagerPortal {...shared} />;

      case "cleaner-portal":
        return <CleanerPortal {...shared} />;

      case "owner-portal":
        return <OwnerPortal {...shared} />;

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

      case "smart-tools":
      case "smartTools":
        return <SmartTools {...shared} />;

      case "users-access":
      case "admin-users":
        return <UsersAccess {...shared} />;

      case "account":
      case "my-account":
        return <Account {...shared} />;

      default:
        return <Dashboard {...shared} />;
    }
  };

  if (membershipsLoading) return <LoadingScreen label="Loading role access…" />;
  if (membershipsError) {
    return (
      <div className="auth-setup-error">
        <div>
          <strong>Membership access failed to load</strong>
          <p>{membershipsError}</p>
          <button type="button" className="btn" onClick={() => refetchMemberships?.()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
      <div className={`app-shell ${sidebarCollapsed ? "sidebar-collapsed" : ""}`}>
        <Sidebar
          page={page}
          role={role}
          permissions={permissions}
          assignedPropertyCount={assignedPropertyIds?.length || 0}
          setPage={goToPage}
          collapsed={sidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapsed}
        />

        {mobileSidebarOpen && (
          <>
            <div
              className="sidebar-overlay mobile-sidebar-overlay open" data-testid="sidebar-overlay"
              onClick={closeMobileSidebar}
            />

            <Sidebar
              page={page}
              role={role}
              permissions={permissions}
              assignedPropertyCount={assignedPropertyIds?.length || 0}
              setPage={goToPage}
              collapsed={false}
              mobile
              onClose={closeMobileSidebar}
            />
          </>
        )}

        {!mobileSidebarOpen && (
          <button
            className="mobile-hamburger-tab" data-testid="mobile-hamburger"
            onClick={() => setMobileSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu size={16} />
          </button>
        )}

        <ErrorBoundary key={page}>
          <main className="app-main main-content">
            <div className="page-scroll-frame">{!isSupabaseConfigured && <LocalModeBanner />}{renderPage()}</div>
          </main>
        </ErrorBoundary>
      </div>
  );
}


function AccountStatusScreen({ status, email, onSignOut, requestedRole, memberships=[] }) {
  const statusMap = {
    pending: {
      title: "Your account is pending approval",
      body: "Thanks for signing up. Your workspace is waiting for approval before access is enabled.",
    },
    suspended: {
      title: "Your account is suspended",
      body: "This account currently cannot access the dashboard. Contact support if you believe this is a mistake.",
    },
    rejected: {
      title: "Access was not approved",
      body: "This account has not been approved for access to the beta.",
    },
  };

  const content = statusMap[status] || {
    title: "Account access unavailable",
    body: "Your account status does not currently allow dashboard access.",
  };

  return (
    <div className="approval-shell">
      <div className="approval-card">
        <p className="approval-kicker">Account status</p>
        <h1 className="approval-title">{content.title}</h1>
        <p className="approval-body">{content.body}</p>
        <p className="approval-meta">Signed in as: {email || "Unknown email"}</p><p className="approval-meta">Requested role: {requestedRole || "Not provided"}</p><p className="approval-meta">Assigned roles: {[...new Set((memberships||[]).map((m)=>m.access_role))].join(", ") || "None yet"}</p>
        <div className="approval-actions">
          <button type="button" className="btn" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthErrorView({ message, showSignOut }) {
  const { signOut } = useAuth();
  const databaseIssue = /database setup issue|schema cache|could not find|column|relation|violates row-level security|invalid input syntax/i.test(message || "");
  const issueTitle = databaseIssue
    ? "Database Setup Issue"
    : "Authentication Setup Issue";

  const handleSignOut = async () => {
    try {
      await signOut();
      window.location.reload();
    } catch {
      window.location.reload();
    }
  };

  return (
    <div className="auth-setup-error">
      <div>
        <strong>{issueTitle}</strong>
        <p>{databaseIssue ? "The app could not save data because the Supabase database schema does not match the app data model." : message}</p>
        {databaseIssue ? <pre style={{ whiteSpace: "pre-wrap" }}>{message}</pre> : null}
        <div className="row" style={{ gap: 8, marginTop: 12 }}>
          <button type="button" className="btn" onClick={() => window.location.reload()}>
            Retry
          </button>
          {showSignOut ? (
            <button type="button" className="btn-ghost" onClick={handleSignOut}>
              Sign out
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AppDataGate({ children }) {
  const { dataLoading, dataError } = useApp();

  if (dataLoading) return <LoadingScreen label="Loading your workspace…" />;

  if (dataError) {
    return <AuthErrorView message={dataError} showSignOut />;
  }

  return children;
}

function AuthGate() {
  const { user, session, profile, profileLoading, loading, authError, signOut, availableRoles, selectedPortalRole, setSelectedPortalRole, accessNotAssigned, memberships } = useAuth();

  if (loading) {
    return <LoadingScreen label="Checking your secure session…" />;
  }

  if (authError) {
    return <AuthErrorView message={authError} showSignOut={Boolean(user || session)} />;
  }

  if (!user) {
    return <AuthScreen />;
  }

  if (profileLoading || !profile) {
    return <LoadingScreen label="Checking account approval…" />;
  }

  if (profile.account_status !== "approved") {
    return (
      <AccountStatusScreen
        status={profile.account_status}
        email={user.email}
        onSignOut={signOut}
        requestedRole={profile?.requested_role || user?.user_metadata?.requested_role}
        memberships={memberships}
      />
    );
  }

  if (accessNotAssigned) {
    return <div className="approval-shell"><div className="approval-card"><h1 className="approval-title">Access not assigned</h1><p className="approval-body">The portal selected at login is not assigned to your account.</p><p className="approval-meta">Available roles: {availableRoles.join(", ") || "None"}</p><button className="btn" onClick={signOut}>Sign out</button></div></div>;
  }

  if (!selectedPortalRole && availableRoles.length > 1) {
    return <RoleSelectionScreen availableRoles={availableRoles} memberships={memberships} onContinue={setSelectedPortalRole} onSignOut={signOut} />;
  }

  return (
    <AppProvider>
      <AppDataGate>
        <OnboardingGate profile={profile} />
      </AppDataGate>
    </AppProvider>
  );
}

function OnboardingGate({ profile }) {
  const { completeOnboarding } = useAuth();
  const { resetToBlankData, restoreSampleData } = useApp();
  const [onboardingBusy, setOnboardingBusy] = useState("");
  const [onboardingError, setOnboardingError] = useState("");

  const onboardingDone = profile?.onboarding_completed === true;

  const handleFresh = async () => {
    if (onboardingBusy) return;
    setOnboardingBusy("fresh");
    setOnboardingError("");
    try {
      await resetToBlankData();
      await completeOnboarding("fresh");
    } catch (err) {
      setOnboardingError(err?.message || "Could not set up your blank workspace. Please try again.");
    } finally {
      setOnboardingBusy("");
    }
  };
  const handleSample = async () => {
    if (onboardingBusy) return;
    setOnboardingBusy("sample");
    setOnboardingError("");
    try {
      await restoreSampleData();
      await completeOnboarding("sample");
    } catch (err) {
      setOnboardingError(err?.message || "Could not load sample data. Please try again.");
    } finally {
      setOnboardingBusy("");
    }
  };

  return (
    <>
      {!onboardingDone ? (
        <FirstTimeSetup
          loadingChoice={onboardingBusy}
          error={onboardingError}
          onStartFresh={handleFresh}
          onUseSampleData={handleSample}
        />
      ) : (
        <DashboardShell />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
