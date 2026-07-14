import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler.middleware';
import { aiChatService } from '../services/aiChat.service';

export const aiChatController = {
  listSessions: asyncHandler(async (req: Request, res: Response) => {
    const items = await aiChatService.listSessions(req.user!.id);
    res.json({ data: { items }, error: null });
  }),

  messages: asyncHandler(async (req: Request, res: Response) => {
    const items = await aiChatService.messages(Number(req.params.id), req.user!.id);
    res.json({ data: { items }, error: null });
  }),

  send: asyncHandler(async (req: Request, res: Response) => {
    const result = await aiChatService.sendMessage(req.user!.id, req.body.session_id ?? null, req.body.message);
    res.status(201).json({ data: result, error: null });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    await aiChatService.deleteSession(Number(req.params.id), req.user!.id);
    res.json({ data: { success: true }, error: null });
  }),
};
