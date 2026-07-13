import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { authRateLimit } from '../middleware/rateLimit.middleware';
import { validate } from '../middleware/validate.middleware';
import { signupSchema, updateProfileSchema } from '../validators/auth.validators';
import { createReviewSchema } from '../validators/review.validators';

const router = Router();

// Login is handled client-side directly via supabase-js (Supabase issues the JWT) — see README §6.1.
router.post('/auth/signup', authRateLimit, validate(signupSchema), authController.signup);
router.get('/auth/me', authMiddleware, authController.me);

router.patch('/users/me', authMiddleware, validate(updateProfileSchema), authController.updateMe);
router.get('/users/:id', userController.publicProfile);
router.get('/users/:id/reviews', userController.listReviews);
router.post('/users/:id/reviews', authMiddleware, validate(createReviewSchema), userController.createReview);

export default router;
