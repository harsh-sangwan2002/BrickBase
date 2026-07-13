import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { moderationService } from '../services/moderation.service';

export const adminController = {
  listUsers: asyncHandler(async (req: Request, res: Response) => {
    const result = await moderationService.listUsers(req.query as never);
    res.json({ data: result, error: null });
  }),

  setUserStatus: asyncHandler(async (req: Request, res: Response) => {
    const profile = await moderationService.setUserStatus(req.user!.profile, req.params.id, req.body.status);
    res.json({ data: profile, error: null });
  }),

  verifyAgent: asyncHandler(async (req: Request, res: Response) => {
    const profile = await moderationService.verifyAgent(req.user!.profile, req.params.id);
    res.json({ data: profile, error: null });
  }),

  pendingProperties: asyncHandler(async (_req: Request, res: Response) => {
    const items = await moderationService.pendingProperties();
    res.json({ data: { items }, error: null });
  }),

  approveProperty: asyncHandler(async (req: Request, res: Response) => {
    const property = await moderationService.approveProperty(req.user!.profile, Number(req.params.id));
    res.json({ data: property, error: null });
  }),

  rejectProperty: asyncHandler(async (req: Request, res: Response) => {
    const property = await moderationService.rejectProperty(req.user!.profile, Number(req.params.id), req.body.reason);
    res.json({ data: property, error: null });
  }),

  reports: asyncHandler(async (_req: Request, res: Response) => {
    const items = await moderationService.reports();
    res.json({ data: { items }, error: null });
  }),

  resolveReport: asyncHandler(async (req: Request, res: Response) => {
    const report = await moderationService.resolveReport(req.user!.profile, Number(req.params.id), req.body.status);
    res.json({ data: report, error: null });
  }),

  analytics: asyncHandler(async (_req: Request, res: Response) => {
    const summary = await moderationService.analytics();
    res.json({ data: summary, error: null });
  }),
};
