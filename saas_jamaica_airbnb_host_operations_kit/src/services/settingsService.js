import { supabase } from "../lib/supabaseClient.js";

export const settingsService = {
  async get(userId) {
    const { data, error } = await supabase.from("settings").select("data").eq("user_id", userId).maybeSingle();
    if (error && error.code !== "PGRST116") throw error;
    return data?.data || null;
  },
  async upsert(userId, data) {
    const { data: saved, error } = await supabase
      .from("settings")
      .upsert({ user_id: userId, data, updated_at: new Date().toISOString() }, { onConflict: "user_id" })
      .select("*")
      .single();
    if (error) throw error;
    return saved;
  },
};
