import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { authService } from '../services/auth.service';

export const authController = {
  signup: asyncHandler(async (req: Request, res: Response) => {
    const profile = await authService.signup(req.body);
    res.status(201).json({ data: profile, error: null });
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    res.json({ data: authService.me(req.user!.profile), error: null });
  }),

  updateMe: asyncHandler(async (req: Request, res: Response) => {
    const profile = await authService.updateProfile(req.user!.id, req.body);
    res.json({ data: profile, error: null });
  }),

  publicProfile: asyncHandler(async (req: Request, res: Response) => {
    const profile = await authService.publicProfile(req.params.id);
    res.json({ data: profile, error: null });
  }),
};
