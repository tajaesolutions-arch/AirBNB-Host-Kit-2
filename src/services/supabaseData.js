import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
}

export async function fetchUserTable(tableName, userId, workspaceId = null) {
  requireSupabase();
  let query = supabase
    .from(tableName)
    .select("*")
    .eq("user_id", userId);
  if (workspaceId) query = query.eq("workspace_id", workspaceId);
  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

export async function upsertUserRows(tableName, rows, userId, conflictColumn, workspaceId = null) {
  requireSupabase();
  const payload = (rows || []).map((row) => ({
    ...sanitizeTableRow(tableName, row),
    user_id: userId,
    workspace_id: workspaceId || row?.workspace_id || null,
  }));
  if (payload.length === 0) return [];
  const { data, error } = await supabase
    .from(tableName)
    .upsert(payload, { onConflict: `user_id,${conflictColumn}` })
    .select("*");
  if (error) throw error;
  return data || [];
}

export function emptyToNull(value) {
  return value === "" || value === undefined ? null : value;
}

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};
const toBoolean = (value) => Boolean(value);
const toArray = (value) => (Array.isArray(value) ? value : []);

const sanitizeProperty = (r = {}) => ({
  property_id: r.property_id || "",
  property_name: r.property_name || "",
  parish_town: r.parish_town || "",
  property_type: r.property_type || "",
  bedrooms: toNumber(r.bedrooms), bathrooms: toNumber(r.bathrooms), max_guests: toNumber(r.max_guests),
  owner_name: r.owner_name || "", owner_email: r.owner_email || "",
  default_nightly_rate: toNumber(r.default_nightly_rate), default_cleaning_fee: toNumber(r.default_cleaning_fee),
  default_checkin_time: r.default_checkin_time || "", default_checkout_time: r.default_checkout_time || "",
  wifi_name: r.wifi_name || "", wifi_password: r.wifi_password || "", address: r.address || "",
  active: toBoolean(r.active), notes: r.notes || "", country: r.country || "", timezone: r.timezone || "",
});
const sanitizeBooking = (r = {}) => ({
  booking_id: r.booking_id || "", property_id: r.property_id || "", guest_id: r.guest_id || "", guest_name: r.guest_name || "",
  platform: r.platform || "", checkin_date: emptyToNull(r.checkin_date), checkout_date: emptyToNull(r.checkout_date), nightly_rate: toNumber(r.nightly_rate),
  cleaning_fee: toNumber(r.cleaning_fee), extra_fees: toNumber(r.extra_fees), discounts: toNumber(r.discounts), payment_status: r.payment_status || "",
  booking_status: r.booking_status || "", source_notes: r.source_notes || "", deposit_status: r.deposit_status || "", damage_status: r.damage_status || "",
  refund_status: r.refund_status || "", review_followup_status: r.review_followup_status || "",
});
const sanitizeGuest = (r = {}) => ({
  guest_id: r.guest_id || "", guest_name: r.guest_name || "", country: r.country || "", email: r.email || "", phone: r.phone || "",
  review_left: toBoolean(r.review_left), direct_followup_sent: toBoolean(r.direct_followup_sent), preferences: r.preferences || "", notes: r.notes || "",
  last_contacted_date: emptyToNull(r.last_contacted_date), next_followup_date: emptyToNull(r.next_followup_date), tags: toArray(r.tags),
});
const sanitizeCleaningTask = (r = {}) => ({
  cleaning_id: r.cleaning_id || "", property_id: r.property_id || "", booking_id: r.booking_id || "", checkout_date: emptyToNull(r.checkout_date), next_checkin_date: emptyToNull(r.next_checkin_date),
  cleaner_name: r.cleaner_name || "", cleaning_status: r.cleaning_status || "", linen_status: r.linen_status || "", damage_check: r.damage_check || "",
  supplies_restocked: toBoolean(r.supplies_restocked), photos_uploaded: toBoolean(r.photos_uploaded), time_completed: r.time_completed || "", cleaning_cost: toNumber(r.cleaning_cost), notes: r.notes || "",
  checklist: toArray(r.checklist),
});
const sanitizeMaintenanceIssue = (r = {}) => ({
  issue_id: r.issue_id || "", property_id: r.property_id || "", issue_title: r.issue_title || "", property_area: r.property_area || "", priority: r.priority || "",
  reported_by: r.reported_by || "", vendor: r.vendor || "", estimated_cost: toNumber(r.estimated_cost), actual_cost: toNumber(r.actual_cost), status: r.status || "",
  reported_date: emptyToNull(r.reported_date), completion_date: emptyToNull(r.completion_date), photo_or_link: r.photo_or_link || "", notes: r.notes || "",
  maintenance_id: r.maintenance_id || "", approval_status: r.approval_status || "",
});
const sanitizeSupply = (r = {}) => ({ supply_id: r.supply_id || "", property_id: r.property_id || "", item_name: r.item_name || "", category: r.category || "", current_quantity: toNumber(r.current_quantity), unit: r.unit || "", reorder_level: toNumber(r.reorder_level), unit_cost: toNumber(r.unit_cost), supplier: r.supplier || "", last_restocked_date: emptyToNull(r.last_restocked_date), notes: r.notes || "" });
const sanitizeExpense = (r = {}) => ({ expense_id: r.expense_id || "", property_id: r.property_id || "", expense_date: emptyToNull(r.expense_date), category: r.category || "", vendor: r.vendor || "", description: r.description || "", amount: toNumber(r.amount), reimbursable: toBoolean(r.reimbursable), paid_by: r.paid_by || "", receipt_link: r.receipt_link || "", notes: r.notes || "" });
const sanitizeLead = (r = {}) => {
  const leadName = r.lead_name || r.full_name || "";
  const propertyInterested = r.property_interested || r.property_id || "";
  return {
    lead_id: r.lead_id || "", lead_name: leadName, source: r.source || "", phone: r.phone || "", email: r.email || "", property_interested: propertyInterested,
    dates_requested: r.dates_requested || "", number_of_guests: toNumber(r.number_of_guests), budget: toNumber(r.budget), quote_sent: toBoolean(r.quote_sent),
    followup_date: emptyToNull(r.followup_date), status: r.status || "", message_template_used: r.message_template_used || "", notes: r.notes || "",
    full_name: r.full_name || "", property_id: r.property_id || "",
  };
};

function sanitizeTableRow(tableName, row) {
  if (!row || typeof row !== "object") return {};
  const sanitizers = { properties: sanitizeProperty, bookings: sanitizeBooking, guests: sanitizeGuest, cleaning_tasks: sanitizeCleaningTask, maintenance_issues: sanitizeMaintenanceIssue, supplies: sanitizeSupply, expenses: sanitizeExpense, direct_booking_leads: sanitizeLead };
  return sanitizers[tableName] ? sanitizers[tableName](row) : { ...row };
}

export async function deleteUserRow(tableName, idColumn, idValue, userId) {
  requireSupabase();
  const { error } = await supabase
    .from(tableName)
    .delete()
    .eq("user_id", userId)
    .eq(idColumn, idValue);
  if (error) throw error;
}

export async function fetchUserSettings(userId) {
  requireSupabase();
  const { data, error } = await supabase
    .from("settings")
    .select("data")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data?.data || null;
}

export async function upsertUserSettings(userId, data) {
  requireSupabase();
  const { error } = await supabase
    .from("settings")
    .upsert({ user_id: userId, data }, { onConflict: "user_id" });
  if (error) throw error;
}
