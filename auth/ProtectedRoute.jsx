import AuthScreen from "./AuthScreen.jsx";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen">Loading your host dashboard…</div>;
  if (!user) return <AuthScreen />;
  return children;
}
