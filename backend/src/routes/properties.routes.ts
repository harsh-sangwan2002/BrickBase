import { Router } from 'express';
import { propertyController } from '../controllers/property.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  compareQuerySchema,
  createPropertySchema,
  searchPropertiesSchema,
  updatePropertySchema,
} from '../validators/property.validators';

const router = Router();

router.get('/properties', validate(searchPropertiesSchema, 'query'), propertyController.search);
router.get('/properties/compare', validate(compareQuerySchema, 'query'), propertyController.compare);
router.get('/properties/mine', authMiddleware, roleGuard('owner', 'agent', 'admin'), propertyController.mine);
router.get('/properties/:id', propertyController.detail);
router.get('/properties/:id/similar', propertyController.similar);

router.post(
  '/properties',
  authMiddleware,
  roleGuard('owner', 'agent', 'admin'),
  validate(createPropertySchema),
  propertyController.create
);
router.patch(
  '/properties/:id',
  authMiddleware,
  roleGuard('owner', 'agent', 'admin'),
  validate(updatePropertySchema),
  propertyController.update
);
router.post('/properties/:id/submit', authMiddleware, roleGuard('owner', 'agent', 'admin'), propertyController.submit);
router.delete('/properties/:id', authMiddleware, roleGuard('owner', 'agent', 'admin'), propertyController.remove);

router.post('/properties/:id/images', authMiddleware, roleGuard('owner', 'agent', 'admin'), propertyController.addImage);
router.delete(
  '/properties/:id/images/:imageId',
  authMiddleware,
  roleGuard('owner', 'agent', 'admin'),
  propertyController.removeImage
);

export default router;
