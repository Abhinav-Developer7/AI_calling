import { Router } from 'express';
import {
  listProcesses,
  getProcess,
  cancelProcess,
  rescheduleProcess,
  optOutProcess,
  triggerCallNow,
} from '../controllers/callingController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listProcesses);
router.get('/:id', getProcess);
router.post('/:id/cancel', cancelProcess);
router.post('/:id/reschedule', rescheduleProcess);
router.post('/:id/do-not-call', optOutProcess);
router.post('/:id/call-now', triggerCallNow);

export default router;

