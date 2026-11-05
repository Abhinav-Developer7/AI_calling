import { processProviderWebhook } from '../services/webhookService.js';
import { getVoiceProvider } from '../providers/voice/index.js';
import { CallAttempt } from '../models/CallAttempt.js';
import { logger } from '../utils/logger.js';

export async function handleVoiceProviderWebhook(req, res, next) {
  try {
    const provider = getVoiceProvider();

    // 1. Webhook Signature / Token Verification
    const isValidSignature = provider.verifyWebhookSignature(req.headers, req.body, req.query);
    if (!isValidSignature) {
      logger.warn('Webhook request rejected due to invalid cryptographic signature or token');
      return res.status(401).json({
        success: false,
        message: 'Invalid webhook signature or token',
      });
    }

    // 2. Normalize Event
    const normalizedEvent = provider.normalizeWebhookEvent(req.body);
    const externalEventId =
      req.headers['x-event-id'] ||
      req.body.event_id ||
      req.body.call_id ||
      req.body.callId ||
      normalizedEvent.providerCallId;

    // 3. Process Event
    const result = await processProviderWebhook({
      provider: provider.name,
      externalEventId,
      normalizedEvent,
      rawPayload: req.body,
    });

    return res.status(200).json({
      received: true,
      result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Endpoint for testing / simulating webhook events directly from dev tools or admin UI.
 */
export async function simulateWebhook(req, res, next) {
  try {
    const { providerCallId, processId, feedbackProcessId, eventType, rating, feedbackText, sentiment, complaint, optOut } = req.body;

    let resolvedCallId = providerCallId;

    if (!resolvedCallId && (processId || feedbackProcessId)) {
      const pid = processId || feedbackProcessId;
      const latestAttempt = await CallAttempt.findOne({ feedbackProcessId: pid }).sort({ attemptNumber: -1 });
      if (latestAttempt) {
        resolvedCallId = latestAttempt.providerCallId;
      }
    }

    if (!resolvedCallId) {
      return res.status(400).json({
        success: false,
        message: 'No active call attempt found for this process. Click "Call Now" first to initiate an attempt.',
      });
    }

    const normalizedEvent = {
      providerCallId: resolvedCallId,
      eventType: eventType || 'completed',
      durationSeconds: 90,
      rawTranscript: 'Simulated feedback call transcript in Malayalam: Customer expressed feedback.',
      extractedFeedback: {
        overallRating: rating !== undefined ? rating : 5,
        feedbackText: feedbackText || 'Good experience overall. Staff were helpful.',
        summary: 'Customer shared shopping feedback.',
        sentiment: sentiment || (rating <= 2 ? 'negative' : 'positive'),
        languageUsed: 'malayalam',
        complaintDetected: Boolean(complaint || (rating <= 2)),
        complaintCategory: complaint ? 'staff_behavior' : rating <= 2 ? 'quality_craftsmanship' : undefined,
        optOutRequested: Boolean(optOut),
      },
    };

    const result = await processProviderWebhook({
      provider: 'mock',
      externalEventId: `sim_${Date.now()}`,
      normalizedEvent,
      rawPayload: req.body,
    });

    return res.status(200).json({
      success: true,
      message: 'Simulated webhook processed successfully',
      result,
    });
  } catch (error) {
    next(error);
  }
}
