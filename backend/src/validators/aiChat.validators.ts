import { z } from 'zod';

export const sendChatMessageSchema = z.object({
  session_id: z.coerce.number().int().positive().optional(),
  message: z.string().min(1).max(1000),
});
