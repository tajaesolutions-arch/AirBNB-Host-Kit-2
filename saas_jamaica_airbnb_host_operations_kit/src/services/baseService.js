import { supabase } from "../lib/supabaseClient.js";

export function createUserOwnedService({ table, idField }) {
  return {
    async list(userId) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },

    async create(userId, record) {
      const payload = { ...record, user_id: userId };
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async upsert(userId, record) {
      const payload = { ...record, user_id: userId, updated_at: new Date().toISOString() };
      const { data, error } = await supabase
        .from(table)
        .upsert(payload, { onConflict: `user_id,${idField}` })
        .select("*");
      if (error) throw error;
      return data;
    },

    async update(userId, recordId, updates) {
      const { data, error } = await supabase
        .from(table)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .eq(idField, recordId)
        .select("*")
        .single();
      if (error) throw error;
      return data;
    },

    async remove(userId, recordId) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("user_id", userId)
        .eq(idField, recordId);
      if (error) throw error;
      return true;
    },
  };
}
