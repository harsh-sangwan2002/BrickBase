import { z } from 'zod';

export const createReviewSchema = z.object({
  property_id: z.coerce.number().int().optional(),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});
