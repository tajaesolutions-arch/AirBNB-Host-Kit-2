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

const BLANK_SETTINGS = {
  default_currency: "JMD",
  airbnb_currency: "USD",
  platform_fee_percentage: 0,
  management_fee_percentage: 0,
  tax_reserve_percentage: 0,
  default_checkin_time: "",
  default_checkout_time: "",
  business_name: "",
  host_name: "",
  host_phone: "",
  host_email: "",
  cleaners: [],
  vendors: [],
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const isSampleDataCleared = () => {
  try {
    return localStorage.getItem(CLEARED_SAMPLE_DATA_FLAG) === "true";
  } catch {
    return false;
  }
};

const load = (key, sampleFallback, blankFallback = []) => {
  try {
    const raw = localStorage.getItem(key);

    if (raw !== null) {
      return JSON.parse(raw);
    }

    return isSampleDataCleared() ? clone(blankFallback) : clone(sampleFallback);
  } catch {
    return isSampleDataCleared() ? clone(blankFallback) : clone(sampleFallback);
  }
};

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);

    if (raw !== null) {
      return JSON.parse(raw);
    }

    return isSampleDataCleared() ? clone(BLANK_SETTINGS) : clone(DEFAULT_SETTINGS);
  } catch {
    return isSampleDataCleared() ? clone(BLANK_SETTINGS) : clone(DEFAULT_SETTINGS);
  }
};

const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the app from crashing if storage is blocked or full.
  }
};

const saveBlankStorageState = () => {
  Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
    if (name === "settings") {
      save(key, BLANK_SETTINGS);
    } else {
      save(key, []);
    }
  });

  EXTRA_RECORD_KEYS_TO_CLEAR.forEach((key) => save(key, []));

  try {
    localStorage.setItem(CLEARED_SAMPLE_DATA_FLAG, "true");

    // Clear any older app-owned JAK keys that may have been created by prior versions.
    // This avoids leaving stale owner report / tax / record data behind.
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith("jak_") &&
        key !== CLEARED_SAMPLE_DATA_FLAG &&
        !Object.values(STORAGE_KEYS).includes(key)
      ) {
        save(key, []);
      }
    });
  } catch {
    // Keep the app from crashing if storage is blocked or full.
  }
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

  const resetToBlankData = () => {
    saveBlankStorageState();

    setPropertiesRaw([]);
    setBookingsRaw([]);
    setGuestsRaw([]);
    setCleaningRaw([]);
    setMaintenanceRaw([]);
    setSuppliesRaw([]);
    setExpensesRaw([]);
    setLeadsRaw([]);
    setSettingsRaw(clone(BLANK_SETTINGS));
  };

  const restoreSampleData = () => {
    try {
      localStorage.removeItem(CLEARED_SAMPLE_DATA_FLAG);
    } catch {
      // Keep the app from crashing if storage is blocked or full.
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

  // Kept for compatibility with any old button/component name.
  // In this app, resetToSampleData should mean "show sample data again".
  const resetToSampleData = restoreSampleData;

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
