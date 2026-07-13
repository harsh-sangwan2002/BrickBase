import { supabaseAdmin } from '../config/supabase';

export const metaRepository = {
  async listAmenities() {
    const { data, error } = await supabaseAdmin.from('amenities').select('*').order('category');
    if (error) throw error;
    return data ?? [];
  },

  async listCities() {
    const { data, error } = await supabaseAdmin.from('properties').select('city').eq('status', 'active');
    if (error) throw error;
    const cities = Array.from(new Set((data ?? []).map((row: { city: string }) => row.city))).sort();
    return cities;
  },
};
