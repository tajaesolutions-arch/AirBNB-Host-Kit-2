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
  const payload = (rows || []).map((row) => ({ ...row, user_id: userId }));
  if (payload.length === 0) return [];
  const { data, error } = await supabase
    .from(tableName)
    .upsert(payload, { onConflict: `user_id,${conflictColumn}` })
    .select("*");
  if (error) throw error;
  return data || [];
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
