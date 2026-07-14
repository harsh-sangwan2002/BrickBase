import { supabaseAdmin } from '../config/supabase';
import { AiChatAction } from '../types';

export const aiChatRepository = {
  async listSessions(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('ai_chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async findSession(id: number) {
    const { data, error } = await supabaseAdmin.from('ai_chat_sessions').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  async createSession(userId: string, title: string) {
    const { data, error } = await supabaseAdmin
      .from('ai_chat_sessions')
      .insert({ user_id: userId, title })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async touchSession(id: number) {
    await supabaseAdmin.from('ai_chat_sessions').update({ updated_at: new Date().toISOString() }).eq('id', id);
  },

  async deleteSession(id: number) {
    const { error } = await supabaseAdmin.from('ai_chat_sessions').delete().eq('id', id);
    if (error) throw error;
  },

  async listMessages(sessionId: number) {
    const { data, error } = await supabaseAdmin
      .from('ai_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async addMessage(sessionId: number, role: 'user' | 'assistant', content: string, action: AiChatAction | null = null) {
    const { data, error } = await supabaseAdmin
      .from('ai_chat_messages')
      .insert({ session_id: sessionId, role, content, action })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
};
