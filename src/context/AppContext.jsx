import { createContext, useContext, useState, useEffect } from "react";
import {
  SAMPLE_PROPERTIES, SAMPLE_BOOKINGS, SAMPLE_GUESTS, SAMPLE_CLEANING,
  SAMPLE_MAINTENANCE, SAMPLE_SUPPLIES, SAMPLE_EXPENSES, SAMPLE_LEADS,
  DEFAULT_SETTINGS,
} from "../data/sampleData.js";

const AppContext = createContext(null);

const load = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
};

const save = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

export function AppProvider({ children }) {
  const [properties, setPropertiesRaw]  = useState(() => load("jak_properties",  SAMPLE_PROPERTIES));
  const [bookings,   setBookingsRaw]    = useState(() => load("jak_bookings",    SAMPLE_BOOKINGS));
  const [guests,     setGuestsRaw]      = useState(() => load("jak_guests",      SAMPLE_GUESTS));
  const [cleaning,   setCleaningRaw]    = useState(() => load("jak_cleaning",    SAMPLE_CLEANING));
  const [maintenance,setMaintenanceRaw] = useState(() => load("jak_maintenance", SAMPLE_MAINTENANCE));
  const [supplies,   setSuppliesRaw]    = useState(() => load("jak_supplies",    SAMPLE_SUPPLIES));
  const [expenses,   setExpensesRaw]    = useState(() => load("jak_expenses",    SAMPLE_EXPENSES));
  const [leads,      setLeadsRaw]       = useState(() => load("jak_leads",       SAMPLE_LEADS));
  const [settings,   setSettingsRaw]    = useState(() => load("jak_settings",    DEFAULT_SETTINGS));

  const persist = (key, setter) => (val) => {
    setter(val);
    save(key, val);
  };

  const setProperties  = persist("jak_properties",  setPropertiesRaw);
  const setBookings    = persist("jak_bookings",    setBookingsRaw);
  const setGuests      = persist("jak_guests",      setGuestsRaw);
  const setCleaning    = persist("jak_cleaning",    setCleaningRaw);
  const setMaintenance = persist("jak_maintenance", setMaintenanceRaw);
  const setSupplies    = persist("jak_supplies",    setSuppliesRaw);
  const setExpenses    = persist("jak_expenses",    setExpensesRaw);
  const setLeads       = persist("jak_leads",       setLeadsRaw);
  const setSettings    = persist("jak_settings",    setSettingsRaw);

  const resetToSampleData = () => {
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
    <AppContext.Provider value={{
      properties, setProperties,
      bookings,   setBookings,
      guests,     setGuests,
      cleaning,   setCleaning,
      maintenance, setMaintenance,
      supplies,   setSupplies,
      expenses,   setExpenses,
      leads,      setLeads,
      settings,   setSettings,
      resetToSampleData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
};
