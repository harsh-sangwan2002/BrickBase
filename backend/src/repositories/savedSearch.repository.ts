import { supabaseAdmin } from '../config/supabase';

export const savedSearchRepository = {
  async create(userId: string, filters: Record<string, unknown>, alertEnabled: boolean) {
    const { data, error } = await supabaseAdmin
      .from('saved_searches')
      .insert({ user_id: userId, filters, alert_enabled: alertEnabled })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async listForUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('saved_searches')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async findById(id: number) {
    const { data, error } = await supabaseAdmin.from('saved_searches').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async setAlertEnabled(id: number, alertEnabled: boolean) {
    const { data, error } = await supabaseAdmin
      .from('saved_searches')
      .update({ alert_enabled: alertEnabled })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async remove(id: number) {
    const { error } = await supabaseAdmin.from('saved_searches').delete().eq('id', id);
    if (error) throw error;
  },

  async listEnabledForAlerts() {
    const { data, error } = await supabaseAdmin.from('saved_searches').select('*').eq('alert_enabled', true);
    if (error) throw error;
    return data ?? [];
  },

  async updateLastNotified(id: number) {
    await supabaseAdmin.from('saved_searches').update({ last_notified_at: new Date().toISOString() }).eq('id', id);
  },
};
