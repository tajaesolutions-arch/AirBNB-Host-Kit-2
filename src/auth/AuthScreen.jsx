import { useState } from "react";
import { LockKeyhole, Mail, UserPlus, LogIn, Building2, AlertTriangle } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";
import { getMissingSupabaseMessage } from "../lib/supabaseClient.js";

export default function AuthScreen() {
  const { signIn, signUp, resetPassword, isConfigured } = useAuth();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [hostName, setHostName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const clearNotices = () => { setMessage(""); setError(""); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearNotices();
    setLoading(true);

    try {
      if (mode === "signup") {
        await signUp({ email, password, businessName, hostName });
        setMessage("Account created. If email confirmation is enabled, check your inbox before logging in.");
        setMode("login");
      } else if (mode === "forgot") {
        await resetPassword(email);
        setMessage("Password reset email sent. Check your inbox.");
        setMode("login");
      } else {
        await signIn({ email, password });
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <div className="auth-brand-panel">
          <div className="auth-badge">🇯🇲 Jamaica STR SaaS</div>
          <h1>Run every Airbnb property from one private dashboard.</h1>
          <p>
            Each host gets their own login, private properties, bookings, guests, expenses, cleaning tasks,
            supplies, owner reports, and Tax/GCT planning records.
          </p>
          <div className="auth-feature-grid">
            <div><strong>Private data</strong><span>Each user only sees their own rentals.</span></div>
            <div><strong>Cloud storage</strong><span>Data is stored in Supabase, not just one browser.</span></div>
            <div><strong>Host-ready</strong><span>Built for Jamaican villas, apartments, and co-hosts.</span></div>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-card-icon">
            {mode === "signup" ? <UserPlus size={24} /> : mode === "forgot" ? <Mail size={24} /> : <LogIn size={24} />}
          </div>
          <h2>{mode === "signup" ? "Create your host account" : mode === "forgot" ? "Reset your password" : "Log in to your dashboard"}</h2>
          <p className="auth-subtitle">
            {mode === "signup"
              ? "Set up a private workspace for your Airbnb, villa, or short-term rental operation."
              : mode === "forgot"
                ? "Enter your email and we’ll send reset instructions."
                : "Access your private Jamaica Airbnb Host Operations Kit."}
          </p>

          {!isConfigured && (
            <div className="auth-alert">
              <AlertTriangle size={16} />
              <span>{getMissingSupabaseMessage()}</span>
            </div>
          )}

          {message && <div className="auth-success">{message}</div>}
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit} className="auth-form">
            {mode === "signup" && (
              <>
                <label>
                  <span>Business name</span>
                  <div className="auth-input-wrap"><Building2 size={16} /><input value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Island Stay Management" /></div>
                </label>
                <label>
                  <span>Host name</span>
                  <div className="auth-input-wrap"><UserPlus size={16} /><input value={hostName} onChange={e => setHostName(e.target.value)} placeholder="e.g. Diour Buchanan" /></div>
                </label>
              </>
            )}

            <label>
              <span>Email</span>
              <div className="auth-input-wrap"><Mail size={16} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="host@email.com" required /></div>
            </label>

            {mode !== "forgot" && (
              <label>
                <span>Password</span>
                <div className="auth-input-wrap"><LockKeyhole size={16} /><input type="password" minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 6 characters" required /></div>
              </label>
            )}

            <button className="btn-primary auth-submit" disabled={loading || !isConfigured}>
              {loading ? "Please wait…" : mode === "signup" ? "Create Account" : mode === "forgot" ? "Send Reset Email" : "Log In"}
            </button>
          </form>

          <div className="auth-links">
            {mode !== "login" && <button className="btn-ghost" onClick={() => { clearNotices(); setMode("login"); }}>Back to login</button>}
            {mode !== "signup" && <button className="btn-ghost" onClick={() => { clearNotices(); setMode("signup"); }}>Create account</button>}
            {mode !== "forgot" && <button className="btn-ghost" onClick={() => { clearNotices(); setMode("forgot"); }}>Forgot password?</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
