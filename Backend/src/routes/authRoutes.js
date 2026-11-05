import { Router } from 'express';
import { login, logout, getMe, updateProfile, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { loginSchema, updateProfileSchema, changePasswordSchema } from '../validators/authValidators.js';

const router = Router();

router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, validate(updateProfileSchema), updateProfile);
router.patch('/change-password', authenticate, validate(changePasswordSchema), changePassword);

export default router;

