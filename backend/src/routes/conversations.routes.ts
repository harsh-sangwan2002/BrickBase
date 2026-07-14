import { Router } from 'express';
import { conversationController } from '../controllers/conversation.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { sendMessageSchema } from '../validators/conversation.validators';

const router = Router();

router.get('/conversations', authMiddleware, conversationController.list);
router.get('/conversations/:id/messages', authMiddleware, conversationController.messages);
router.post('/conversations/:id/messages', authMiddleware, validate(sendMessageSchema), conversationController.send);

export default router;
