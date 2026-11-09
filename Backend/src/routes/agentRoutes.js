import { Router } from 'express';
import {
  createAgent,
  listAgents,
  getAgent,
  updateAgent,
  deleteAgent,
} from '../controllers/agentController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.post('/', createAgent);
router.get('/', listAgents);
router.get('/:id', getAgent);
router.put('/:id', updateAgent);
router.delete('/:id', deleteAgent);

export default router;

