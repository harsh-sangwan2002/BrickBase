import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { conversationService } from '../services/conversation.service';

export const conversationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const items = await conversationService.list(req.user!.profile);
    res.json({ data: { items }, error: null });
  }),

  messages: asyncHandler(async (req: Request, res: Response) => {
    const items = await conversationService.messages(Number(req.params.id), req.user!.profile);
    res.json({ data: { items }, error: null });
  }),

  send: asyncHandler(async (req: Request, res: Response) => {
    const message = await conversationService.send(Number(req.params.id), req.user!.profile, req.body.body);
    res.status(201).json({ data: message, error: null });
  }),
};
