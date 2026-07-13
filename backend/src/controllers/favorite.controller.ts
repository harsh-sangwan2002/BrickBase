import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { favoriteRepository } from '../repositories/favorite.repository';

export const favoriteController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await favoriteRepository.list(req.user!.id);
    res.json({ data: { items }, error: null });
  }),

  add: asyncHandler(async (req: Request, res: Response) => {
    await favoriteRepository.add(req.user!.id, Number(req.params.propertyId));
    res.status(201).json({ data: { success: true }, error: null });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await favoriteRepository.remove(req.user!.id, Number(req.params.propertyId));
    res.json({ data: { success: true }, error: null });
  }),
};
