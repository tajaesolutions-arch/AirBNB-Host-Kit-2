import { createContext, useContext, useEffect, useState } from "react";
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
import { useAuth } from "../auth/AuthContext.jsx";
import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

const AppContext = createContext(null);
const BACKUP_VERSION = 1;
const SETUP_PROGRESS_STORAGE_KEY = "jak_dashboard_setup_progress";
const BACKUP_EXPORTED_AT_STORAGE_KEY = "jak_backup_exported_at";
const BLANK_SETTINGS = {
  default_currency: "JMD", airbnb_currency: "USD", platform_fee_percentage: 0, management_fee_percentage: 0, tax_reserve_percentage: 0,
  default_checkin_time: "", default_checkout_time: "", business_name: "", host_name: "", host_phone: "", host_email: "", cleaners: [], vendors: [],
};
const clone = (v) => JSON.parse(JSON.stringify(v));
const safeArray = (v) => (Array.isArray(v) ? v : []);
const safeSettings = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return clone(BLANK_SETTINGS);
  const merged = { ...clone(BLANK_SETTINGS), ...value, cleaners: safeArray(value.cleaners), vendors: safeArray(value.vendors) };
  return { ...merged, default_currency: normalizeCurrency(merged.default_currency || "JMD"), airbnb_currency: normalizeCurrency(merged.airbnb_currency || "USD") };
};
const normalizeImportedBackup = (payload) => {
  const source = payload && typeof payload === "object" && payload.data ? payload.data : payload;
  if (!source || typeof source !== "object" || Array.isArray(source)) throw new Error("Invalid backup file. The file does not contain app data.");
  return {
    properties: normalizeCollection(source.properties, normalizeProperty), bookings: normalizeCollection(source.bookings, normalizeBooking),
    guests: normalizeCollection(source.guests, normalizeGuest), cleaning: normalizeCollection(source.cleaning, normalizeCleaningTask),
    maintenance: normalizeCollection(source.maintenance, normalizeMaintenanceIssue), supplies: normalizeCollection(source.supplies, normalizeSupply),
    expenses: normalizeCollection(source.expenses, normalizeExpense), leads: normalizeCollection(source.leads, normalizeLead),
    calendarEvents: normalizeCollection(source.calendarEvents, normalizeCalendarEvent), quotes: normalizeCollection(source.quotes, normalizeQuote),
    messageHistory: normalizeCollection(source.messageHistory, normalizeMessageHistoryItem), reviewTasks: normalizeCollection(source.reviewTasks, normalizeReviewTask),
    messageDrafts: safeArray(source.messageDrafts), calendarFeeds: safeArray(source.calendarFeeds), importedCalendarEvents: safeArray(source.importedCalendarEvents),
    photoProofs: safeArray(source.photoProofs), ownerPortalShares: safeArray(source.ownerPortalShares), damageDeposits: safeArray(source.damageDeposits),
    pricingNotes: safeArray(source.pricingNotes), repeatCampaigns: safeArray(source.repeatCampaigns), taxPrepPacks: safeArray(source.taxPrepPacks),
    maintenanceApprovals: safeArray(source.maintenanceApprovals), settings: normalizeSettings(safeSettings(source.settings)),
  };
};

const COLLECTIONS = {
  properties: { table: "properties", idField: "property_id", normalize: (v) => normalizeCollection(v, normalizeProperty) },
  bookings: { table: "bookings", idField: "booking_id", normalize: (v) => normalizeCollection(v, normalizeBooking) },
  guests: { table: "guests", idField: "guest_id", normalize: (v) => normalizeCollection(v, normalizeGuest) },
  cleaning: { table: "cleaning_tasks", idField: "cleaning_id", normalize: (v) => normalizeCollection(v, normalizeCleaningTask) },
  maintenance: { table: "maintenance_issues", idField: "issue_id", normalize: (v) => normalizeCollection(v, normalizeMaintenanceIssue) },
  supplies: { table: "supplies", idField: "supply_id", normalize: (v) => normalizeCollection(v, normalizeSupply) },
  expenses: { table: "expenses", idField: "expense_id", normalize: (v) => normalizeCollection(v, normalizeExpense) },
  leads: { table: "direct_booking_leads", idField: "lead_id", normalize: (v) => normalizeCollection(v, normalizeLead) },
};

export function AppProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const signedInUserId = isSupabaseConfigured && supabase && user?.id && user.id !== "local" ? user.id : "";
  const getStorageKey = (baseKey) => (user?.id ? `jak_${user.id}_${baseKey}` : `jak_anonymous_${baseKey}`);
  const loadScoped = (baseKey, fallback) => { try { const raw = localStorage.getItem(getStorageKey(baseKey)); return raw !== null ? JSON.parse(raw) : clone(fallback); } catch { return clone(fallback); } };
  const saveScoped = (baseKey, value) => { try { localStorage.setItem(getStorageKey(baseKey), JSON.stringify(value)); } catch {} };

  const [properties, setPropertiesRaw] = useState([]); const [bookings, setBookingsRaw] = useState([]); const [guests, setGuestsRaw] = useState([]);
  const [cleaning, setCleaningRaw] = useState([]); const [maintenance, setMaintenanceRaw] = useState([]); const [supplies, setSuppliesRaw] = useState([]);
  const [expenses, setExpensesRaw] = useState([]); const [leads, setLeadsRaw] = useState([]); const [settings, setSettingsRaw] = useState(normalizeSettings(clone(BLANK_SETTINGS)));
  const [calendarEvents, setCalendarEventsRaw] = useState([]); const [quotes, setQuotesRaw] = useState([]); const [messageHistory, setMessageHistoryRaw] = useState([]); const [reviewTasks, setReviewTasksRaw] = useState([]);
  const [messageDrafts, setMessageDraftsRaw] = useState([]); const [calendarFeeds, setCalendarFeedsRaw] = useState([]); const [importedCalendarEvents, setImportedCalendarEventsRaw] = useState([]);
  const [photoProofs, setPhotoProofsRaw] = useState([]); const [ownerPortalShares, setOwnerPortalSharesRaw] = useState([]); const [damageDeposits, setDamageDepositsRaw] = useState([]);
  const [pricingNotes, setPricingNotesRaw] = useState([]); const [repeatCampaigns, setRepeatCampaignsRaw] = useState([]); const [taxPrepPacks, setTaxPrepPacksRaw] = useState([]); const [maintenanceApprovals, setMaintenanceApprovalsRaw] = useState([]);
  const [dataLoading, setDataLoading] = useState(true); const [dataError, setDataError] = useState("");

  const persistCollection = async ({ table, idField, previousRows, nextRows }) => {
    if (!signedInUserId) return false;
    const nextIds = new Set(nextRows.map((r) => r?.[idField]).filter(Boolean));
    const removedIds = previousRows.map((r) => r?.[idField]).filter((id) => id && !nextIds.has(id));
    const payload = nextRows.filter((r) => r?.[idField]).map((row) => ({ ...row, user_id: signedInUserId }));
    const { error: upsertError } = await supabase.from(table).upsert(payload, { onConflict: `user_id,${idField}` });
    if (upsertError) throw upsertError;
    if (removedIds.length > 0) {
      const { error: deleteError } = await supabase.from(table).delete().eq("user_id", signedInUserId).in(idField, removedIds);
      if (deleteError) throw deleteError;
    }
    return true;
  };

  useEffect(() => {
    const loadData = async () => {
      if (authLoading) { setDataLoading(true); setDataError(""); return; }
      setDataError(""); setDataLoading(true);
      if (!signedInUserId) {
        setPropertiesRaw(COLLECTIONS.properties.normalize(loadScoped("properties", [])));
        setBookingsRaw(COLLECTIONS.bookings.normalize(loadScoped("bookings", [])));
        setGuestsRaw(COLLECTIONS.guests.normalize(loadScoped("guests", [])));
        setCleaningRaw(COLLECTIONS.cleaning.normalize(loadScoped("cleaning", [])));
        setMaintenanceRaw(COLLECTIONS.maintenance.normalize(loadScoped("maintenance", [])));
        setSuppliesRaw(COLLECTIONS.supplies.normalize(loadScoped("supplies", [])));
        setExpensesRaw(COLLECTIONS.expenses.normalize(loadScoped("expenses", [])));
        setLeadsRaw(COLLECTIONS.leads.normalize(loadScoped("leads", [])));
        setSettingsRaw(normalizeSettings(safeSettings(loadScoped("settings", BLANK_SETTINGS))));
        setCalendarEventsRaw(normalizeCollection(loadScoped("calendarEvents", []), normalizeCalendarEvent));
        setQuotesRaw(normalizeCollection(loadScoped("quotes", []), normalizeQuote));
        setMessageHistoryRaw(normalizeCollection(loadScoped("messageHistory", []), normalizeMessageHistoryItem));
        setReviewTasksRaw(normalizeCollection(loadScoped("reviewTasks", []), normalizeReviewTask));
        setMessageDraftsRaw(safeArray(loadScoped("messageDrafts", []))); setCalendarFeedsRaw(safeArray(loadScoped("calendarFeeds", [])));
        setImportedCalendarEventsRaw(safeArray(loadScoped("importedCalendarEvents", []))); setPhotoProofsRaw(safeArray(loadScoped("photoProofs", [])));
        setOwnerPortalSharesRaw(safeArray(loadScoped("ownerPortalShares", []))); setDamageDepositsRaw(safeArray(loadScoped("damageDeposits", [])));
        setPricingNotesRaw(safeArray(loadScoped("pricingNotes", []))); setRepeatCampaignsRaw(safeArray(loadScoped("repeatCampaigns", [])));
        setTaxPrepPacksRaw(safeArray(loadScoped("taxPrepPacks", []))); setMaintenanceApprovalsRaw(safeArray(loadScoped("maintenanceApprovals", [])));
        setDataLoading(false); return;
      }
      try {
        const queries = Object.entries(COLLECTIONS).map(async ([key, cfg]) => {
          const { data, error } = await supabase.from(cfg.table).select("*").eq("user_id", signedInUserId);
          if (error) throw new Error(`${key}: ${error.message}`);
          return [key, cfg.normalize(data || [])];
        });
        const settingsQuery = supabase.from("settings").select("data").eq("user_id", signedInUserId).maybeSingle();
        const results = await Promise.all(queries);
        const next = Object.fromEntries(results);
        const { data: settingsRow, error: settingsError } = await settingsQuery;
        if (settingsError) throw settingsError;
        const nextSettings = settingsRow?.data ? normalizeSettings(safeSettings(settingsRow.data)) : normalizeSettings(clone(BLANK_SETTINGS));
        if (!settingsRow) await supabase.from("settings").upsert({ user_id: signedInUserId, data: nextSettings }, { onConflict: "user_id" });
        setPropertiesRaw(next.properties); setBookingsRaw(next.bookings); setGuestsRaw(next.guests); setCleaningRaw(next.cleaning); setMaintenanceRaw(next.maintenance);
        setSuppliesRaw(next.supplies); setExpensesRaw(next.expenses); setLeadsRaw(next.leads); setSettingsRaw(nextSettings);
        setCalendarEventsRaw(safeArray(loadScoped("calendarEvents", []))); setQuotesRaw(safeArray(loadScoped("quotes", []))); setMessageHistoryRaw(safeArray(loadScoped("messageHistory", [])));
        setReviewTasksRaw(safeArray(loadScoped("reviewTasks", []))); setMessageDraftsRaw(safeArray(loadScoped("messageDrafts", []))); setCalendarFeedsRaw(safeArray(loadScoped("calendarFeeds", [])));
        setImportedCalendarEventsRaw(safeArray(loadScoped("importedCalendarEvents", []))); setPhotoProofsRaw(safeArray(loadScoped("photoProofs", []))); setOwnerPortalSharesRaw(safeArray(loadScoped("ownerPortalShares", [])));
        setDamageDepositsRaw(safeArray(loadScoped("damageDeposits", []))); setPricingNotesRaw(safeArray(loadScoped("pricingNotes", []))); setRepeatCampaignsRaw(safeArray(loadScoped("repeatCampaigns", [])));
        setTaxPrepPacksRaw(safeArray(loadScoped("taxPrepPacks", []))); setMaintenanceApprovalsRaw(safeArray(loadScoped("maintenanceApprovals", [])));
      } catch (err) { setDataError(err?.message || "Failed to load your workspace data."); }
      finally { setDataLoading(false); }
    };
    void loadData();
  }, [authLoading, signedInUserId]);

  const makeSetter = (setRaw, baseKey, normalizer, remote) => (valueOrUpdater) => {
    setRaw((prev) => {
      const next = normalizer(typeof valueOrUpdater === "function" ? valueOrUpdater(prev) : valueOrUpdater);
      saveScoped(baseKey, next);
      if (signedInUserId && remote) persistCollection({ ...remote, previousRows: prev, nextRows: next }).catch((e) => setDataError(e?.message || "Sync failed"));
      return next;
    });
  };

  const setProperties = makeSetter(setPropertiesRaw, "properties", COLLECTIONS.properties.normalize, { table: "properties", idField: "property_id" });
  const setBookings = makeSetter(setBookingsRaw, "bookings", COLLECTIONS.bookings.normalize, { table: "bookings", idField: "booking_id" });
  const setGuests = makeSetter(setGuestsRaw, "guests", COLLECTIONS.guests.normalize, { table: "guests", idField: "guest_id" });
  const setCleaning = makeSetter(setCleaningRaw, "cleaning", COLLECTIONS.cleaning.normalize, { table: "cleaning_tasks", idField: "cleaning_id" });
  const setMaintenance = makeSetter(setMaintenanceRaw, "maintenance", COLLECTIONS.maintenance.normalize, { table: "maintenance_issues", idField: "issue_id" });
  const setSupplies = makeSetter(setSuppliesRaw, "supplies", COLLECTIONS.supplies.normalize, { table: "supplies", idField: "supply_id" });
  const setExpenses = makeSetter(setExpensesRaw, "expenses", COLLECTIONS.expenses.normalize, { table: "expenses", idField: "expense_id" });
  const setLeads = makeSetter(setLeadsRaw, "leads", COLLECTIONS.leads.normalize, { table: "direct_booking_leads", idField: "lead_id" });
  const setSettings = (valueOrUpdater) => setSettingsRaw((prev) => { const next = normalizeSettings(safeSettings(typeof valueOrUpdater === "function" ? valueOrUpdater(prev) : valueOrUpdater)); saveScoped("settings", next); if (signedInUserId) supabase.from("settings").upsert({ user_id: signedInUserId, data: next }, { onConflict: "user_id" }).then(({ error }) => { if (error) setDataError(error.message); }); return next; });

  const simple = (setter, key, n = safeArray) => makeSetter(setter, key, n, null);
  const setCalendarEvents = simple(setCalendarEventsRaw, "calendarEvents", (v) => normalizeCollection(v, normalizeCalendarEvent));
  const setQuotes = simple(setQuotesRaw, "quotes", (v) => normalizeCollection(v, normalizeQuote));
  const setMessageHistory = simple(setMessageHistoryRaw, "messageHistory", (v) => normalizeCollection(v, normalizeMessageHistoryItem));
  const setReviewTasks = simple(setReviewTasksRaw, "reviewTasks", (v) => normalizeCollection(v, normalizeReviewTask));
  const setMessageDrafts = simple(setMessageDraftsRaw, "messageDrafts"); const setCalendarFeeds = simple(setCalendarFeedsRaw, "calendarFeeds"); const setImportedCalendarEvents = simple(setImportedCalendarEventsRaw, "importedCalendarEvents");
  const setPhotoProofs = simple(setPhotoProofsRaw, "photoProofs"); const setOwnerPortalShares = simple(setOwnerPortalSharesRaw, "ownerPortalShares"); const setDamageDeposits = simple(setDamageDepositsRaw, "damageDeposits");
  const setPricingNotes = simple(setPricingNotesRaw, "pricingNotes"); const setRepeatCampaigns = simple(setRepeatCampaignsRaw, "repeatCampaigns"); const setTaxPrepPacks = simple(setTaxPrepPacksRaw, "taxPrepPacks"); const setMaintenanceApprovals = simple(setMaintenanceApprovalsRaw, "maintenanceApprovals");

  const resetToBlankData = async () => {
    const blank = normalizeSettings(clone(BLANK_SETTINGS));
    if (signedInUserId) {
      await Promise.all(Object.values(COLLECTIONS).map((cfg) => supabase.from(cfg.table).delete().eq("user_id", signedInUserId)));
      await supabase.from("settings").upsert({ user_id: signedInUserId, data: blank }, { onConflict: "user_id" });
    }
    setProperties([]); setBookings([]); setGuests([]); setCleaning([]); setMaintenance([]); setSupplies([]); setExpenses([]); setLeads([]);
    setCalendarEvents([]); setQuotes([]); setMessageHistory([]); setReviewTasks([]); setMessageDrafts([]); setCalendarFeeds([]);
    setImportedCalendarEvents([]); setPhotoProofs([]); setOwnerPortalShares([]); setDamageDeposits([]); setPricingNotes([]);
    setRepeatCampaigns([]); setTaxPrepPacks([]); setMaintenanceApprovals([]); setSettings(blank);
  };
  const restoreSampleData = async () => { const sample = { properties:SAMPLE_PROPERTIES, bookings:SAMPLE_BOOKINGS, guests:SAMPLE_GUESTS, cleaning:SAMPLE_CLEANING, maintenance:SAMPLE_MAINTENANCE, supplies:SAMPLE_SUPPLIES, expenses:SAMPLE_EXPENSES, leads:SAMPLE_LEADS, settings:DEFAULT_SETTINGS }; await importBackupData({ data: sample }); };
  const resetToSampleData = restoreSampleData;
  const updateCurrency = (nextCurrency) => setSettings((p) => ({ ...p, default_currency: normalizeCurrency(nextCurrency) }));
  const getBackupData = () => ({ app: "AirBNB Host Kit", backup_version: BACKUP_VERSION, exported_at: new Date().toISOString(), setup_progress: clone(JSON.parse(localStorage.getItem(SETUP_PROGRESS_STORAGE_KEY) || "{}")), backup_exported_at: localStorage.getItem(BACKUP_EXPORTED_AT_STORAGE_KEY) || "", data: { properties: clone(properties), bookings: clone(bookings), guests: clone(guests), cleaning: clone(cleaning), maintenance: clone(maintenance), supplies: clone(supplies), expenses: clone(expenses), leads: clone(leads), calendarEvents: clone(calendarEvents), quotes: clone(quotes), messageHistory: clone(messageHistory), reviewTasks: clone(reviewTasks), messageDrafts: clone(messageDrafts), calendarFeeds: clone(calendarFeeds), importedCalendarEvents: clone(importedCalendarEvents), photoProofs: clone(photoProofs), ownerPortalShares: clone(ownerPortalShares), damageDeposits: clone(damageDeposits), pricingNotes: clone(pricingNotes), repeatCampaigns: clone(repeatCampaigns), taxPrepPacks: clone(taxPrepPacks), maintenanceApprovals: clone(maintenanceApprovals), settings: clone(settings) } });
  const importBackupData = async (payload) => { if (JSON.stringify(payload).length > 5 * 1024 * 1024) throw new Error("Backup file is too large. Maximum size is 5MB."); const next = normalizeImportedBackup(payload); setProperties(next.properties); setBookings(next.bookings); setGuests(next.guests); setCleaning(next.cleaning); setMaintenance(next.maintenance); setSupplies(next.supplies); setExpenses(next.expenses); setLeads(next.leads); setCalendarEvents(next.calendarEvents); setQuotes(next.quotes); setMessageHistory(next.messageHistory); setReviewTasks(next.reviewTasks); setMessageDrafts(next.messageDrafts); setCalendarFeeds(next.calendarFeeds); setImportedCalendarEvents(next.importedCalendarEvents); setPhotoProofs(next.photoProofs); setOwnerPortalShares(next.ownerPortalShares); setDamageDeposits(next.damageDeposits); setPricingNotes(next.pricingNotes); setRepeatCampaigns(next.repeatCampaigns); setTaxPrepPacks(next.taxPrepPacks); setMaintenanceApprovals(next.maintenanceApprovals); setSettings(next.settings); return next; };

  return <AppContext.Provider value={{ properties, setProperties, bookings, setBookings, guests, setGuests, cleaning, setCleaning, maintenance, setMaintenance, supplies, setSupplies, expenses, setExpenses, leads, setLeads, calendarEvents, setCalendarEvents, quotes, setQuotes, messageHistory, setMessageHistory, reviewTasks, setReviewTasks, messageDrafts, setMessageDrafts, calendarFeeds, setCalendarFeeds, importedCalendarEvents, setImportedCalendarEvents, photoProofs, setPhotoProofs, ownerPortalShares, setOwnerPortalShares, damageDeposits, setDamageDeposits, pricingNotes, setPricingNotes, repeatCampaigns, setRepeatCampaigns, taxPrepPacks, setTaxPrepPacks, maintenanceApprovals, setMaintenanceApprovals, settings, setSettings, updateCurrency, resetToBlankData, resetToSampleData, restoreSampleData, getBackupData, importBackupData, dataLoading: authLoading ? true : dataLoading, dataError: authLoading ? "" : dataError }}>{children}</AppContext.Provider>;
}

export const useApp = () => { const ctx = useContext(AppContext); if (!ctx) throw new Error("useApp must be used within AppProvider"); return ctx; };
