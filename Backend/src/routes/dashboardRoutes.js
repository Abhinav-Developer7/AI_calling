import { Router } from 'express';
import {
  getDashboardOverview,
  getCallStatistics,
  getRecentActivity,
} from '../controllers/dashboardController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/overview', getDashboardOverview);
router.get('/call-statistics', getCallStatistics);
router.get('/recent-activity', getRecentActivity);

export default router;

