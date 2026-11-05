import { Router } from 'express';
import { listFeedback, getFeedback } from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listFeedback);
router.get('/:id', getFeedback);

export default router;

