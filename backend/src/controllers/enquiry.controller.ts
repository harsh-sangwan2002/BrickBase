import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { enquiryService } from '../services/enquiry.service';

export const enquiryController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const buyerId = req.user?.id ?? null;
    const enquiry = await enquiryService.create(Number(req.params.id), buyerId, req.body);
    res.status(201).json({ data: enquiry, error: null });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await enquiryService.list(req.user!.profile);
    res.json({ data: { items }, error: null });
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const enquiry = await enquiryService.updateStatus(Number(req.params.id), req.user!.profile, req.body.status);
    res.json({ data: enquiry, error: null });
  }),
};
