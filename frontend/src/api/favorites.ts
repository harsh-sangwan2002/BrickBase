import { apiClient } from './client';
import type { PropertySummary } from '@/types';

export const favoritesApi = {
  list: () => apiClient.get<{ items: { property_id: number; properties: PropertySummary }[] }>('/favorites'),
  add: (propertyId: number) => apiClient.post(`/favorites/${propertyId}`),
  remove: (propertyId: number) => apiClient.delete(`/favorites/${propertyId}`),
};
