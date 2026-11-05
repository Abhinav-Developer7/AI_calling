import crypto from 'crypto';
import { VoiceProvider } from './VoiceProvider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export class RetellVoiceProvider extends VoiceProvider {
  constructor() {
    super();
    this.name = 'retell';
    this.apiKey = env.RETELL_API_KEY;
    this.agentId = env.RETELL_AGENT_ID;
    this.webhookSecret = env.RETELL_WEBHOOK_SECRET;
  }

  async initiateCall({ to, customerName, invoiceNumber, itemsSummary, feedbackProcessId }) {
    if (!this.apiKey || !this.agentId) {
      throw new Error('Retell API credentials (RETELL_API_KEY, RETELL_AGENT_ID) are not configured');
    }

    const payload = {
      agent_id: this.agentId,
      to_number: to,
      retell_llm_dynamic_variables: {
        customer_name: customerName,
        invoice_number: invoiceNumber,
        items_summary: itemsSummary,
        feedback_process_id: feedbackProcessId,
      },
      metadata: {
        feedbackProcessId,
        invoiceNumber,
      },
    };

    logger.info({ to, feedbackProcessId, agentId: this.agentId }, 'Dispatched call to Retell AI API');

    const response = await fetch('https://api.retellai.com/v2/create-phone-call', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'Retell API call creation failed');
      throw new Error(`Retell API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();

    return {
      providerCallId: data.call_id,
      status: data.call_status || 'initiated',
    };
  }

  verifyWebhookSignature(headers, rawBody) {
    if (!this.webhookSecret) {
      // If no webhook secret configured in dev mode, allow with warning
      logger.warn('RETELL_WEBHOOK_SECRET not configured. Skipping HMAC verification.');
      return true;
    }

    const signature = headers['x-retell-signature'];
    if (!signature) {
      logger.warn('Missing x-retell-signature header in webhook request');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
        .digest('hex');

      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to compute or compare webhook signature');
      return false;
    }
  }

  normalizeWebhookEvent(rawPayload) {
    const eventType = rawPayload.event || 'call_ended';
    const callData = rawPayload.call || rawPayload;
    const providerCallId = callData.call_id;

    // Disconnection reasons in Retell
    const reason = callData.disconnection_reason;
    let mappedStatus = 'completed';

    if (reason === 'user_did_not_answer' || reason === 'no_answer') {
      mappedStatus = 'no_answer';
    } else if (reason === 'user_busy' || reason === 'busy') {
      mappedStatus = 'busy';
    } else if (reason === 'dial_failed' || reason === 'error') {
      mappedStatus = 'failed';
    }

    // Extract dynamic variables / call analysis
    const analysis = callData.call_analysis || {};
    const customAnalysis = analysis.custom_analysis_data || {};

    let rating = customAnalysis.rating || customAnalysis.overall_rating;
    if (rating !== undefined && rating !== null) {
      rating = parseInt(rating, 10);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        rating = null; // Enforce Rule 7: reject invalid ratings
      }
    } else {
      rating = null;
    }

    const sentiment = analysis.user_sentiment ? analysis.user_sentiment.toLowerCase() : 'neutral';
    const validSentiments = ['positive', 'neutral', 'negative', 'unknown'];
    const resolvedSentiment = validSentiments.includes(sentiment) ? sentiment : 'neutral';

    return {
      providerCallId,
      eventType: mappedStatus,
      durationSeconds: Math.round((callData.duration_ms || 0) / 1000),
      rawTranscript: callData.transcript || '',
      extractedFeedback: {
        overallRating: rating,
        feedbackText: customAnalysis.feedback_text || analysis.call_summary || '',
        summary: analysis.call_summary || 'Feedback conversation completed.',
        sentiment: resolvedSentiment,
        languageUsed: customAnalysis.language_used || 'malayalam',
        complaintDetected: Boolean(customAnalysis.complaint_detected || (rating !== null && rating <= 2)),
        complaintCategory: customAnalysis.complaint_category || (rating !== null && rating <= 2 ? 'other' : undefined),
        complaintSummary: customAnalysis.complaint_summary || undefined,
        suggestion: customAnalysis.customer_suggestion || undefined,
        optOutRequested: Boolean(customAnalysis.opt_out_requested),
      },
      failureReason: callData.disconnection_reason,
    };
  }
}

