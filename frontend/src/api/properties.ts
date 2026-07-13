import { apiClient } from './client';
import type { PropertyDetail, PropertySummary } from '@/types';

export interface SearchFilters {
  property_type?: string;
  listing_type?: string;
  city?: string;
  q?: string;
  min_price?: number;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  bhk?: number;
  sort?: string;
  cursor?: string;
  limit?: number;
}

function toQueryString(filters: SearchFilters) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export const propertiesApi = {
  search: (filters: SearchFilters) =>
    apiClient.get<{ items: PropertySummary[]; next_cursor: string | null }>(`/properties${toQueryString(filters)}`),

  detail: (id: number | string) => apiClient.get<PropertyDetail>(`/properties/${id}`),

  compare: (ids: number[]) => apiClient.get<{ items: PropertyDetail[] }>(`/properties/compare?ids=${ids.join(',')}`),

  similar: (id: number | string) => apiClient.get<{ items: PropertySummary[] }>(`/properties/${id}/similar`),

  mine: () => apiClient.get<{ items: PropertyDetail[] }>('/properties/mine'),

  create: (payload: Record<string, unknown>) => apiClient.post<PropertyDetail>('/properties', payload),

  update: (id: number, payload: Record<string, unknown>) => apiClient.patch<PropertyDetail>(`/properties/${id}`, payload),

  submit: (id: number) => apiClient.post<PropertyDetail>(`/properties/${id}/submit`),

  remove: (id: number) => apiClient.delete<PropertyDetail>(`/properties/${id}`),

  addImage: (id: number, image_url: string, is_cover = false, sort_order = 0) =>
    apiClient.post(`/properties/${id}/images`, { image_url, is_cover, sort_order }),

  removeImage: (id: number, imageId: number) => apiClient.delete(`/properties/${id}/images/${imageId}`),
};
