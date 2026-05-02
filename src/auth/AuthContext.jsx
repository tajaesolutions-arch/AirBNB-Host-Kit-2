import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
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
        console.warn("Profile lookup error:", selectError.message);
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdProfile, error: insertError } = await supabase
        .from("profiles")
        .upsert(newProfile, { onConflict: "id" })
        .select("*")
        .single();

      if (insertError) {
        console.warn("Profile creation error:", insertError.message);
        return newProfile;
      }

      return createdProfile;
    } catch (err) {
      console.warn("ensureProfile error:", err?.message || err);
      return null;
    }
  };

  useEffect(() => {
    let mounted = true;

    const safetyTimer = window.setTimeout(() => {
      if (mounted) {
        console.warn("Auth check timed out. Releasing loading state.");
        setLoading(false);
      }
    }, 5000);

    const loadSession = async () => {
      try {
        setLoading(true);
        setAuthError("");

        if (!isSupabaseConfigured || !supabase) {
          setAuthError(
            "Supabase is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel, then redeploy."
          );
          setSession(null);
          setUser(null);
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
          ensureProfile(currentUser).then((nextProfile) => {
            if (mounted) setProfile(nextProfile);
          });
        } else {
          setProfile(null);
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
              ensureProfile(nextUser).then((nextProfile) => {
                if (mounted) setProfile(nextProfile);
              });
            } else {
              setProfile(null);
            }

            setAuthError("");
          } catch (err) {
            console.error("Auth state change error:", err?.message || err);
            setAuthError(err?.message || "Authentication error.");
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
    if (!supabase) {
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
      ensureProfile(data.user).then(setProfile);
    }

    return data;
  };

  const signUp = async ({ email, password, businessName, hostName }) => {
    if (!supabase) {
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
      ensureProfile(data.user).then(setProfile);
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }

    return data;
  };

  const signOut = async () => {
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const sendPasswordReset = async (email) => {
    if (!supabase) {
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
    if (!supabase) {
      throw new Error("Supabase is not configured.");
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return data;
  };

  const updateProfile = async (updates) => {
    if (!supabase) {
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

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      loading,
      authError,
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      updateProfile,
    }),
    [session, user, profile, loading, authError]
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
