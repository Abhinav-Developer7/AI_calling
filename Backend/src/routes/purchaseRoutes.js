import { Router } from 'express';
import { addPurchase, listPurchases, getPurchase, revealPurchasePII } from '../controllers/purchaseController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { createPurchaseSchema, listPurchasesSchema } from '../validators/purchaseValidators.js';

const router = Router();

// All purchase management endpoints require admin authentication
router.use(authenticate);

router.post('/', validate(createPurchaseSchema), addPurchase);
router.get('/', validate(listPurchasesSchema), listPurchases);
router.get('/:id', getPurchase);
router.post('/:id/reveal-pii', revealPurchasePII);

export default router;

