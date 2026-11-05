import { VoiceProvider } from './VoiceProvider.js';
import { logger } from '../../utils/logger.js';

export class MockVoiceProvider extends VoiceProvider {
  constructor() {
    super();
    this.name = 'mock';
  }

  async initiateCall({ to, customerName, invoiceNumber, itemsSummary, feedbackProcessId }) {
    const providerCallId = `call_mock_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

    logger.info(
      {
        provider: 'mock',
        providerCallId,
        feedbackProcessId,
        to,
        customerName,
        invoiceNumber,
      },
      `[MockVoiceProvider] Initiating outbound feedback call to ${customerName}`
    );

    return {
      providerCallId,
      status: 'initiated',
    };
  }

  verifyWebhookSignature(headers, rawBody) {
    // In mock mode, allow test webhooks or check a custom header
    return true;
  }

  normalizeWebhookEvent(rawPayload) {
    // Normalizes simulated test webhook payloads
    return {
      providerCallId: rawPayload.call_id || rawPayload.providerCallId,
      eventType: rawPayload.event || rawPayload.eventType || 'completed',
      durationSeconds: rawPayload.duration_seconds || rawPayload.durationSeconds || 75,
      rawTranscript: rawPayload.transcript || 'Sample customer conversation transcript in Malayalam and English.',
      extractedFeedback: rawPayload.feedback || {
        overallRating: rawPayload.rating !== undefined ? rawPayload.rating : 5,
        feedbackText: rawPayload.feedbackText || 'Great shopping experience, staff were polite.',
        sentiment: rawPayload.sentiment || 'positive',
        languageUsed: rawPayload.language || 'malayalam',
        complaintDetected: Boolean(rawPayload.complaint),
        complaintCategory: rawPayload.complaintCategory || undefined,
        suggestion: rawPayload.suggestion || undefined,
      },
      failureReason: rawPayload.failure_reason || rawPayload.failureReason,
    };
  }
}

