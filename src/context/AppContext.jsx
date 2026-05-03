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
import { normalizeCurrency } from "../utils/helpers.js";

const AppContext = createContext(null);

const BACKUP_VERSION = 1;
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
  calendarEvents: "jak_calendarEvents",
  quotes: "jak_quotes",
  messageHistory: "jak_messageHistory",
  reviewTasks: "jak_reviewTasks",
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

const safeArray = (value) => (Array.isArray(value) ? value : []);

const safeSettings = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return clone(BLANK_SETTINGS);
  }

  const mergedSettings = {
    ...clone(BLANK_SETTINGS),
    ...value,
    cleaners: safeArray(value.cleaners),
    vendors: safeArray(value.vendors),
  };

  return {
    ...mergedSettings,
    default_currency: normalizeCurrency(mergedSettings.default_currency || "JMD"),
    airbnb_currency: normalizeCurrency(mergedSettings.airbnb_currency || "USD"),
  };
};

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
      return safeSettings(JSON.parse(raw));
    }

    return isSampleDataCleared()
      ? clone(BLANK_SETTINGS)
      : safeSettings(DEFAULT_SETTINGS);
  } catch {
    return isSampleDataCleared()
      ? clone(BLANK_SETTINGS)
      : safeSettings(DEFAULT_SETTINGS);
  }
};

const save = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the app from crashing if storage is blocked or full.
  }
};

const setSampleClearedFlag = (value) => {
  try {
    if (value) {
      localStorage.setItem(CLEARED_SAMPLE_DATA_FLAG, "true");
    } else {
      localStorage.removeItem(CLEARED_SAMPLE_DATA_FLAG);
    }
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

const hasOperationalRecords = (data) => {
  return [
    data.properties,
    data.bookings,
    data.guests,
    data.cleaning,
    data.maintenance,
    data.supplies,
    data.expenses,
    data.leads,
  ].some((value) => Array.isArray(value) && value.length > 0);
};

const normalizeImportedBackup = (payload) => {
  const source =
    payload && typeof payload === "object" && payload.data
      ? payload.data
      : payload;

  if (!source || typeof source !== "object" || Array.isArray(source)) {
    throw new Error("Invalid backup file. The file does not contain app data.");
  }

  return {
    properties: safeArray(source.properties),
    bookings: safeArray(source.bookings),
    guests: safeArray(source.guests),
    cleaning: safeArray(source.cleaning),
    maintenance: safeArray(source.maintenance),
    supplies: safeArray(source.supplies),
    expenses: safeArray(source.expenses),
    leads: safeArray(source.leads),
    calendarEvents: safeArray(source.calendarEvents),
    quotes: safeArray(source.quotes),
    messageHistory: safeArray(source.messageHistory),
    reviewTasks: safeArray(source.reviewTasks),
    settings: safeSettings(source.settings),
  };
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
  const [calendarEvents, setCalendarEventsRaw] = useState(() =>
    load(STORAGE_KEYS.calendarEvents, [], [])
  );
  const [quotes, setQuotesRaw] = useState(() =>
    load(STORAGE_KEYS.quotes, [], [])
  );
  const [messageHistory, setMessageHistoryRaw] = useState(() =>
    load(STORAGE_KEYS.messageHistory, [], [])
  );
  const [reviewTasks, setReviewTasksRaw] = useState(() =>
    load(STORAGE_KEYS.reviewTasks, [], [])
  );

  const persist = (key, setter, normalizer = null) => (valueOrUpdater) => {
    setter((previousValue) => {
      const rawNextValue =
        typeof valueOrUpdater === "function"
          ? valueOrUpdater(previousValue)
          : valueOrUpdater;

      const nextValue = normalizer ? normalizer(rawNextValue) : rawNextValue;

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
  const setCalendarEvents = persist(
    STORAGE_KEYS.calendarEvents,
    setCalendarEventsRaw,
    safeArray
  );
  const setQuotes = persist(STORAGE_KEYS.quotes, setQuotesRaw, safeArray);
  const setMessageHistory = persist(
    STORAGE_KEYS.messageHistory,
    setMessageHistoryRaw,
    safeArray
  );
  const setReviewTasks = persist(
    STORAGE_KEYS.reviewTasks,
    setReviewTasksRaw,
    safeArray
  );
  const setSettings = persist(
    STORAGE_KEYS.settings,
    setSettingsRaw,
    safeSettings
  );

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
    setCalendarEventsRaw([]);
    setQuotesRaw([]);
    setMessageHistoryRaw([]);
    setReviewTasksRaw([]);
    setSettingsRaw(clone(BLANK_SETTINGS));
  };

  const restoreSampleData = () => {
    setSampleClearedFlag(false);

    setProperties(SAMPLE_PROPERTIES);
    setBookings(SAMPLE_BOOKINGS);
    setGuests(SAMPLE_GUESTS);
    setCleaning(SAMPLE_CLEANING);
    setMaintenance(SAMPLE_MAINTENANCE);
    setSupplies(SAMPLE_SUPPLIES);
    setExpenses(SAMPLE_EXPENSES);
    setLeads(SAMPLE_LEADS);
    setCalendarEvents([]);
    setQuotes([]);
    setMessageHistory([]);
    setReviewTasks([]);
    setSettings(DEFAULT_SETTINGS);
  };

  const updateCurrency = (nextCurrency) => {
    setSettings((previousSettings) => ({
      ...previousSettings,
      default_currency: normalizeCurrency(nextCurrency),
    }));
  };

  const getBackupData = () => {
    return {
      app: "AirBNB Host Kit",
      backup_version: BACKUP_VERSION,
      exported_at: new Date().toISOString(),
      data: {
        properties: clone(properties),
        bookings: clone(bookings),
        guests: clone(guests),
        cleaning: clone(cleaning),
        maintenance: clone(maintenance),
        supplies: clone(supplies),
        expenses: clone(expenses),
        leads: clone(leads),
        calendarEvents: clone(calendarEvents),
        quotes: clone(quotes),
        messageHistory: clone(messageHistory),
        reviewTasks: clone(reviewTasks),
        settings: clone(settings),
      },
    };
  };

  const importBackupData = (payload) => {
    const nextData = normalizeImportedBackup(payload);

    save(STORAGE_KEYS.properties, nextData.properties);
    save(STORAGE_KEYS.bookings, nextData.bookings);
    save(STORAGE_KEYS.guests, nextData.guests);
    save(STORAGE_KEYS.cleaning, nextData.cleaning);
    save(STORAGE_KEYS.maintenance, nextData.maintenance);
    save(STORAGE_KEYS.supplies, nextData.supplies);
    save(STORAGE_KEYS.expenses, nextData.expenses);
    save(STORAGE_KEYS.leads, nextData.leads);
    save(STORAGE_KEYS.calendarEvents, nextData.calendarEvents);
    save(STORAGE_KEYS.quotes, nextData.quotes);
    save(STORAGE_KEYS.messageHistory, nextData.messageHistory);
    save(STORAGE_KEYS.reviewTasks, nextData.reviewTasks);
    save(STORAGE_KEYS.settings, nextData.settings);

    setSampleClearedFlag(!hasOperationalRecords(nextData));

    setPropertiesRaw(nextData.properties);
    setBookingsRaw(nextData.bookings);
    setGuestsRaw(nextData.guests);
    setCleaningRaw(nextData.cleaning);
    setMaintenanceRaw(nextData.maintenance);
    setSuppliesRaw(nextData.supplies);
    setExpensesRaw(nextData.expenses);
    setLeadsRaw(nextData.leads);
    setCalendarEventsRaw(nextData.calendarEvents);
    setQuotesRaw(nextData.quotes);
    setMessageHistoryRaw(nextData.messageHistory);
    setReviewTasksRaw(nextData.reviewTasks);
    setSettingsRaw(nextData.settings);

    return nextData;
  };

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
        calendarEvents,
        setCalendarEvents,
        quotes,
        setQuotes,
        messageHistory,
        setMessageHistory,
        reviewTasks,
        setReviewTasks,

        settings,
        setSettings,
        updateCurrency,

        resetToBlankData,
        resetToSampleData,
        restoreSampleData,

        getBackupData,
        importBackupData,
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
