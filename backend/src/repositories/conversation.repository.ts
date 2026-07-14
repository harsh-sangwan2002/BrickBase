import { supabaseAdmin } from '../config/supabase';

export const conversationRepository = {
  async findOrCreate(propertyId: number | null, buyerId: string, ownerId: string) {
    const query = supabaseAdmin.from('conversations').select('*').eq('buyer_id', buyerId).eq('owner_id', ownerId);
    const { data: existing } = propertyId
      ? await query.eq('property_id', propertyId).maybeSingle()
      : await query.is('property_id', null).maybeSingle();

    if (existing) return existing;

    const { data, error } = await supabaseAdmin
      .from('conversations')
      .insert({ property_id: propertyId, buyer_id: buyerId, owner_id: ownerId })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async listForUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('conversations')
      .select(
        '*, properties(id, title), buyer:buyer_id(id, full_name, avatar_url), owner:owner_id(id, full_name, avatar_url)'
      )
      .or(`buyer_id.eq.${userId},owner_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async findById(id: number) {
    const { data, error } = await supabaseAdmin.from('conversations').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async touch(id: number) {
    await supabaseAdmin.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', id);
  },

  async listMessages(conversationId: number) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async addMessage(conversationId: number, senderId: string, body: string) {
    const { data, error } = await supabaseAdmin
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: senderId, body })
      .select('*')
      .single();
    if (error) throw error;
    await this.touch(conversationId);
    return data;
  },
};
