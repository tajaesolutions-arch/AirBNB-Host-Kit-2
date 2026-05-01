import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";
import { DEFAULT_SETTINGS } from "../data/sampleData.js";

const AuthContext = createContext(null);

const defaultProfileFromUser = (user) => ({
  id: user.id,
  email: user.email || "",
  business_name: DEFAULT_SETTINGS.business_name || "Your Hospitality Co.",
  host_name: DEFAULT_SETTINGS.host_name || "Your Host Name",
  phone: DEFAULT_SETTINGS.host_phone || "",
  default_currency: DEFAULT_SETTINGS.default_currency || "JMD",
  default_tax_reserve_percentage: DEFAULT_SETTINGS.tax_reserve_percentage || 0.15,
  default_management_fee_percentage: DEFAULT_SETTINGS.management_fee_percentage || 0.15,
});

async function ensureProfile(user) {
  if (!supabase || !user) return null;

  const { data: existing, error: selectError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (selectError && selectError.code !== "PGRST116") throw selectError;
  if (existing) return existing;

  const profile = defaultProfileFromUser(user);
  const { data, error } = await supabase
    .from("profiles")
    .insert(profile)
    .select("*")
    .single();

  if (error) throw error;
  return data;
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setLoading(false);
          setError("Supabase environment variables are missing.");
        }
        return;
      }

      try {
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        const nextSession = data.session;
        const nextUser = nextSession?.user || null;

        if (!isMounted) return;
        setSession(nextSession);
        setUser(nextUser);

        if (nextUser) {
          const nextProfile = await ensureProfile(nextUser);
          if (isMounted) setProfile(nextProfile);
        }
      } catch (err) {
        if (isMounted) setError(err.message || "Could not load user session.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    boot();

    if (!supabase) return () => { isMounted = false; };

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      const nextUser = nextSession?.user || null;
      setSession(nextSession);
      setUser(nextUser);
      setError("");

      if (nextUser) {
        try {
          const nextProfile = await ensureProfile(nextUser);
          setProfile(nextProfile);
        } catch (err) {
          setError(err.message || "Could not load profile.");
        }
      } else {
        setProfile(null);
      }
    });

    return () => {
      isMounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  const signUp = async ({ email, password, businessName, hostName }) => {
    if (!supabase) throw new Error("Supabase is not configured.");

    const { data, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName || "",
          host_name: hostName || "",
        },
      },
    });

    if (authError) throw authError;

    if (data.user) {
      const profile = {
        id: data.user.id,
        email: data.user.email || email,
        business_name: businessName || DEFAULT_SETTINGS.business_name || "Your Hospitality Co.",
        host_name: hostName || DEFAULT_SETTINGS.host_name || "Your Host Name",
        phone: "",
        default_currency: DEFAULT_SETTINGS.default_currency || "JMD",
        default_tax_reserve_percentage: DEFAULT_SETTINGS.tax_reserve_percentage || 0.15,
        default_management_fee_percentage: DEFAULT_SETTINGS.management_fee_percentage || 0.15,
      };

      const { error: profileError } = await supabase.from("profiles").upsert(profile, { onConflict: "id" });
      if (profileError) {
        // If email confirmation is enabled, profile creation will happen after first login.
        console.warn("Profile upsert skipped until login:", profileError.message);
      }
    }

    return data;
  };

  const signIn = async ({ email, password }) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) throw authError;
    return data;
  };

  const signOut = async () => {
    if (!supabase) return;
    const { error: signOutError } = await supabase.auth.signOut();
    if (signOutError) throw signOutError;
  };

  const resetPassword = async (email) => {
    if (!supabase) throw new Error("Supabase is not configured.");
    const redirectTo = typeof window !== "undefined" ? `${window.location.origin}` : undefined;
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (resetError) throw resetError;
  };

  const updateProfile = async (updates) => {
    if (!supabase || !user) throw new Error("You must be logged in.");
    const payload = { ...updates, id: user.id, email: user.email || updates.email || "" };
    const { data, error: updateError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();
    if (updateError) throw updateError;
    setProfile(data);
    return data;
  };

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    error,
    isConfigured: isSupabaseConfigured,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updateProfile,
  }), [session, user, profile, loading, error]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
