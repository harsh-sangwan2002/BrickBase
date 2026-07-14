import { z } from 'zod';

export const createSavedSearchSchema = z.object({
  filters: z.record(z.any()),
  alert_enabled: z.boolean().optional().default(true),
});

export const updateSavedSearchSchema = z.object({
  alert_enabled: z.boolean(),
});
