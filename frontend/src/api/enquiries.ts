import { apiClient } from './client';
import type { Enquiry } from '@/types';

export const enquiriesApi = {
  create: (propertyId: number, payload: { name: string; email: string; phone: string; message: string }) =>
    apiClient.post<Enquiry>(`/properties/${propertyId}/enquiries`, payload),

  list: () => apiClient.get<{ items: Enquiry[] }>('/enquiries'),

  updateStatus: (id: number, status: string) => apiClient.patch<Enquiry>(`/enquiries/${id}`, { status }),
};
