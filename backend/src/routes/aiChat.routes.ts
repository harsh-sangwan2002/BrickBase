import { Router } from 'express';
import { aiChatController } from '../controllers/aiChat.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { sendChatMessageSchema } from '../validators/aiChat.validators';

const router = Router();

router.get('/ai/sessions', authMiddleware, aiChatController.listSessions);
router.get('/ai/sessions/:id/messages', authMiddleware, aiChatController.messages);
router.post('/ai/messages', authMiddleware, validate(sendChatMessageSchema), aiChatController.send);
router.delete('/ai/sessions/:id', authMiddleware, aiChatController.remove);

export default router;
