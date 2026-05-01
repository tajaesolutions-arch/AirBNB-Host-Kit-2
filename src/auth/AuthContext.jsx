import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const ensureProfile = async (authUser) => {
    if (!authUser) return null;

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
      business_name: authUser.user_metadata?.business_name || "Your Hospitality Co.",
      host_name: authUser.user_metadata?.host_name || "Your Host Name",
      phone: "",
      default_currency: "JMD",
      default_tax_reserve_percentage: 0.15,
      default_management_fee_percentage: 0.15,
    };

    const { data: createdProfile, error: insertError } = await supabase
      .from("profiles")
      .insert(newProfile)
      .select("*")
      .single();

    if (insertError) {
      console.warn("Profile creation error:", insertError.message);
      return newProfile;
    }

    return createdProfile;
  };

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      setLoading(true);

      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error.message);
      }

      const currentSession = data?.session || null;
      const currentUser = currentSession?.user || null;

      if (!mounted) return;

      setSession(currentSession);
      setUser(currentUser);

      if (currentUser) {
        const nextProfile = await ensureProfile(currentUser);
        if (mounted) setProfile(nextProfile);
      }

      setLoading(false);
    };

    loadSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, nextSession) => {
        const nextUser = nextSession?.user || null;

        setSession(nextSession);
        setUser(nextUser);

        if (nextUser) {
          const nextProfile = await ensureProfile(nextUser);
          setProfile(nextProfile);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const signIn = async ({ email, password }) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setSession(data.session);
    setUser(data.user);

    if (data.user) {
      const nextProfile = await ensureProfile(data.user);
      setProfile(nextProfile);
    }

    return data;
  };

  const signUp = async ({ email, password, businessName, hostName }) => {
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
      const nextProfile = await ensureProfile(data.user);
      setProfile(nextProfile);
    }

    if (data.session) {
      setSession(data.session);
      setUser(data.user);
    }

    return data;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setSession(null);
    setUser(null);
    setProfile(null);
  };

  const sendPasswordReset = async (email) => {
    const redirectTo = `${window.location.origin}`;

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    });

    if (error) throw error;

    return data;
  };

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return data;
  };

  const updateProfile = async (updates) => {
    if (!user) throw new Error("You must be logged in to update your profile.");

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
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      updateProfile,
    }),
    [session, user, profile, loading]
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
