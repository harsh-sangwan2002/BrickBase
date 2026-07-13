import { supabaseAdmin } from '../config/supabase';

export const reviewRepository = {
  async listForUser(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .select('*, reviewer:reviewer_id(full_name, avatar_url)')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async create(reviewerId: string, revieweeId: string, propertyId: number | undefined, rating: number, comment?: string) {
    const { data, error } = await supabaseAdmin
      .from('reviews')
      .insert({ reviewer_id: reviewerId, reviewee_id: revieweeId, property_id: propertyId, rating, comment })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },
};
