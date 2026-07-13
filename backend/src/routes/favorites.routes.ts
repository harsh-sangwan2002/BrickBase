import { Router } from 'express';
import { favoriteController } from '../controllers/favorite.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.get('/favorites', authMiddleware, favoriteController.list);
router.post('/favorites/:propertyId', authMiddleware, favoriteController.add);
router.delete('/favorites/:propertyId', authMiddleware, favoriteController.remove);

export default router;
