import { Router } from 'express';
import { enquiryController } from '../controllers/enquiry.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';
import { roleGuard } from '../middleware/roleGuard.middleware';
import { enquiryRateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { createEnquirySchema, updateEnquiryStatusSchema } from '../validators/enquiry.validators';

const router = Router();

router.post(
  '/properties/:id/enquiries',
  enquiryRateLimit,
  optionalAuthMiddleware,
  validate(createEnquirySchema),
  enquiryController.create
);

router.get('/enquiries', authMiddleware, roleGuard('owner', 'agent', 'admin'), enquiryController.list);
router.patch(
  '/enquiries/:id',
  authMiddleware,
  roleGuard('owner', 'agent', 'admin'),
  validate(updateEnquiryStatusSchema),
  enquiryController.updateStatus
);

export default router;
