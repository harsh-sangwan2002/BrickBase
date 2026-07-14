import { Router } from 'express';
import { savedSearchController } from '../controllers/savedSearch.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { createSavedSearchSchema, updateSavedSearchSchema } from '../validators/savedSearch.validators';

const router = Router();

router.post('/saved-searches', authMiddleware, validate(createSavedSearchSchema), savedSearchController.create);
router.get('/saved-searches', authMiddleware, savedSearchController.list);
router.patch('/saved-searches/:id', authMiddleware, validate(updateSavedSearchSchema), savedSearchController.update);
router.delete('/saved-searches/:id', authMiddleware, savedSearchController.remove);

export default router;
