import { Router } from 'express';
import { getReportSummary, exportReportCSV } from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/summary', getReportSummary);
router.get('/export', exportReportCSV);

export default router;

