import { supabaseAdmin } from '../config/supabase';

export const favoriteRepository = {
  async list(userId: string) {
    const { data, error } = await supabaseAdmin
      .from('favorites')
      .select('property_id, created_at, properties(id, title, price, city, area_value, area_unit, property_images(image_url, is_cover))')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async add(userId: string, propertyId: number) {
    const { error } = await supabaseAdmin
      .from('favorites')
      .upsert({ user_id: userId, property_id: propertyId }, { onConflict: 'user_id,property_id' });
    if (error) throw error;
  },

  async remove(userId: string, propertyId: number) {
    const { error } = await supabaseAdmin
      .from('favorites')
      .delete()
      .eq('user_id', userId)
      .eq('property_id', propertyId);
    if (error) throw error;
  },
};
