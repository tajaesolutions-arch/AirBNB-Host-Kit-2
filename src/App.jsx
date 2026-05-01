import React from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import AuthScreen from "./auth/AuthScreen.jsx";
import DashboardApp from "./DashboardApp.jsx";
import "./styles.css";

function LoadingScreen() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      Loading your dashboard...
    </div>
  );
}

function AppGate() {
  const { user, session, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user && !session) {
    return <AuthScreen />;
  }

  return <DashboardApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppGate />
    </AuthProvider>
  );
}
