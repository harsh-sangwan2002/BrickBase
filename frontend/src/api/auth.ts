import { apiClient } from './client';
import type { Profile, UserRole } from '@/types';

export interface SignupPayload {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  role: Exclude<UserRole, 'admin'>;
  agency_name?: string;
  license_number?: string;
}

export const authApi = {
  signup: (payload: SignupPayload) => apiClient.post<Profile>('/auth/signup', payload),
  me: () => apiClient.get<Profile>('/auth/me'),
  updateMe: (payload: Partial<Profile>) => apiClient.patch<Profile>('/users/me', payload),
  publicProfile: (id: string) => apiClient.get<Partial<Profile>>(`/users/${id}`),
};
