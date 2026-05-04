import React, { useMemo, useState } from "react";
import {
  LogOut,
  ShieldCheck,
  Mail,
  KeyRound,
  UserRound,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Account() {
  const {
    user,
    profile,
    signOut,
    sendPasswordReset,
    updatePassword,
    updateProfile,
    effectiveRole,
    assignedPropertyIds,
    permissions,
  } = useAuth();

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [businessName, setBusinessName] = useState(
    profile?.business_name || ""
  );
  const [hostName, setHostName] = useState(profile?.host_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");

  const createdAt = useMemo(() => {
    if (!user?.created_at) return "Not available";

    try {
      return new Date(user.created_at).toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return user.created_at;
    }
  }, [user]);

  const copyUserId = async () => {
    if (!user?.id) return;

    await navigator.clipboard.writeText(user.id);
    setMessage("Account ID copied.");
    setError("");
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await updateProfile({
        business_name: businessName,
        host_name: hostName,
        phone,
        default_currency: profile?.default_currency || "JMD",
        default_tax_reserve_percentage:
          profile?.default_tax_reserve_percentage || 0.15,
        default_management_fee_percentage:
          profile?.default_management_fee_percentage || 0.15,
      });

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err?.message || "Could not update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordResetEmail = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await sendPasswordReset(user.email);
      setMessage("Password reset email sent. Check your inbox.");
    } catch (err) {
      setError(err?.message || "Could not send password reset email.");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!newPassword || newPassword.length < 6) {
        throw new Error("New password must be at least 6 characters.");
      }

      await updatePassword(newPassword);
      setNewPassword("");
      setMessage("Password updated successfully.");
    } catch (err) {
      setError(err?.message || "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await signOut();
    } catch (err) {
      setError(err?.message || "Could not log out.");
      setSaving(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">My Account</h1>
            <p className="page-subtitle">
              Manage your login, profile details, password, and account security
              for your secure Host Kit workspace.
            </p>
          </div>

          <button className="btn-danger" onClick={handleLogout} disabled={saving}>
            <LogOut size={16} />
            Log Out
          </button>
        </div>

        <div className="page-helper">
          <ShieldCheck size={16} />
          <span>
            Your account is powered by Supabase Auth. Your password is never
            displayed inside the dashboard. Use password reset or change password
            to manage account access.
          </span>
        </div>
      </div>

      {message && (
        <div className="account-alert success">
          <CheckCircle2 size={16} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="account-alert error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}


      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px,1fr))", gap: 12 }}>
          <div><strong>Active role</strong><div>{effectiveRole || "host"}</div></div>
          <div><strong>Assigned properties</strong><div>{assignedPropertyIds?.length || 0}</div></div>
          <div><strong>Financial access</strong><div>{permissions?.can_view_financials || permissions?.isHostLike ? "Yes" : "No"}</div></div>
          <div><strong>Edit operations</strong><div>{permissions?.can_edit_operations || permissions?.isHostLike ? "Yes" : "No"}</div></div>
          <div><strong>Approve maintenance</strong><div>{permissions?.can_approve_maintenance || permissions?.isHostLike ? "Yes" : "No"}</div></div>
        </div>
      </div>

      <div className="account-grid">
        <section className="card account-card">
          <div className="account-card-header">
            <UserRound size={20} />
            <div>
              <h2>Account Details</h2>
              <p>Your login identity and account record.</p>
            </div>
          </div>

          <div className="account-detail-row">
            <span>Email</span>
            <strong>{user?.email || "Not available"}</strong>
          </div>

          <div className="account-detail-row">
            <span>Account Created</span>
            <strong>{createdAt}</strong>
          </div>

          <div className="account-detail-row">
            <span>Email Confirmed</span>
            <strong>
              {user?.email_confirmed_at ? "Confirmed" : "Not confirmed"}
            </strong>
          </div>

          <div className="account-detail-row account-id-row">
            <span>Account ID</span>
            <button className="btn-secondary" onClick={copyUserId}>
              <Copy size={14} />
              Copy ID
            </button>
          </div>

          <p className="account-muted">
            Use the Account ID only for support or troubleshooting. Do not share
            sensitive dashboard data publicly.
          </p>
        </section>

        <section className="card account-card">
          <div className="account-card-header">
            <Mail size={20} />
            <div>
              <h2>Host Profile</h2>
              <p>These details help personalize your dashboard.</p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile}>
            <div className="field">
              <label className="field-label">Business Name</label>
              <input
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="Your Hospitality Co."
              />
            </div>

            <div className="field">
              <label className="field-label">Host Name</label>
              <input
                value={hostName}
                onChange={(event) => setHostName(event.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="field">
              <label className="field-label">Phone</label>
              <input
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+1 876 000 0000"
              />
            </div>

            <button className="btn-primary" type="submit" disabled={saving}>
              Save Profile
            </button>
          </form>
        </section>

        <section className="card account-card">
          <div className="account-card-header">
            <KeyRound size={20} />
            <div>
              <h2>Password & Security</h2>
              <p>Reset or update your password securely.</p>
            </div>
          </div>

          <button
            className="btn-secondary"
            onClick={handlePasswordResetEmail}
            disabled={saving}
          >
            <Mail size={15} />
            Send Password Reset Email
          </button>

          <form onSubmit={handleUpdatePassword} className="account-password-form">
            <div className="field">
              <label className="field-label">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimum 6 characters"
              />
              <div className="field-helper">
                This changes the password for the currently logged-in account.
              </div>
            </div>

            <button className="btn-primary" type="submit" disabled={saving}>
              Update Password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
