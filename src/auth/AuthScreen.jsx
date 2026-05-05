import React, { useMemo, useState } from "react";
import { Building2, Eye, EyeOff, Home, KeyRound, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { useAuth } from "./AuthContext.jsx";

const SIGNUP_ROLES = [
  { value: "host", label: "Host", icon: Home },
  { value: "property_manager", label: "Property Manager", icon: Building2 },
  { value: "owner", label: "Property Owner", icon: ShieldCheck },
  { value: "cleaner", label: "Cleaner", icon: Sparkles },
  { value: "maintenance", label: "Maintenance", icon: Wrench },
];

export default function AuthScreen() {
  const { signIn, signUp, sendPasswordReset, updatePassword } = useAuth();
  const path = window.location.pathname;
  const [mode, setMode] = useState(path === "/reset-password" ? "reset" : path === "/worker-login" ? "worker-login" : "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [hostName, setHostName] = useState("");
  const [requestedRole, setRequestedRole] = useState("host");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const isSignup = mode === "signup";
  const isWorker = mode === "worker-login";
  const isForgot = mode === "forgot";
  const isReset = mode === "reset";

  const title = useMemo(() => {
    if (isWorker) return "Worker Portal";
    if (isSignup) return "Create your account";
    if (isForgot) return "Forgot password";
    if (isReset) return "Reset password";
    return "Log in to Host Kit";
  }, [isWorker, isSignup, isForgot, isReset]);

  const switchMode = (next) => { setMode(next); setError(""); setMessage(""); setPassword(""); setConfirmPassword(""); };

  const onSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(""); setMessage("");
    try {
      if (isForgot) {
        if (!email) throw new Error("Enter your email first.");
        await sendPasswordReset(email);
        setMessage("Password reset email sent. Check your inbox.");
      } else if (isReset) {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        if (password !== confirmPassword) throw new Error("Passwords do not match.");
        await updatePassword(password);
        setMessage("Password updated successfully. Redirecting to login...");
        setTimeout(() => { window.history.replaceState({}, "", "/"); window.location.reload(); }, 1000);
      } else if (isSignup) {
        await signUp({ email, password, businessName, hostName, requestedRole });
        setMessage("Account created. Your account is pending approval. You will be able to access Host Kit after approval.");
        switchMode("login");
      } else {
        await signIn({ email, password });
      }
    } catch (err) { setError(err?.message || "Something went wrong."); } finally { setSubmitting(false); }
  };

  return <div className="auth-shell"><div className="auth-shell-inner"><section className="auth-brand-panel"><h1>Host Kit</h1><p>{isWorker ? "View assigned cleaning tasks and maintenance work orders." : "Run short-term rental operations from one secure workspace."}</p></section><section className="auth-form-panel"><div className="auth-form-card"><h2>{title}</h2>{error && <div className="auth-message error">{error}</div>}{message && <div className="auth-message success">{message}</div>}<form onSubmit={onSubmit} className="auth-clean-form">{isSignup && <><label><span>Full Name</span><input value={hostName} onChange={(e)=>setHostName(e.target.value)} /></label><label><span>Business Name</span><input value={businessName} onChange={(e)=>setBusinessName(e.target.value)} /></label><label><span>Requested Role</span><select value={requestedRole} onChange={(e)=>setRequestedRole(e.target.value)}>{SIGNUP_ROLES.map((r)=><option key={r.value} value={r.value}>{r.label}</option>)}</select></label></>}{!isReset && <label><span>Email</span><input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} /></label>}{!isForgot && <label><span>{isReset ? "New Password" : "Password"}</span><div className="auth-password-field"><input type={showPassword ? "text" : "password"} required value={password} onChange={(e)=>setPassword(e.target.value)} /><button type="button" className="auth-password-toggle" onClick={()=>setShowPassword((s)=>!s)}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>}{isReset && <label><span>Confirm New Password</span><input type="password" required value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} /></label>}<button className="auth-primary-button" disabled={submitting}>{submitting ? "Please wait..." : "Continue"}</button></form><div className="auth-footer-links">{mode === "login" && <><button type="button" onClick={()=>switchMode("forgot")}>Forgot password?</button><button type="button" onClick={()=>switchMode("signup")}>Create account</button><button type="button" onClick={()=>switchMode("worker-login")}>Worker login</button></>}{mode === "worker-login" && <button type="button" onClick={()=>switchMode("login")}>Back to main login</button>}{mode === "signup" && <button type="button" onClick={()=>switchMode("login")}>Already have an account?</button>}{mode === "forgot" && <button type="button" onClick={()=>switchMode("login")}>Back to login</button>}</div></div></section></div></div>;
}
