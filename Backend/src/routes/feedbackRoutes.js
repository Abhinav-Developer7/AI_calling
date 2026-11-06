import { Router } from 'express';
import { listFeedback, getFeedback, streamFeedbackRecording } from '../controllers/feedbackController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listFeedback);
router.get('/:id', getFeedback);
router.get('/:id/recording', streamFeedbackRecording);

export default router;

