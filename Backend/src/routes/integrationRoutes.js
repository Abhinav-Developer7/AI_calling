import { Router } from 'express';
import { addPurchase } from '../controllers/purchaseController.js';
import { authenticateApiKey } from '../middleware/apiKeyAuth.js';
import { integrationLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { createPurchaseSchema } from '../validators/purchaseValidators.js';

const router = Router();

// Billing webhook / API integration
router.post(
  '/purchases',
  integrationLimiter,
  authenticateApiKey,
  validate(createPurchaseSchema),
  addPurchase
);

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Billing integration endpoint healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

