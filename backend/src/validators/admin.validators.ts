import { z } from 'zod';

export const rejectPropertySchema = z.object({
  reason: z.string().min(5).max(1000),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended']),
});

export const listUsersQuerySchema = z.object({
  role: z.enum(['buyer', 'owner', 'agent', 'admin']).optional(),
  status: z.enum(['active', 'pending', 'suspended']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  page_size: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const updateReportSchema = z.object({
  status: z.enum(['pending', 'reviewed', 'dismissed']),
});
