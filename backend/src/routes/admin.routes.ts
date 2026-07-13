import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  listUsersQuerySchema,
  rejectPropertySchema,
  updateReportSchema,
  updateUserStatusSchema,
} from '../validators/admin.validators';

const router = Router();

router.use('/admin', authMiddleware, roleGuard('admin'));

router.get('/admin/users', validate(listUsersQuerySchema, 'query'), adminController.listUsers);
router.patch('/admin/users/:id/status', validate(updateUserStatusSchema), adminController.setUserStatus);
router.patch('/admin/users/:id/verify-agent', adminController.verifyAgent);

router.get('/admin/properties/pending', adminController.pendingProperties);
router.patch('/admin/properties/:id/approve', adminController.approveProperty);
router.patch('/admin/properties/:id/reject', validate(rejectPropertySchema), adminController.rejectProperty);

router.get('/admin/reports', adminController.reports);
router.patch('/admin/reports/:id', validate(updateReportSchema), adminController.resolveReport);

router.get('/admin/analytics/summary', adminController.analytics);

export default router;
