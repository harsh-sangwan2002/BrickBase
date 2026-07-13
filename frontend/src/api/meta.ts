import { apiClient } from './client';
import type { Amenity } from '@/types';

export const metaApi = {
  amenities: () => apiClient.get<{ items: Amenity[] }>('/meta/amenities'),
  cities: () => apiClient.get<{ items: string[] }>('/meta/cities'),
};
