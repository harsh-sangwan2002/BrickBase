import { apiClient } from './client';
import type { Profile, PropertyDetail } from '@/types';

export const adminApi = {
  listUsers: (query: string) => apiClient.get<{ items: Profile[]; total: number }>(`/admin/users${query}`),
  setUserStatus: (id: string, status: 'active' | 'suspended') =>
    apiClient.patch<Profile>(`/admin/users/${id}/status`, { status }),
  verifyAgent: (id: string) => apiClient.patch<Profile>(`/admin/users/${id}/verify-agent`),

  pendingProperties: () => apiClient.get<{ items: PropertyDetail[] }>('/admin/properties/pending'),
  approveProperty: (id: number) => apiClient.patch<PropertyDetail>(`/admin/properties/${id}/approve`),
  rejectProperty: (id: number, reason: string) =>
    apiClient.patch<PropertyDetail>(`/admin/properties/${id}/reject`, { reason }),

  reports: () => apiClient.get<{ items: unknown[] }>('/admin/reports'),
  resolveReport: (id: number, status: string) => apiClient.patch(`/admin/reports/${id}`, { status }),

  analytics: () =>
    apiClient.get<{
      total_users: number;
      total_properties: number;
      total_enquiries: number;
      users_by_role: Record<string, number>;
      properties_by_status: Record<string, number>;
      properties_by_type: Record<string, number>;
    }>('/admin/analytics/summary'),
};
