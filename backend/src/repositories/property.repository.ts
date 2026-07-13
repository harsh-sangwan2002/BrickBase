import { supabaseAdmin } from '../config/supabase';

export interface SearchPropertiesParams {
  property_type?: string;
  listing_type?: string;
  city?: string;
  q?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bhk?: number;
  sort: 'newest' | 'price_asc' | 'price_desc' | 'area';
  cursor?: string;
  limit: number;
}

function decodeCursor(cursor?: string): { created_at: string; id: number } | null {
  if (!cursor) return null;
  try {
    return JSON.parse(Buffer.from(cursor, 'base64').toString('utf-8'));
  } catch {
    return null;
  }
}

function encodeCursor(created_at: string, id: number): string {
  return Buffer.from(JSON.stringify({ created_at, id })).toString('base64');
}

export const propertyRepository = {
  async search(params: SearchPropertiesParams) {
    let query = supabaseAdmin
      .from('properties')
      .select(
        'id, title, property_type, listing_type, price, area_value, area_unit, city, bhk, is_verified, is_featured, created_at, property_images(image_url, is_cover)',
        { count: 'estimated' }
      )
      .eq('status', 'active');

    if (params.property_type) query = query.eq('property_type', params.property_type);
    if (params.listing_type) query = query.eq('listing_type', params.listing_type);
    if (params.city) query = query.ilike('city', params.city);
    if (params.min_price) query = query.gte('price', params.min_price);
    if (params.max_price) query = query.lte('price', params.max_price);
    if (params.min_area) query = query.gte('area_value', params.min_area);
    if (params.max_area) query = query.lte('area_value', params.max_area);
    if (params.bhk) query = query.eq('bhk', params.bhk);
    if (params.q) query = query.textSearch('search_vector', params.q, { type: 'websearch' });

    switch (params.sort) {
      case 'price_asc':
        query = query.order('price', { ascending: true }).order('id', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price', { ascending: false }).order('id', { ascending: false });
        break;
      case 'area':
        query = query.order('area_value', { ascending: false }).order('id', { ascending: false });
        break;
      default:
        query = query.order('created_at', { ascending: false }).order('id', { ascending: false });
    }

    const decoded = decodeCursor(params.cursor);
    if (decoded && params.sort === 'newest') {
      query = query.lt('created_at', decoded.created_at);
    }

    query = query.limit(params.limit);

    const { data, error, count } = await query;
    if (error) throw error;

    const items = data ?? [];
    const last = items[items.length - 1] as { created_at: string; id: number } | undefined;
    const next_cursor = items.length === params.limit && last ? encodeCursor(last.created_at, last.id) : null;

    return { items, next_cursor, total: count ?? undefined };
  },

  async findById(id: number) {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*, property_images(*), property_amenities(amenity_id, amenities(id, name, icon, category))')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async incrementViews(id: number) {
    await supabaseAdmin.rpc('increment_property_views', { property_id: id }).then(
      () => undefined,
      // Fallback if the RPC function doesn't exist yet — non-fatal.
      () => undefined
    );
  },

  async findByIds(ids: number[]) {
    const { data, error } = await supabaseAdmin.from('properties').select('*').in('id', ids);
    if (error) throw error;
    return data ?? [];
  },

  async findSimilar(property: { id: number; city: string; property_type: string; price: number }) {
    const minPrice = property.price * 0.8;
    const maxPrice = property.price * 1.2;
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('id, title, price, area_value, area_unit, city, bhk, property_images(image_url, is_cover)')
      .eq('status', 'active')
      .eq('city', property.city)
      .eq('property_type', property.property_type)
      .gte('price', minPrice)
      .lte('price', maxPrice)
      .neq('id', property.id)
      .limit(6);
    if (error) throw error;
    return data ?? [];
  },

  async create(ownerId: string, payload: Record<string, unknown>) {
    const { amenity_ids, ...rest } = payload as { amenity_ids?: number[] } & Record<string, unknown>;
    const { data, error } = await supabaseAdmin
      .from('properties')
      .insert({ ...rest, owner_id: ownerId, status: 'draft' })
      .select('*')
      .single();
    if (error) throw error;

    if (amenity_ids?.length) {
      await supabaseAdmin
        .from('property_amenities')
        .insert(amenity_ids.map((amenity_id) => ({ property_id: data.id, amenity_id })));
    }
    return data;
  },

  async update(id: number, payload: Record<string, unknown>) {
    const { amenity_ids, ...rest } = payload as { amenity_ids?: number[] } & Record<string, unknown>;
    const { data, error } = await supabaseAdmin
      .from('properties')
      .update({ ...rest, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;

    if (amenity_ids) {
      await supabaseAdmin.from('property_amenities').delete().eq('property_id', id);
      if (amenity_ids.length) {
        await supabaseAdmin
          .from('property_amenities')
          .insert(amenity_ids.map((amenity_id) => ({ property_id: id, amenity_id })));
      }
    }
    return data;
  },

  async setStatus(id: number, status: string, extra: Record<string, unknown> = {}) {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .update({ status, updated_at: new Date().toISOString(), ...extra })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async listByOwner(ownerId: string) {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*, property_images(image_url, is_cover)')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data ?? [];
  },

  async listPendingReview() {
    const { data, error } = await supabaseAdmin
      .from('properties')
      .select('*, profiles(full_name, agency_name)')
      .eq('status', 'pending_review')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data ?? [];
  },

  async addImage(propertyId: number, imageUrl: string, isCover: boolean, sortOrder: number) {
    const { data, error } = await supabaseAdmin
      .from('property_images')
      .insert({ property_id: propertyId, image_url: imageUrl, is_cover: isCover, sort_order: sortOrder })
      .select('*')
      .single();
    if (error) throw error;
    return data;
  },

  async removeImage(propertyId: number, imageId: number) {
    const { error } = await supabaseAdmin
      .from('property_images')
      .delete()
      .eq('id', imageId)
      .eq('property_id', propertyId);
    if (error) throw error;
  },
};
