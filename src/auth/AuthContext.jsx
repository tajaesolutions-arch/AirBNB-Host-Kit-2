import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";
import { getPermissions, getAssignedPropertyIds, getAssignedPropertyRecordIds, getAvailableRoles, normalizeRole } from "../utils/permissions.js";

const AuthContext = createContext(null);
const LOCAL_MODE_USER = { id: "local", email: "local" };
const LOCAL_MODE_PROFILE = {
  id: "local",
  email: "local",
  role: "admin",
  account_status: "approved",
  onboarding_completed: true,
};

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const [memberships, setMemberships] = useState([]);
  const [membershipsLoading, setMembershipsLoading] = useState(false);
  const [membershipsError, setMembershipsError] = useState("");
  const [requestedRole, setRequestedRole] = useState("");

  const fetchMemberships = async (authUser) => {
    if (!supabase || !authUser?.id) {
      setMemberships([]);
      setMembershipsLoading(false);
      setMembershipsError("");
      return [];
    }
    setMembershipsLoading(true); setMembershipsError("");
    const { data, error } = await supabase
      .from("property_memberships")
      .select("*")
      .eq("member_user_id", authUser.id)
      .eq("active", true);
    if (error) { setMembershipsError(error.message || "Failed to load memberships."); setMemberships([]); setMembershipsLoading(false); return []; }
    const rows = Array.isArray(data) ? data : [];
    setMemberships(rows); setMembershipsLoading(false);
    return rows;
  };


  const profileRequestIdRef = useRef(0);
  const PROFILE_TIMEOUT_MS = 3000;

  const withTimeout = async (promise, timeoutMs) => {
    let timeoutId;

    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = window.setTimeout(() => {
        reject(new Error("PROFILE_LOAD_TIMEOUT"));
      }, timeoutMs);
    });

    try {
      return await Promise.race([promise, timeoutPromise]);
    } finally {
      window.clearTimeout(timeoutId);
    }
  };

  const formatProfileError = (err) => {
    const message = err?.message || "";
    const code = err?.code || "";
    const looksLikeSchemaIssue =
      code === "PGRST204" ||
      code === "42P01" ||
      /schema|cache|column|relation|profiles/i.test(message);

    if (message === "PROFILE_LOAD_TIMEOUT") {
      return "Your account profile could not be loaded. Please refresh or contact support.";
    }

    if (looksLikeSchemaIssue) {
      return `Developer action required: Supabase profiles schema/cache issue (${code || "unknown_code"}) - ${message}`;
    }

    return message || "Your account profile could not be loaded. Please refresh or contact support.";
  };

  const ensureProfile = async (authUser, roleFallback = "host") => {
    if (!supabase || !authUser) return null;

    const requestedProfileRole = normalizeRole(roleFallback || authUser.user_metadata?.role || authUser.user_metadata?.requested_role) || "host";

    const fetchOrCreateProfile = async () => {
      const { data: existingProfile, error: selectError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      if (selectError && selectError.code !== "PGRST116") {
        throw selectError;
      }

      if (existingProfile) {
        const normalizedRole = normalizeRole(existingProfile.role) || requestedProfileRole;
        const normalizedStatus = existingProfile.account_status || "pending";
        if (existingProfile.role !== normalizedRole || existingProfile.account_status !== normalizedStatus) {
          const { data: patchedProfile, error: patchError } = await supabase
            .from("profiles")
            .update({ role: normalizedRole, account_status: normalizedStatus, updated_at: new Date().toISOString() })
            .eq("id", authUser.id)
            .select("*")
            .single();

          if (patchError) throw patchError;
          return patchedProfile;
        }
        return existingProfile;
      }

      const now = new Date().toISOString();
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
        account_status: "pending",
        role: requestedProfileRole,
        approved_at: null,
        approved_by: null,
        onboarding_completed: false,
        onboarding_choice: null,
        onboarded_at: null,
        created_at: now,
        updated_at: now,
      };

      const { data: createdProfile, error: insertError } = await supabase
        .from("profiles")
        .upsert(newProfile, { onConflict: "id" })
        .select("*")
        .single();

      if (insertError) throw insertError;

      return createdProfile;
    };

    return withTimeout(fetchOrCreateProfile(), PROFILE_TIMEOUT_MS);
  };

  const loadUserProfile = async (authUser, mountedRef) => {
    const requestId = ++profileRequestIdRef.current;

    if (mountedRef.current) {
      setProfileLoading(true);
      setAuthError("");
    }

    try {
      const nextProfile = await ensureProfile(authUser);

      if (mountedRef.current && requestId === profileRequestIdRef.current) {
        setProfile(nextProfile);
      }
    } catch (err) {
      if (mountedRef.current && requestId === profileRequestIdRef.current) {
        setAuthError(formatProfileError(err));
      }
    } finally {
      if (mountedRef.current && requestId === profileRequestIdRef.current) {
        setProfileLoading(false);
      }
    }
  };

  useEffect(() => {
    const mountedRef = { current: true };

    const loadSession = async () => {
      try {
        setLoading(true);
        setAuthError("");

        if (!isSupabaseConfigured || !supabase) {
          setSession(null);
          setUser(LOCAL_MODE_USER);
          setProfile(LOCAL_MODE_PROFILE);
          setProfileLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        const currentSession = data?.session || null;
        const currentUser = currentSession?.user || null;

        if (!mountedRef.current) return;

        setSession(currentSession);
        setUser(currentUser);

        if (currentUser) {
          void loadUserProfile(currentUser, mountedRef);
          void fetchMemberships(currentUser);
        } else {
          setProfile(null);
    setMemberships([]);
          setProfileLoading(false);
        }
      } catch (err) {
        console.error("Auth session error:", err?.message || err);

        if (mountedRef.current) {
          setAuthError(err?.message || "Could not check your login session. Please refresh.");
          setProfileLoading(false);
        }
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    loadSession();

    let subscription;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
        if (!mountedRef.current) return;

        // Avoid deadlock issues from follow-up Supabase calls in auth callback.
        window.setTimeout(async () => {
        try {
          const nextUser = nextSession?.user || null;

          setSession(nextSession);
          setUser(nextUser);

          if (nextUser) {
            void loadUserProfile(nextUser, mountedRef);
            void fetchMemberships(nextUser);
          } else {
            setProfile(null);
            setMemberships([]);
            setMembershipsError("");
            setMembershipsLoading(false);
            setProfileLoading(false);
            setAuthError("");
          }
        } catch (err) {
          console.error("Auth state change error:", err?.message || err);
          if (mountedRef.current) {
            setAuthError(err?.message || "Authentication error.");
            setProfileLoading(false);
          }
        } finally {
          if (mountedRef.current) setLoading(false);
        }
        }, 0);
      });

      subscription = data?.subscription;
    }

    return () => {
      mountedRef.current = false;
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
      void fetchMemberships(data.user);
      setProfileLoading(true);
      try {
        setProfile(await ensureProfile(data.user));
      } finally {
        setProfileLoading(false);
      }
    }

    return data;
  };

  const signUp = async ({ email, password, businessName, hostName, requestedRole: signupRole }) => {
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
          requested_role: normalizeRole(signupRole) || "host",
          role: normalizeRole(signupRole) || "host",
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      void fetchMemberships(data.user);
      setProfileLoading(true);
      try {
        setProfile(await ensureProfile(data.user, signupRole));
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
    setMemberships([]);
    setRequestedRole("");
  };

  const sendPasswordReset = async (email) => {
    if (!supabase || !isSupabaseConfigured) {
      throw new Error("Supabase is not configured.");
    }

    const redirectTo = `${window.location.origin}/reset-password`;

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

  const isApproved = profile?.account_status === "approved";
  const availableRoles = useMemo(() => getAvailableRoles({ memberships, profile, user }), [memberships, profile, user]);

  const authoritativeProfileRole = normalizeRole(profile?.role);
  const effectiveRole = authoritativeProfileRole || availableRoles[0] || "host";
  const scopedMemberships = useMemo(() => memberships.filter((m) => effectiveRole === "host" ? true : normalizeRole(m?.access_role) === effectiveRole), [memberships, effectiveRole]);
  const assignedPropertyIds = useMemo(() => getAssignedPropertyIds(scopedMemberships), [scopedMemberships]);
  const assignedPropertyRecordIds = useMemo(() => getAssignedPropertyRecordIds(scopedMemberships), [scopedMemberships]);
  const permissions = useMemo(() => getPermissions({ memberships: scopedMemberships, effectiveRole }), [scopedMemberships, effectiveRole]);
  const isHostLike = Boolean(permissions?.isHostLike);

  const value = useMemo(
    () => ({
      session,
      user,
      profile,
      profileLoading,
      loading,
      authError,
      isApproved,
      isSupabaseConfigured,
      memberships, membershipsLoading, membershipsError, requestedRole, availableRoles, effectiveRole, permissions, assignedPropertyIds, assignedPropertyRecordIds, isHostLike,
      setRequestedRole,
      refetchMemberships: () => fetchMemberships(user),
      signIn,
      signUp,
      signOut,
      sendPasswordReset,
      updatePassword,
      updateProfile,
      completeOnboarding,
    }),
    [session, user, profile, profileLoading, loading, authError, isApproved, memberships, membershipsLoading, membershipsError, requestedRole, availableRoles, effectiveRole, permissions, assignedPropertyIds, assignedPropertyRecordIds, isHostLike]
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
