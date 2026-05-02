import React, { useState } from "react";
import { useAuth } from "./AuthContext.jsx";

export default function AuthScreen() {
  const { signIn, signUp, sendPasswordReset } = useAuth();

  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [hostName, setHostName] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSignup = mode === "signup";

  const clearMessages = () => {
    setMessage("");
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    clearMessages();

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
        setShowPassword(false);
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

  const handlePasswordReset = async () => {
    setSubmitting(true);
    clearMessages();

    try {
      if (!email) {
        throw new Error("Enter your email first, then click forgot password.");
      }

      await sendPasswordReset(email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err?.message || "Could not send password reset email.");
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setShowPassword(false);
    clearMessages();
  };

  return (
    <div className="auth-shell">
      <div className="auth-shell-inner">
        <section className="auth-brand-panel">
          <div className="auth-logo-block">
            <div className="auth-logo-mark">🇯🇲</div>
            <div>
              <div className="auth-logo-title">Host Operations</div>
              <div className="auth-logo-subtitle">Jamaica Airbnb Kit</div>
            </div>
          </div>

          <div className="auth-hero-copy">
            <div className="auth-kicker">Private SaaS Dashboard</div>

            <h1>Run every Airbnb property from one organized dashboard.</h1>

            <p>
              Track bookings, guests, cleaning, supplies, expenses, owner
              reports, and Tax/GCT planning records from a secure cloud-based
              workspace built for Jamaican hosts and property managers.
            </p>
          </div>

          <div className="auth-benefit-grid">
            <div className="auth-benefit-card">
              <span>01</span>
              <strong>Private account</strong>
              <p>Each host sees only their own rentals and records.</p>
            </div>

            <div className="auth-benefit-card">
              <span>02</span>
              <strong>Cloud storage</strong>
              <p>Your data saves to Supabase, not just one browser.</p>
            </div>

            <div className="auth-benefit-card">
              <span>03</span>
              <strong>Host-ready</strong>
              <p>Built for villas, apartments, co-hosts, and managers.</p>
            </div>
          </div>

          <div className="auth-note-card">
            <strong>Built for Jamaican short-term rentals.</strong>
            <p>
              Use it for Airbnb, Booking.com, direct bookings, WhatsApp leads,
              owner reporting, cleaning tasks, and monthly profit tracking.
            </p>
          </div>
        </section>

        <section className="auth-form-panel">
          <div className="auth-form-card">
            <div className="auth-form-top">
              <div className="auth-form-icon">→</div>
              <div>
                <h2>
                  {isSignup
                    ? "Create your host account"
                    : "Log in to your dashboard"}
                </h2>
                <p>
                  {isSignup
                    ? "Start your private workspace for managing short-term rental operations."
                    : "Access your private Jamaica Airbnb Host Operations Kit."}
                </p>
              </div>
            </div>

            <div className="auth-mode-toggle">
              <button
                type="button"
                className={!isSignup ? "active" : ""}
                onClick={() => switchMode("login")}
              >
                Log In
              </button>
              <button
                type="button"
                className={isSignup ? "active" : ""}
                onClick={() => switchMode("signup")}
              >
                Create Account
              </button>
            </div>

            {error && <div className="auth-message error">{error}</div>}
            {message && <div className="auth-message success">{message}</div>}

            <form onSubmit={handleSubmit} className="auth-clean-form">
              {isSignup && (
                <>
                  <label>
                    <span>Business Name</span>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(event) => setBusinessName(event.target.value)}
                      placeholder="Your Hospitality Co."
                    />
                  </label>

                  <label>
                    <span>Host Name</span>
                    <input
                      type="text"
                      value={hostName}
                      onChange={(event) => setHostName(event.target.value)}
                      placeholder="Your name"
                    />
                  </label>
                </>
              )}

              <label>
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="host@email.com"
                  autoComplete="email"
                  required
                />
              </label>

              <label>
                <span>Password</span>

                <div
                  className="auth-password-field"
                  style={{
                    position: "relative",
                    width: "100%",
                  }}
                >
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Minimum 6 characters"
                    autoComplete={
                      isSignup ? "new-password" : "current-password"
                    }
                    required
                    style={{
                      width: "100%",
                      paddingRight: "48px",
                    }}
                  />

                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    title={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "18px",
                      lineHeight: "1",
                      padding: "0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {showPassword ? "🙈" : "👁️"}
                  </button>
                </div>
              </label>

              <button
                type="submit"
                className="auth-primary-button"
                disabled={submitting}
              >
                {submitting
                  ? isSignup
                    ? "Creating account..."
                    : "Logging in..."
                  : isSignup
                  ? "Create Account"
                  : "Log In"}
              </button>
            </form>

            <div className="auth-footer-actions">
              {!isSignup && (
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={submitting}
                >
                  Forgot password?
                </button>
              )}

              {isSignup ? (
                <button type="button" onClick={() => switchMode("login")}>
                  Already have an account? Log in
                </button>
              ) : (
                <button type="button" onClick={() => switchMode("signup")}>
                  New host? Create an account
                </button>
              )}
            </div>

            <div className="auth-security-note">
              Secure login powered by Supabase Auth. Your password is never
              displayed or stored inside the dashboard.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
