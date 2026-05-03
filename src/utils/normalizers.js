const asObject = (value) =>
  value && typeof value === "object" && !Array.isArray(value) ? value : {};

const asArray = (value) => (Array.isArray(value) ? value : []);
const asString = (value, fallback = "") => (value == null ? fallback : String(value));
const asNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const applyDefaults = (value, defaults) => ({
  ...asObject(value),
  ...Object.fromEntries(
    Object.entries(defaults).map(([key, fallback]) => [
      key,
      value?.[key] ?? fallback,
    ])
  ),
});

export function normalizeSettings(value = {}) {
  const raw = asObject(value);

  return {
    ...raw,
    country: asString(raw.country),
    currency: asString(raw.currency || raw.default_currency || "JMD"),
    tax_label: asString(raw.tax_label),
    date_format: asString(raw.date_format),
    timezone: asString(raw.timezone),
    cleaners: asArray(raw.cleaners),
    vendors: asArray(raw.vendors),
    platform_fee_percentage: asNumber(raw.platform_fee_percentage, 0),
    management_fee_percentage: asNumber(raw.management_fee_percentage, 0),
    tax_reserve_percentage: asNumber(raw.tax_reserve_percentage, 0),
  };
}

export const normalizeProperty = (value = {}) =>
  applyDefaults(value, {
    property_id: "",
    property_name: "",
    active: true,
    country: "",
    timezone: "",
  });

export const normalizeBooking = (value = {}) => {
  const raw = applyDefaults(value, {
    booking_id: "",
    property_id: "",
    guest_name: "",
    checkin_date: "",
    checkout_date: "",
    nightly_rate: 0,
    booking_status: "",
    deposit_status: "Not Required",
    damage_status: "Not Checked",
    refund_status: "Not Applicable",
    review_followup_status: "Not Requested",
  });

  return {
    ...raw,
    nightly_rate: asNumber(raw.nightly_rate, 0),
  };
};

export const normalizeGuest = (value = {}) => {
  const raw = applyDefaults(value, {
    guest_id: "",
    guest_name: "",
    email: "",
    phone: "",
    tags: [],
  });

  return { ...raw, tags: asArray(raw.tags) };
};

export const normalizeCleaningTask = (value = {}) => {
  const raw = applyDefaults(value, {
    cleaning_id: "",
    property_id: "",
    cleaning_status: "",
    checklist: [],
    checkout_date: "",
  });

  return { ...raw, checklist: asArray(raw.checklist) };
};

export const normalizeMaintenanceIssue = (value = {}) =>
  applyDefaults(value, {
    maintenance_id: "",
    property_id: "",
    status: "",
    priority: "",
    approval_status: "Not Required",
  });

export const normalizeSupply = (value = {}) => {
  const raw = applyDefaults(value, {
    supply_id: "",
    property_id: "",
    item_name: "",
    current_quantity: 0,
    reorder_level: 0,
  });

  return {
    ...raw,
    current_quantity: asNumber(raw.current_quantity, 0),
    reorder_level: asNumber(raw.reorder_level, 0),
  };
};

export const normalizeExpense = (value = {}) => {
  const raw = applyDefaults(value, {
    expense_id: "",
    property_id: "",
    category: "",
    amount: 0,
    expense_date: "",
  });

  return { ...raw, amount: asNumber(raw.amount, 0) };
};

export const normalizeLead = (value = {}) =>
  applyDefaults(value, {
    lead_id: "",
    property_id: "",
    full_name: "",
    status: "",
    source: "",
  });

export const normalizeCalendarEvent = (value = {}) =>
  applyDefaults(value, {
    event_id: "",
    property_id: "",
    title: "",
    start_date: "",
    end_date: "",
    all_day: false,
  });

export const normalizeQuote = (value = {}) => {
  const raw = applyDefaults(value, {
    quote_id: "",
    property_id: "",
    guest_name: "",
    checkin_date: "",
    checkout_date: "",
    total: 0,
  });

  return { ...raw, total: asNumber(raw.total, 0) };
};

export const normalizeMessageHistoryItem = (value = {}) =>
  applyDefaults(value, {
    message_id: "",
    channel: "",
    guest_name: "",
    content: "",
    sent_at: "",
  });

export const normalizeReviewTask = (value = {}) =>
  applyDefaults(value, {
    review_task_id: "",
    booking_id: "",
    review_followup_status: "Not Requested",
    due_date: "",
    completed: false,
  });

export function normalizeCollection(value, normalizer) {
  return asArray(value).map((item) => normalizer(item));
}
