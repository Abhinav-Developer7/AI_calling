import { Router } from 'express';
import { listComplaints, getComplaint, resolveComplaint } from '../controllers/complaintController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', listComplaints);
router.get('/:id', getComplaint);
router.patch('/:id/resolve', resolveComplaint);

export default router;

