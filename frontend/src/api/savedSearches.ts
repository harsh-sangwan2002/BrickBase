import { apiClient } from './client';
import type { SavedSearch } from '@/types';

export const savedSearchesApi = {
  create: (filters: Record<string, unknown>, alertEnabled = true) =>
    apiClient.post<SavedSearch>('/saved-searches', { filters, alert_enabled: alertEnabled }),
  list: () => apiClient.get<{ items: SavedSearch[] }>('/saved-searches'),
  setAlertEnabled: (id: number, alertEnabled: boolean) =>
    apiClient.patch<SavedSearch>(`/saved-searches/${id}`, { alert_enabled: alertEnabled }),
  remove: (id: number) => apiClient.delete(`/saved-searches/${id}`),
};
