import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

const AuthContext = createContext(null);
const LOCAL_MODE_USER = { id: "local", email: "local" };

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const ensureProfile = async (authUser) => {
    if (!supabase || !authUser) return null;

    try {
      const { data: existingProfile, error: selectError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (selectError && selectError.code !== "PGRST116") {
        throw selectError;
      }

      if (existingProfile) {
        return existingProfile;
      }

      const newProfile = {
        id: authUser.id,
        email: authUser.email,
        business_name:
          authUser.user_metadata?.business_name || "Your Hospitality Co.",
        host_name: authUser.user_metadata?.host_name || "Your Host Name",
        phone: "",
        default_currency: "JMD",
        default_tax_reserve_percentage: 0.15,
        default_management_fee_percentage: 0.15,
        onboarding_completed: false,
        onboarding_choice: null,
        onboarded_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdProfile, error: insertError } = await supabase
        .from("profiles")
        .upsert(newProfile, { onConflict: "id" })
        .select("*")
        .single();

      if (insertError) throw insertError;

      return createdProfile;
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    let mounted = true;

    const safetyTimer = window.setTimeout(() => {
      if (mounted) {
        setLoading(false);
      }
    }, 5000);

    const loadSession = async () => {
      try {
        setLoading(true);
        setAuthError("");

        if (!isSupabaseConfigured || !supabase) {
          setSession(null);
          setUser(LOCAL_MODE_USER);
          setProfile(null);
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        const currentSession = data?.session || null;
        const currentUser = currentSession?.user || null;

        if (!mounted) return;

        setSession(currentSession);
        setUser(currentUser);

        if (currentUser) {
          setProfileLoading(true);
          try {
            const nextProfile = await ensureProfile(currentUser);
            if (mounted) {
              setProfile(nextProfile);
            }
          } finally {
            if (mounted) setProfileLoading(false);
          }
        } else {
          setProfile(null);
          setProfileLoading(false);
        }
      } catch (err) {
        console.error("Auth session error:", err?.message || err);

        if (mounted) {
          setAuthError(
            err?.message || "Could not check your login session. Please refresh."
          );
          setSession(null);
          setUser(null);
          setProfile(null);
          setProfileLoading(false);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadSession();

    let subscription;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(
        async (_event, nextSession) => {
          try {
            const nextUser = nextSession?.user || null;

            setSession(nextSession);
            setUser(nextUser);

            if (nextUser) {
              setProfileLoading(true);
              try {
                const nextProfile = await ensureProfile(nextUser);
                if (mounted) setProfile(nextProfile);
              } finally {
                if (mounted) setProfileLoading(false);
              }
            } else {
              setProfile(null);
              setProfileLoading(false);
            }

            setAuthError("");
          } catch (err) {
            console.error("Auth state change error:", err?.message || err);
            setAuthError(err?.message || "Authentication error.");
            setProfileLoading(false);
          } finally {
            setLoading(false);
          }
        }
      );

      subscription = data?.subscription;
    }

    return () => {
      mounted = false;
      window.clearTimeout(safetyTimer);
      subscription?.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setSession(data.session);
    setUser(data.user);

    if (data.user) {
      setProfileLoading(true);
      try {
        setProfile(await ensureProfile(data.user));
      } finally {
        setProfileLoading(false);
      }
    }

    return data;
  };

  const signUp = async ({ email, password, businessName, hostName }) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          business_name: businessName || "",
          host_name: hostName || "",
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      setProfileLoading(true);
      try {
        setProfile(await ensureProfile(data.user));
      } finally {
        setProfileLoading(false);
      }
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }

    return data;
  };

  const signOut = async () => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }

    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const sendPasswordReset = async (email) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }

    const redirectTo = window.location.origin;

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw error;

    return data;
  };

  const updatePassword = async (newPassword) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return data;
  };

  const updateProfile = async (updates) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }

    if (!user) {
      throw new Error("You must be logged in to update your profile.");
    }

    const payload = {
      ...updates,
      id: user.id,
      email: user.email,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) throw error;

    setProfile(data);
    return data;
  };

  const completeOnboarding = async (choice) => {
    if (!user) throw new Error("You must be logged in.");
    if (choice !== "fresh" && choice !== "sample") {
      throw new Error("Invalid onboarding choice.");
    }
    return updateProfile({
      onboarding_completed: true,
      onboarding_choice: choice,
      onboarded_at: new Date().toISOString(),
    });
  };

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      profileLoading,
      loading,
      authError,
      isSupabaseConfigured,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      updateProfile,
      completeOnboarding,
    }),
    [session, user, profile, profileLoading, loading, authError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return ctx;
}
