import { Router } from 'express';
import { handleVoiceProviderWebhook, simulateWebhook } from '../controllers/webhookController.js';

const router = Router();

// Voice provider webhook ingestion (supports standard and vistara routes)
router.post('/voice-provider/events', handleVoiceProviderWebhook);
router.post('/vistara', handleVoiceProviderWebhook);

// Testing / simulation endpoint for development
router.post('/simulate', simulateWebhook);

export default router;

