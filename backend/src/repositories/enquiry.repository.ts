import { supabaseAdmin } from '../config/supabase';

export const enquiryRepository = {
  async create(propertyId: number, buyerId: string | null, payload: Record<string, unknown>) {
    const { data, error } = await supabaseAdmin
      .from('enquiries')
      .insert({ property_id: propertyId, buyer_id: buyerId, ...payload })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async listForOwner(ownerId: string) {
    const { data, error } = await supabaseAdmin
      .from('enquiries')
      .select('*, properties!inner(id, title, owner_id)')
      .eq('properties.owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listAll() {
    const { data, error } = await supabaseAdmin
      .from('enquiries')
      .select('*, properties(id, title)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async findById(id: number) {
    const { data, error } = await supabaseAdmin
      .from('enquiries')
      .select('*, properties(id, owner_id, title)')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: number, status: string) {
    const { data, error } = await supabaseAdmin
      .from('enquiries')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
};
