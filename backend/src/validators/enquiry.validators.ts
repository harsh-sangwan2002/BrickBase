import { z } from 'zod';

export const createEnquirySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  phone: z.string().min(7).max(20),
  message: z.string().min(5).max(2000),
});

export const updateEnquiryStatusSchema = z.object({
  status: z.enum(['new', 'contacted', 'closed', 'spam']),
});
