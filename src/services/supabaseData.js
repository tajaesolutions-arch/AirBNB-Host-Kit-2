import { supabase, isSupabaseConfigured } from "../lib/supabaseClient.js";

function requireSupabase() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.");
  }
}

export async function fetchUserTable(tableName, userId) {
  requireSupabase();
  const { data, error } = await supabase
    .from(tableName)
    .select("*")
    .eq("user_id", userId);
  if (error) throw error;
  return data || [];
}

export async function upsertUserRows(tableName, rows, userId, conflictColumn) {
  requireSupabase();
  const payload = (rows || []).map((row) => ({
    ...sanitizeTableRow(tableName, row),
    user_id: userId,
  }));
  if (payload.length === 0) return [];
  const { data, error } = await supabase
    .from(tableName)
    .upsert(payload, { onConflict: `user_id,${conflictColumn}` })
    .select("*");
  if (error) throw error;
  return data || [];
}

const TABLE_COLUMNS = {
  properties: ["property_id", "property_name", "parish_town", "property_type", "bedrooms", "bathrooms", "max_guests", "owner_name", "owner_email", "default_nightly_rate", "default_cleaning_fee", "default_checkin_time", "default_checkout_time", "wifi_name", "wifi_password", "address", "active", "notes", "airbnb_ical_url", "vrbo_ical_url", "booking_ical_url", "last_calendar_sync_at"],
  bookings: ["booking_id", "property_id", "guest_id", "guest_name", "platform", "checkin_date", "checkout_date", "nightly_rate", "cleaning_fee", "extra_fees", "discounts", "payment_status", "booking_status", "source_notes", "security_deposit_required", "security_deposit_amount", "deposit_paid_amount", "deposit_due_date", "deposit_status", "damage_status", "damage_description", "damage_photo_or_link", "amount_deducted", "refund_due_date", "refund_status", "review_request_sent", "review_request_date", "review_received", "review_score", "review_public_text", "host_response", "review_followup_status"],
  guests: ["guest_id", "guest_name", "country", "email", "phone", "review_left", "direct_followup_sent", "preferences", "notes", "last_contacted_date", "next_followup_date"],
  cleaning_tasks: ["cleaning_id", "property_id", "booking_id", "checkout_date", "next_checkin_date", "cleaner_name", "cleaning_status", "linen_status", "damage_check", "supplies_restocked", "photos_uploaded", "time_completed", "cleaning_cost", "notes", "checklist"],
  maintenance_issues: ["issue_id", "property_id", "issue_title", "property_area", "priority", "reported_by", "vendor", "estimated_cost", "actual_cost", "status", "reported_date", "completion_date", "photo_or_link", "notes", "owner_approval_required", "approval_status", "approval_requested_date", "approval_response_date", "owner_approval_notes", "vendor_quote_link", "before_photo_link", "after_photo_link"],
  supplies: ["supply_id", "property_id", "item_name", "category", "current_quantity", "unit", "reorder_level", "unit_cost", "supplier", "last_restocked_date", "notes"],
  expenses: ["expense_id", "property_id", "expense_date", "category", "vendor", "description", "amount", "reimbursable", "paid_by", "receipt_link", "notes"],
  direct_booking_leads: ["lead_id", "lead_name", "source", "phone", "email", "property_interested", "dates_requested", "number_of_guests", "budget", "quote_sent", "followup_date", "status", "message_template_used", "notes"],
};

function sanitizeTableRow(tableName, row) {
  if (!row || typeof row !== "object") return {};
  const allowed = TABLE_COLUMNS[tableName];
  if (!allowed) return { ...row };
  const sanitized = Object.fromEntries(allowed.filter((key) => key in row).map((key) => [key, row[key]]));
  if (tableName === "cleaning_tasks") {
    sanitized.checklist = Array.isArray(row.checklist) ? row.checklist : [];
  }
  return sanitized;
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
