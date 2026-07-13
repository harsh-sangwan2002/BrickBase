import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { metaRepository } from '../repositories/meta.repository';

let amenitiesCache: { data: unknown; expiresAt: number } | null = null;
let citiesCache: { data: unknown; expiresAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000;

export const metaController = {
  amenities: asyncHandler(async (_req: Request, res: Response) => {
    if (!amenitiesCache || amenitiesCache.expiresAt < Date.now()) {
      const items = await metaRepository.listAmenities();
      amenitiesCache = { data: items, expiresAt: Date.now() + CACHE_TTL_MS };
    }
    res.json({ data: { items: amenitiesCache.data }, error: null });
  }),

  cities: asyncHandler(async (_req: Request, res: Response) => {
    if (!citiesCache || citiesCache.expiresAt < Date.now()) {
      const items = await metaRepository.listCities();
      citiesCache = { data: items, expiresAt: Date.now() + CACHE_TTL_MS };
    }
    res.json({ data: { items: citiesCache.data }, error: null });
  }),
};
