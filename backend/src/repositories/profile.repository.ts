import { supabaseAdmin } from '../config/supabase';

export const profileRepository = {
  async findById(id: string) {
    const { data, error } = await supabaseAdmin.from('profiles').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async update(id: string, payload: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async list(filters: { role?: string; status?: string; q?: string; page: number; page_size: number }) {
    let query = supabaseAdmin.from('profiles').select('*', { count: 'exact' });
    if (filters.role) query = query.eq('role', filters.role);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.q) query = query.ilike('full_name', `%${filters.q}%`);

    const from = (filters.page - 1) * filters.page_size;
    const to = from + filters.page_size - 1;
    query = query.order('created_at', { ascending: false }).range(from, to);

    const { data, error, count } = await query;
    if (error) throw error;
    return { items: data ?? [], total: count ?? 0 };
  },

  async setStatus(id: string, status: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async verifyAgent(id: string) {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_license_verified: true, status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
};
