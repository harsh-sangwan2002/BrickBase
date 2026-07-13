import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { authService } from '../services/auth.service';
import { reviewRepository } from '../repositories/review.repository';
import { ApiException } from '../middleware/errorHandler.middleware';

export const userController = {
  publicProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await authService.publicProfile(req.params.id);
    res.json({ data: profile, error: null });
  }),

  listReviews: asyncHandler(async (req: Request, res: Response) => {
    const items = await reviewRepository.listForUser(req.params.id);
    res.json({ data: { items }, error: null });
  }),

  createReview: asyncHandler(async (req: Request, res: Response) => {
    if (req.user!.id === req.params.id) {
      throw new ApiException(400, 'INVALID_REQUEST', 'You cannot review yourself');
    }
    const { property_id, rating, comment } = req.body;
    const review = await reviewRepository.create(req.user!.id, req.params.id, property_id, rating, comment);
    res.status(201).json({ data: review, error: null });
  }),
};
