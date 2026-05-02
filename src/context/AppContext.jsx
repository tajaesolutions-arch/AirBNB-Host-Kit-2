import { createContext, useContext, useState } from "react";
import {
  SAMPLE_PROPERTIES,
  SAMPLE_BOOKINGS,
  SAMPLE_GUESTS,
  SAMPLE_CLEANING,
  SAMPLE_MAINTENANCE,
  SAMPLE_SUPPLIES,
  SAMPLE_EXPENSES,
  SAMPLE_LEADS,
  DEFAULT_SETTINGS,
} from "../data/sampleData.js";

const AppContext = createContext(null);

const CLEARED_SAMPLE_DATA_FLAG = "jak_sample_data_cleared";

const STORAGE_KEYS = {
  properties: "jak_properties",
  bookings: "jak_bookings",
  guests: "jak_guests",
  cleaning: "jak_cleaning",
  maintenance: "jak_maintenance",
  supplies: "jak_supplies",
  expenses: "jak_expenses",
  leads: "jak_leads",
  settings: "jak_settings",
};

/**
 * These are extra possible keys used by owner report / tax reserve pages.
 * Saving empty arrays here helps clear pages that may be using localStorage directly.
 */
const EXTRA_RECORD_KEYS_TO_CLEAR = [
  "jak_ownerReports",
  "jak_owner_reports",
  "jak_ownerReport",
  "jak_owner_report",
  "jak_taxReserve",
  "jak_tax_reserve",
  "jak_taxRecords",
  "jak_tax_records",
  "jak_gct",
  "jak_gct_reserve",
];

const load = (key, fallback, emptyFallback = []) => {
  try {
    const raw = localStorage.getItem(key);

    if (raw !== null) {
      return JSON.parse(raw);
    }

    const sampleDataWasCleared =
      localStorage.getItem(CLEARED_SAMPLE_DATA_FLAG) === "true";

    return sampleDataWasCleared ? emptyFallback : fallback;
  } catch {
    return fallback;
  }
};

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
};

const save = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch {
    // Ignore storage errors so the app does not crash.
  }
};

const saveEmptyRecordKeys = () => {
  Object.values(STORAGE_KEYS).forEach((key) => {
    if (key !== STORAGE_KEYS.settings) {
      save(key, []);
    }
  });

  EXTRA_RECORD_KEYS_TO_CLEAR.forEach((key) => {
    save(key, []);
  });
};

export function AppProvider({ children }) {
  const [properties, setPropertiesRaw] = useState(() =>
    load(STORAGE_KEYS.properties, SAMPLE_PROPERTIES)
  );

  const [bookings, setBookingsRaw] = useState(() =>
    load(STORAGE_KEYS.bookings, SAMPLE_BOOKINGS)
  );

  const [guests, setGuestsRaw] = useState(() =>
    load(STORAGE_KEYS.guests, SAMPLE_GUESTS)
  );

  const [cleaning, setCleaningRaw] = useState(() =>
    load(STORAGE_KEYS.cleaning, SAMPLE_CLEANING)
  );

  const [maintenance, setMaintenanceRaw] = useState(() =>
    load(STORAGE_KEYS.maintenance, SAMPLE_MAINTENANCE)
  );

  const [supplies, setSuppliesRaw] = useState(() =>
    load(STORAGE_KEYS.supplies, SAMPLE_SUPPLIES)
  );

  const [expenses, setExpensesRaw] = useState(() =>
    load(STORAGE_KEYS.expenses, SAMPLE_EXPENSES)
  );

  const [leads, setLeadsRaw] = useState(() =>
    load(STORAGE_KEYS.leads, SAMPLE_LEADS)
  );

  const [settings, setSettingsRaw] = useState(() => loadSettings());

  const persist = (key, setter) => (valueOrUpdater) => {
    setter((previousValue) => {
      const nextValue =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(previousValue)
          : valueOrUpdater;

      save(key, nextValue);
      return nextValue;
    });
  };

  const setProperties = persist(STORAGE_KEYS.properties, setPropertiesRaw);
  const setBookings = persist(STORAGE_KEYS.bookings, setBookingsRaw);
  const setGuests = persist(STORAGE_KEYS.guests, setGuestsRaw);
  const setCleaning = persist(STORAGE_KEYS.cleaning, setCleaningRaw);
  const setMaintenance = persist(STORAGE_KEYS.maintenance, setMaintenanceRaw);
  const setSupplies = persist(STORAGE_KEYS.supplies, setSuppliesRaw);
  const setExpenses = persist(STORAGE_KEYS.expenses, setExpensesRaw);
  const setLeads = persist(STORAGE_KEYS.leads, setLeadsRaw);
  const setSettings = persist(STORAGE_KEYS.settings, setSettingsRaw);

  /**
   * Clears the app so the user can start from scratch.
   * This is the important fix.
   */
  const resetToBlankData = () => {
    try {
      localStorage.setItem(CLEARED_SAMPLE_DATA_FLAG, "true");
      saveEmptyRecordKeys();
      save(STORAGE_KEYS.settings, DEFAULT_SETTINGS);
    } catch {
      // Ignore storage errors.
    }

    setPropertiesRaw([]);
    setBookingsRaw([]);
    setGuestsRaw([]);
    setCleaningRaw([]);
    setMaintenanceRaw([]);
    setSuppliesRaw([]);
    setExpensesRaw([]);
    setLeadsRaw([]);
    setSettingsRaw(DEFAULT_SETTINGS);
  };

  /**
   * Backwards-compatible alias.
   * If your Settings page currently calls resetToSampleData(),
   * it will now clear everything instead of bringing the sample data back.
   */
  const resetToSampleData = resetToBlankData;

  /**
   * Optional function if you ever want a separate button
   * that actually restores the original sample data.
   */
  const restoreSampleData = () => {
    try {
      localStorage.removeItem(CLEARED_SAMPLE_DATA_FLAG);
    } catch {
      // Ignore storage errors.
    }

    setProperties(SAMPLE_PROPERTIES);
    setBookings(SAMPLE_BOOKINGS);
    setGuests(SAMPLE_GUESTS);
    setCleaning(SAMPLE_CLEANING);
    setMaintenance(SAMPLE_MAINTENANCE);
    setSupplies(SAMPLE_SUPPLIES);
    setExpenses(SAMPLE_EXPENSES);
    setLeads(SAMPLE_LEADS);
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <AppContext.Provider
      value={{
        properties,
        setProperties,

        bookings,
        setBookings,

        guests,
        setGuests,

        cleaning,
        setCleaning,

        maintenance,
        setMaintenance,

        supplies,
        setSupplies,

        expenses,
        setExpenses,

        leads,
        setLeads,

        settings,
        setSettings,

        resetToBlankData,
        resetToSampleData,
        restoreSampleData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);

  if (!ctx) {
    throw new Error("useApp must be used within AppProvider");
  }

  return ctx;
};
