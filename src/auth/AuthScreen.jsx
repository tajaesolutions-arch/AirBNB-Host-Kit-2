import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [hostName, setHostName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (event) => {
    event.preventDefault();

    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (!email || !password) {
        throw new Error("Please enter your email and password.");
      }

      if (password.length < 6) {
        throw new Error("Password must be at least 6 characters.");
      }

      if (isSignup) {
        const result = await signUp({
          email,
          password,
          businessName,
          hostName,
        });

        if (result?.session) {
          setMessage("");
          return;
        }

        setMessage(
          "Account created. If email confirmation is turned on, check your inbox before logging in."
        );
        setMode("login");
      } else {
        await signIn({
          email,
          password,
        });
      }
    } catch (err) {
      setError(err?.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-badge">🇯🇲 Jamaica STR SaaS</div>

        <h1>Run every Airbnb property from one private dashboard.</h1>

        <p>
          Each host gets their own login, private properties, bookings, guests,
          expenses, cleaning tasks, supplies, owner reports, and Tax/GCT planning
          records.
        </p>

        <div className="auth-feature-grid">
          <div className="auth-feature-card">
            <strong>Private data</strong>
            <span>Each user only sees their own rentals.</span>
          </div>

          <div className="auth-feature-card">
            <strong>Cloud storage</strong>
            <span>Data is stored in Supabase, not just one browser.</span>
          </div>

          <div className="auth-feature-card">
            <strong>Host-ready</strong>
            <span>Built for Jamaican villas, apartments, and co-hosts.</span>
          </div>
        </div>
      </div>

      <div className="auth-card">
        <div className="auth-icon">→</div>

        <h2>{isSignup ? "Create your account" : "Log in to your dashboard"}</h2>

        <p className="auth-subtitle">
          {isSignup
            ? "Create a private workspace for your short-term rental operations."
            : "Access your private Jamaica Airbnb Host Operations Kit."}
        </p>

        {error && (
          <div className="auth-alert error">
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="auth-alert success">
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <>
              <label>
                <span>Business Name</span>
                <div className="auth-input-wrap">
                  <input
                    type="text"
                    value={businessName}
                    onChange={(event) => setBusinessName(event.target.value)}
                    placeholder="Your Hospitality Co."
                  />
                </div>
              </label>

              <label>
                <span>Host Name</span>
                <div className="auth-input-wrap">
                  <input
                    type="text"
                    value={hostName}
                    onChange={(event) => setHostName(event.target.value)}
                    placeholder="Your name"
                  />
                </div>
              </label>
            </>
          )}

          <label>
            <span>Email</span>
            <div className="auth-input-wrap">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="host@email.com"
                autoComplete="email"
                required
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="auth-input-wrap">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Minimum 6 characters"
                autoComplete={isSignup ? "new-password" : "current-password"}
                required
              />
            </div>
          </label>

          <button type="submit" className="auth-submit" disabled={submitting}>
            {submitting
              ? isSignup
                ? "Creating account..."
                : "Logging in..."
              : isSignup
              ? "Create Account"
              : "Log In"}
          </button>
        </form>

        <div className="auth-switch-row">
          {isSignup ? (
            <button type="button" onClick={() => setMode("login")}>
              Already have an account? Log in
            </button>
          ) : (
            <button type="button" onClick={() => setMode("signup")}>
              Create account
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
