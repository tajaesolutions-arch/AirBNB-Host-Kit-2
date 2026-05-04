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
import {
  normalizeSettings,
  normalizeProperty,
  normalizeBooking,
  normalizeGuest,
  normalizeCleaningTask,
  normalizeMaintenanceIssue,
  normalizeSupply,
  normalizeExpense,
  normalizeLead,
  normalizeCalendarEvent,
  normalizeQuote,
  normalizeMessageHistoryItem,
  normalizeReviewTask,
  normalizeCollection,
} from "../utils/normalizers.js";

const AppContext = createContext(null);

const BACKUP_VERSION = 1;
const CLEARED_SAMPLE_DATA_FLAG = "jak_sample_data_cleared";
const SETUP_PROGRESS_STORAGE_KEY = "jak_dashboard_setup_progress";
const BACKUP_EXPORTED_AT_STORAGE_KEY = "jak_backup_exported_at";

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
  messageDrafts: "jak_messageDrafts",
  calendarFeeds: "jak_calendarFeeds",
  importedCalendarEvents: "jak_importedCalendarEvents",
  photoProofs: "jak_photoProofs",
  ownerPortalShares: "jak_ownerPortalShares",
  damageDeposits: "jak_damageDeposits",
  pricingNotes: "jak_pricingNotes",
  repeatCampaigns: "jak_repeatCampaigns",
  taxPrepPacks: "jak_taxPrepPacks",
  maintenanceApprovals: "jak_maintenanceApprovals",
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

const load = (key, sampleFallback, blankFallback = []) => {
  void sampleFallback;

  try {
    const raw = localStorage.getItem(key);

    if (raw !== null) {
      return JSON.parse(raw);
    }

    return clone(blankFallback);
  } catch {
    return clone(blankFallback);
  }
};

const loadSettings = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);

    if (raw !== null) {
      return normalizeSettings(safeSettings(JSON.parse(raw)));
    }

    return clone(BLANK_SETTINGS);
  } catch {
    return clone(BLANK_SETTINGS);
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
    properties: normalizeCollection(source.properties, normalizeProperty),
    bookings: normalizeCollection(source.bookings, normalizeBooking),
    guests: normalizeCollection(source.guests, normalizeGuest),
    cleaning: normalizeCollection(source.cleaning, normalizeCleaningTask),
    maintenance: normalizeCollection(source.maintenance, normalizeMaintenanceIssue),
    supplies: normalizeCollection(source.supplies, normalizeSupply),
    expenses: normalizeCollection(source.expenses, normalizeExpense),
    leads: normalizeCollection(source.leads, normalizeLead),
    calendarEvents: normalizeCollection(source.calendarEvents, normalizeCalendarEvent),
    quotes: normalizeCollection(source.quotes, normalizeQuote),
    messageHistory: normalizeCollection(source.messageHistory, normalizeMessageHistoryItem),
    reviewTasks: normalizeCollection(source.reviewTasks, normalizeReviewTask),
    messageDrafts: safeArray(source.messageDrafts),
    calendarFeeds: safeArray(source.calendarFeeds),
    importedCalendarEvents: safeArray(source.importedCalendarEvents),
    photoProofs: safeArray(source.photoProofs),
    ownerPortalShares: safeArray(source.ownerPortalShares),
    damageDeposits: safeArray(source.damageDeposits),
    pricingNotes: safeArray(source.pricingNotes),
    repeatCampaigns: safeArray(source.repeatCampaigns),
    taxPrepPacks: safeArray(source.taxPrepPacks),
    maintenanceApprovals: safeArray(source.maintenanceApprovals),
    settings: normalizeSettings(safeSettings(source.settings)),
  };
};

export function AppProvider({ children }) {
  const [properties, setPropertiesRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.properties, SAMPLE_PROPERTIES), normalizeProperty)
  );

  const [bookings, setBookingsRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.bookings, SAMPLE_BOOKINGS), normalizeBooking)
  );

  const [guests, setGuestsRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.guests, SAMPLE_GUESTS), normalizeGuest)
  );

  const [cleaning, setCleaningRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.cleaning, SAMPLE_CLEANING), normalizeCleaningTask)
  );

  const [maintenance, setMaintenanceRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.maintenance, SAMPLE_MAINTENANCE), normalizeMaintenanceIssue)
  );

  const [supplies, setSuppliesRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.supplies, SAMPLE_SUPPLIES), normalizeSupply)
  );

  const [expenses, setExpensesRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.expenses, SAMPLE_EXPENSES), normalizeExpense)
  );

  const [leads, setLeadsRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.leads, SAMPLE_LEADS), normalizeLead)
  );

  const [settings, setSettingsRaw] = useState(() => normalizeSettings(loadSettings()));
  const [calendarEvents, setCalendarEventsRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.calendarEvents, [], []), normalizeCalendarEvent)
  );
  const [quotes, setQuotesRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.quotes, [], []), normalizeQuote)
  );
  const [messageHistory, setMessageHistoryRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.messageHistory, [], []), normalizeMessageHistoryItem)
  );
  const [reviewTasks, setReviewTasksRaw] = useState(() =>
    normalizeCollection(load(STORAGE_KEYS.reviewTasks, [], []), normalizeReviewTask)
  );

  const [messageDrafts, setMessageDraftsRaw] = useState(() => load(STORAGE_KEYS.messageDrafts, [], []));
  const [calendarFeeds, setCalendarFeedsRaw] = useState(() => load(STORAGE_KEYS.calendarFeeds, [], []));
  const [importedCalendarEvents, setImportedCalendarEventsRaw] = useState(() => load(STORAGE_KEYS.importedCalendarEvents, [], []));
  const [photoProofs, setPhotoProofsRaw] = useState(() => load(STORAGE_KEYS.photoProofs, [], []));
  const [ownerPortalShares, setOwnerPortalSharesRaw] = useState(() => load(STORAGE_KEYS.ownerPortalShares, [], []));
  const [damageDeposits, setDamageDepositsRaw] = useState(() => load(STORAGE_KEYS.damageDeposits, [], []));
  const [pricingNotes, setPricingNotesRaw] = useState(() => load(STORAGE_KEYS.pricingNotes, [], []));
  const [repeatCampaigns, setRepeatCampaignsRaw] = useState(() => load(STORAGE_KEYS.repeatCampaigns, [], []));
  const [taxPrepPacks, setTaxPrepPacksRaw] = useState(() => load(STORAGE_KEYS.taxPrepPacks, [], []));
  const [maintenanceApprovals, setMaintenanceApprovalsRaw] = useState(() => load(STORAGE_KEYS.maintenanceApprovals, [], []));

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

  const setProperties = persist(STORAGE_KEYS.properties, setPropertiesRaw, (value) => normalizeCollection(value, normalizeProperty));
  const setBookings = persist(STORAGE_KEYS.bookings, setBookingsRaw, (value) => normalizeCollection(value, normalizeBooking));
  const setGuests = persist(STORAGE_KEYS.guests, setGuestsRaw, (value) => normalizeCollection(value, normalizeGuest));
  const setCleaning = persist(STORAGE_KEYS.cleaning, setCleaningRaw, (value) => normalizeCollection(value, normalizeCleaningTask));
  const setMaintenance = persist(STORAGE_KEYS.maintenance, setMaintenanceRaw, (value) => normalizeCollection(value, normalizeMaintenanceIssue));
  const setSupplies = persist(STORAGE_KEYS.supplies, setSuppliesRaw, (value) => normalizeCollection(value, normalizeSupply));
  const setExpenses = persist(STORAGE_KEYS.expenses, setExpensesRaw, (value) => normalizeCollection(value, normalizeExpense));
  const setLeads = persist(STORAGE_KEYS.leads, setLeadsRaw, (value) => normalizeCollection(value, normalizeLead));
  const setCalendarEvents = persist(
    STORAGE_KEYS.calendarEvents,
    setCalendarEventsRaw,
    (value) => normalizeCollection(value, normalizeCalendarEvent)
  );
  const setQuotes = persist(STORAGE_KEYS.quotes, setQuotesRaw, (value) => normalizeCollection(value, normalizeQuote));
  const setMessageHistory = persist(
    STORAGE_KEYS.messageHistory,
    setMessageHistoryRaw,
    (value) => normalizeCollection(value, normalizeMessageHistoryItem)
  );
  const setReviewTasks = persist(
    STORAGE_KEYS.reviewTasks,
    setReviewTasksRaw,
    (value) => normalizeCollection(value, normalizeReviewTask)
  );
  const setMessageDrafts = persist(STORAGE_KEYS.messageDrafts, setMessageDraftsRaw, (value) => safeArray(value));
  const setCalendarFeeds = persist(STORAGE_KEYS.calendarFeeds, setCalendarFeedsRaw, (value) => safeArray(value));
  const setImportedCalendarEvents = persist(STORAGE_KEYS.importedCalendarEvents, setImportedCalendarEventsRaw, (value) => safeArray(value));
  const setPhotoProofs = persist(STORAGE_KEYS.photoProofs, setPhotoProofsRaw, (value) => safeArray(value));
  const setOwnerPortalShares = persist(STORAGE_KEYS.ownerPortalShares, setOwnerPortalSharesRaw, (value) => safeArray(value));
  const setDamageDeposits = persist(STORAGE_KEYS.damageDeposits, setDamageDepositsRaw, (value) => safeArray(value));
  const setPricingNotes = persist(STORAGE_KEYS.pricingNotes, setPricingNotesRaw, (value) => safeArray(value));
  const setRepeatCampaigns = persist(STORAGE_KEYS.repeatCampaigns, setRepeatCampaignsRaw, (value) => safeArray(value));
  const setTaxPrepPacks = persist(STORAGE_KEYS.taxPrepPacks, setTaxPrepPacksRaw, (value) => safeArray(value));
  const setMaintenanceApprovals = persist(STORAGE_KEYS.maintenanceApprovals, setMaintenanceApprovalsRaw, (value) => safeArray(value));
  const setSettings = persist(
    STORAGE_KEYS.settings,
    setSettingsRaw,
    (value) => normalizeSettings(safeSettings(value))
  );

  const resetToBlankData = () => {
    saveBlankStorageState();
    save(SETUP_PROGRESS_STORAGE_KEY, {});
    save(BACKUP_EXPORTED_AT_STORAGE_KEY, "");

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
    setMessageDraftsRaw([]);
    setCalendarFeedsRaw([]);
    setImportedCalendarEventsRaw([]);
    setPhotoProofsRaw([]);
    setOwnerPortalSharesRaw([]);
    setDamageDepositsRaw([]);
    setPricingNotesRaw([]);
    setRepeatCampaignsRaw([]);
    setTaxPrepPacksRaw([]);
    setMaintenanceApprovalsRaw([]);
    setSettingsRaw(clone(BLANK_SETTINGS));
  };

  const restoreSampleData = () => {
    setSampleClearedFlag(false);
    save(SETUP_PROGRESS_STORAGE_KEY, {});
    save(BACKUP_EXPORTED_AT_STORAGE_KEY, "");

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
    setMessageDrafts([]);
    setCalendarFeeds([]);
    setImportedCalendarEvents([]);
    setPhotoProofs([]);
    setOwnerPortalShares([]);
    setDamageDeposits([]);
    setPricingNotes([]);
    setRepeatCampaigns([]);
    setTaxPrepPacks([]);
    setMaintenanceApprovals([]);
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
      setup_progress: clone(
        JSON.parse(localStorage.getItem(SETUP_PROGRESS_STORAGE_KEY) || "{}")
      ),
      backup_exported_at: localStorage.getItem(BACKUP_EXPORTED_AT_STORAGE_KEY) || "",
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
        messageDrafts: clone(messageDrafts),
        calendarFeeds: clone(calendarFeeds),
        importedCalendarEvents: clone(importedCalendarEvents),
        photoProofs: clone(photoProofs),
        ownerPortalShares: clone(ownerPortalShares),
        damageDeposits: clone(damageDeposits),
        pricingNotes: clone(pricingNotes),
        repeatCampaigns: clone(repeatCampaigns),
        taxPrepPacks: clone(taxPrepPacks),
        maintenanceApprovals: clone(maintenanceApprovals),
        settings: clone(settings),
      },
    };
  };

  const importBackupData = (payload) => {
    const nextData = normalizeImportedBackup(payload);
    const rawSetupProgress =
      payload && typeof payload === "object" ? payload.setup_progress : {};
    const normalizedSetupProgress =
      rawSetupProgress && typeof rawSetupProgress === "object" && !Array.isArray(rawSetupProgress)
        ? rawSetupProgress
        : {};
    const backupExportedAt =
      payload && typeof payload === "object" ? payload.backup_exported_at : "";

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
    save(STORAGE_KEYS.maintenanceApprovals, nextData.maintenanceApprovals);
    save(STORAGE_KEYS.taxPrepPacks, nextData.taxPrepPacks);
    save(STORAGE_KEYS.repeatCampaigns, nextData.repeatCampaigns);
    save(STORAGE_KEYS.pricingNotes, nextData.pricingNotes);
    save(STORAGE_KEYS.damageDeposits, nextData.damageDeposits);
    save(STORAGE_KEYS.ownerPortalShares, nextData.ownerPortalShares);
    save(STORAGE_KEYS.photoProofs, nextData.photoProofs);
    save(STORAGE_KEYS.importedCalendarEvents, nextData.importedCalendarEvents);
    save(STORAGE_KEYS.calendarFeeds, nextData.calendarFeeds);
    save(STORAGE_KEYS.messageDrafts, nextData.messageDrafts);
    save(STORAGE_KEYS.settings, nextData.settings);
    save(SETUP_PROGRESS_STORAGE_KEY, normalizedSetupProgress);
    save(BACKUP_EXPORTED_AT_STORAGE_KEY, String(backupExportedAt || ""));

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
    setMaintenanceApprovalsRaw(nextData.maintenanceApprovals);
    setTaxPrepPacksRaw(nextData.taxPrepPacks);
    setRepeatCampaignsRaw(nextData.repeatCampaigns);
    setPricingNotesRaw(nextData.pricingNotes);
    setDamageDepositsRaw(nextData.damageDeposits);
    setOwnerPortalSharesRaw(nextData.ownerPortalShares);
    setPhotoProofsRaw(nextData.photoProofs);
    setImportedCalendarEventsRaw(nextData.importedCalendarEvents);
    setCalendarFeedsRaw(nextData.calendarFeeds);
    setMessageDraftsRaw(nextData.messageDrafts);
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
        messageDrafts,
        setMessageDrafts,
        calendarFeeds,
        setCalendarFeeds,
        importedCalendarEvents,
        setImportedCalendarEvents,
        photoProofs,
        setPhotoProofs,
        ownerPortalShares,
        setOwnerPortalShares,
        damageDeposits,
        setDamageDeposits,
        pricingNotes,
        setPricingNotes,
        repeatCampaigns,
        setRepeatCampaigns,
        taxPrepPacks,
        setTaxPrepPacks,
        maintenanceApprovals,
        setMaintenanceApprovals,

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
