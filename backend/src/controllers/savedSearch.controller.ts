import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { savedSearchService } from '../services/savedSearch.service';

export const savedSearchController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const item = await savedSearchService.create(req.user!.profile, req.body.filters, req.body.alert_enabled);
    res.status(201).json({ data: item, error: null });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await savedSearchService.list(req.user!.profile);
    res.json({ data: { items }, error: null });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const item = await savedSearchService.setAlertEnabled(Number(req.params.id), req.user!.profile, req.body.alert_enabled);
    res.json({ data: item, error: null });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await savedSearchService.remove(Number(req.params.id), req.user!.profile);
    res.json({ data: { success: true }, error: null });
  }),
};
