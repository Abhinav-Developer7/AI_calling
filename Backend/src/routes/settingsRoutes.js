import { Router } from 'express';
import { getSettings, updateSettings } from '../controllers/settingsController.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Public/authenticated view of store settings (for calling hours, store name)
router.get('/', getSettings);

// Admin-only updates
router.put('/', authenticate, authorize('admin'), updateSettings);

export default router;

