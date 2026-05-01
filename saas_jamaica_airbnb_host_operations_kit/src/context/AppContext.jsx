import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient.js";
import { useAuth } from "../auth/AuthContext.jsx";
import {
  SAMPLE_PROPERTIES, SAMPLE_BOOKINGS, SAMPLE_GUESTS, SAMPLE_CLEANING,
  SAMPLE_MAINTENANCE, SAMPLE_SUPPLIES, SAMPLE_EXPENSES, SAMPLE_LEADS,
  DEFAULT_SETTINGS,
} from "../data/sampleData.js";

const AppContext = createContext(null);

const TABLES = {
  properties: { table: "properties", idField: "property_id", sample: SAMPLE_PROPERTIES },
  bookings: { table: "bookings", idField: "booking_id", sample: SAMPLE_BOOKINGS },
  guests: { table: "guests", idField: "guest_id", sample: SAMPLE_GUESTS },
  cleaning: { table: "cleaning_tasks", idField: "cleaning_id", sample: SAMPLE_CLEANING },
  maintenance: { table: "maintenance_issues", idField: "issue_id", sample: SAMPLE_MAINTENANCE },
  supplies: { table: "supplies", idField: "supply_id", sample: SAMPLE_SUPPLIES },
  expenses: { table: "expenses", idField: "expense_id", sample: SAMPLE_EXPENSES },
  leads: { table: "direct_booking_leads", idField: "lead_id", sample: SAMPLE_LEADS },
};

const DATE_FIELDS = new Set([
  "checkin_date", "checkout_date", "last_contacted_date", "next_followup_date",
  "checkout_date", "next_checkin_date", "reported_date", "completion_date",
  "last_restocked_date", "expense_date", "followup_date",
]);

const normalizeForDb = (row) => {
  const normalized = {};
  for (const [key, value] of Object.entries(row || {})) {
    if (DATE_FIELDS.has(key) && value === "") normalized[key] = null;
    else normalized[key] = value;
  }
  return normalized;
};

const dbStrip = (row) => {
  const { id, user_id, created_at, updated_at, ...rest } = row || {};
  return rest;
};

const withUser = (row, userId) => ({
  ...normalizeForDb(row),
  user_id: userId,
  updated_at: new Date().toISOString(),
});

const buildRecordMap = (rows, idField) => {
  const map = new Map();
  for (const row of rows || []) {
    if (row?.[idField]) map.set(row[idField], row);
  }
  return map;
};

async function fetchCollection(key, userId) {
  const meta = TABLES[key];
  const { data, error } = await supabase
    .from(meta.table)
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data || []).map(dbStrip);
}

async function syncCollection(key, userId, previousRows, nextRows) {
  const meta = TABLES[key];
  const previousMap = buildRecordMap(previousRows, meta.idField);
  const nextMap = buildRecordMap(nextRows, meta.idField);

  const deletedIds = [...previousMap.keys()].filter(id => !nextMap.has(id));
  const upsertRows = [...nextMap.values()].map(row => withUser(row, userId));

  if (deletedIds.length) {
    const { error } = await supabase
      .from(meta.table)
      .delete()
      .eq("user_id", userId)
      .in(meta.idField, deletedIds);
    if (error) throw error;
  }

  if (upsertRows.length) {
    const { error } = await supabase
      .from(meta.table)
      .upsert(upsertRows, { onConflict: `user_id,${meta.idField}` });
    if (error) throw error;
  }
}

async function fetchSettings(userId) {
  const { data, error } = await supabase
    .from("settings")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return { ...DEFAULT_SETTINGS, ...(data?.data || {}) };
}

async function syncSettings(userId, settings) {
  const { error } = await supabase
    .from("settings")
    .upsert({ user_id: userId, data: settings, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw error;
}

async function replaceCollectionWithSample(key, userId) {
  const meta = TABLES[key];
  const { error: deleteError } = await supabase.from(meta.table).delete().eq("user_id", userId);
  if (deleteError) throw deleteError;
  if (meta.sample.length) {
    const { error } = await supabase
      .from(meta.table)
      .insert(meta.sample.map(row => withUser(row, userId)));
    if (error) throw error;
  }
}

function useSyncedRef(value) {
  const ref = useRef(value);
  useEffect(() => { ref.current = value; }, [value]);
  return ref;
}

export function AppProvider({ children }) {
  const { user, profile } = useAuth();
  const [properties, setPropertiesRaw] = useState([]);
  const [bookings, setBookingsRaw] = useState([]);
  const [guests, setGuestsRaw] = useState([]);
  const [cleaning, setCleaningRaw] = useState([]);
  const [maintenance, setMaintenanceRaw] = useState([]);
  const [supplies, setSuppliesRaw] = useState([]);
  const [expenses, setExpensesRaw] = useState([]);
  const [leads, setLeadsRaw] = useState([]);
  const [settings, setSettingsRaw] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const refs = {
    properties: useSyncedRef(properties),
    bookings: useSyncedRef(bookings),
    guests: useSyncedRef(guests),
    cleaning: useSyncedRef(cleaning),
    maintenance: useSyncedRef(maintenance),
    supplies: useSyncedRef(supplies),
    expenses: useSyncedRef(expenses),
    leads: useSyncedRef(leads),
    settings: useSyncedRef(settings),
  };

  const rawSetters = useMemo(() => ({
    properties: setPropertiesRaw,
    bookings: setBookingsRaw,
    guests: setGuestsRaw,
    cleaning: setCleaningRaw,
    maintenance: setMaintenanceRaw,
    supplies: setSuppliesRaw,
    expenses: setExpensesRaw,
    leads: setLeadsRaw,
  }), []);

  useEffect(() => {
    let isMounted = true;

    async function loadAll() {
      if (!user || !supabase) return;
      setLoading(true);
      setError("");

      try {
        const [
          nextProperties, nextBookings, nextGuests, nextCleaning,
          nextMaintenance, nextSupplies, nextExpenses, nextLeads, nextSettings,
        ] = await Promise.all([
          fetchCollection("properties", user.id),
          fetchCollection("bookings", user.id),
          fetchCollection("guests", user.id),
          fetchCollection("cleaning", user.id),
          fetchCollection("maintenance", user.id),
          fetchCollection("supplies", user.id),
          fetchCollection("expenses", user.id),
          fetchCollection("leads", user.id),
          fetchSettings(user.id),
        ]);

        if (!isMounted) return;
        setPropertiesRaw(nextProperties);
        setBookingsRaw(nextBookings);
        setGuestsRaw(nextGuests);
        setCleaningRaw(nextCleaning);
        setMaintenanceRaw(nextMaintenance);
        setSuppliesRaw(nextSupplies);
        setExpensesRaw(nextExpenses);
        setLeadsRaw(nextLeads);
        setSettingsRaw({ ...DEFAULT_SETTINGS, ...nextSettings });
      } catch (err) {
        if (isMounted) setError(err.message || "Could not load dashboard data.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadAll();
    return () => { isMounted = false; };
  }, [user?.id]);

  const makeCollectionSetter = (key) => async (nextOrFn) => {
    if (!user || !supabase) return;
    const previous = refs[key].current || [];
    const next = typeof nextOrFn === "function" ? nextOrFn(previous) : nextOrFn;
    rawSetters[key](next);
    setSaving(true);
    setError("");
    try {
      await syncCollection(key, user.id, previous, next);
    } catch (err) {
      rawSetters[key](previous);
      setError(err.message || `Could not save ${key}.`);
    } finally {
      setSaving(false);
    }
  };

  const setSettings = async (nextOrFn) => {
    if (!user || !supabase) return;
    const previous = refs.settings.current || DEFAULT_SETTINGS;
    const next = typeof nextOrFn === "function" ? nextOrFn(previous) : nextOrFn;
    setSettingsRaw(next);
    setSaving(true);
    setError("");
    try {
      await syncSettings(user.id, next);
    } catch (err) {
      setSettingsRaw(previous);
      setError(err.message || "Could not save settings.");
    } finally {
      setSaving(false);
    }
  };

  const resetToSampleData = async () => {
    if (!user || !supabase) return;
    setSaving(true);
    setError("");
    try {
      for (const key of Object.keys(TABLES)) {
        await replaceCollectionWithSample(key, user.id);
      }
      const nextSettings = {
        ...DEFAULT_SETTINGS,
        business_name: profile?.business_name || DEFAULT_SETTINGS.business_name,
        host_name: profile?.host_name || DEFAULT_SETTINGS.host_name,
        host_email: user.email || DEFAULT_SETTINGS.host_email,
      };
      await syncSettings(user.id, nextSettings);

      setPropertiesRaw(SAMPLE_PROPERTIES);
      setBookingsRaw(SAMPLE_BOOKINGS);
      setGuestsRaw(SAMPLE_GUESTS);
      setCleaningRaw(SAMPLE_CLEANING);
      setMaintenanceRaw(SAMPLE_MAINTENANCE);
      setSuppliesRaw(SAMPLE_SUPPLIES);
      setExpensesRaw(SAMPLE_EXPENSES);
      setLeadsRaw(SAMPLE_LEADS);
      setSettingsRaw(nextSettings);
    } catch (err) {
      setError(err.message || "Could not load sample data.");
    } finally {
      setSaving(false);
    }
  };

  const clearAllData = async () => {
    if (!user || !supabase) return;
    setSaving(true);
    setError("");
    try {
      for (const key of Object.keys(TABLES)) {
        await supabase.from(TABLES[key].table).delete().eq("user_id", user.id);
      }
      setPropertiesRaw([]);
      setBookingsRaw([]);
      setGuestsRaw([]);
      setCleaningRaw([]);
      setMaintenanceRaw([]);
      setSuppliesRaw([]);
      setExpensesRaw([]);
      setLeadsRaw([]);
    } catch (err) {
      setError(err.message || "Could not clear data.");
    } finally {
      setSaving(false);
    }
  };

  const value = {
    properties, setProperties: makeCollectionSetter("properties"),
    bookings, setBookings: makeCollectionSetter("bookings"),
    guests, setGuests: makeCollectionSetter("guests"),
    cleaning, setCleaning: makeCollectionSetter("cleaning"),
    maintenance, setMaintenance: makeCollectionSetter("maintenance"),
    supplies, setSupplies: makeCollectionSetter("supplies"),
    expenses, setExpenses: makeCollectionSetter("expenses"),
    leads, setLeads: makeCollectionSetter("leads"),
    settings, setSettings,
    loading, saving, error,
    resetToSampleData,
    clearAllData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
