import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2).max(120),
  phone: z.string().min(7).max(20).optional(),
  role: z.enum(['buyer', 'owner', 'agent']),
  agency_name: z.string().optional(),
  license_number: z.string().optional(),
});

export const updateProfileSchema = z.object({
  full_name: z.string().min(2).max(120).optional(),
  phone: z.string().min(7).max(20).optional(),
  avatar_url: z.string().url().optional(),
  agency_name: z.string().optional(),
  license_number: z.string().optional(),
});
