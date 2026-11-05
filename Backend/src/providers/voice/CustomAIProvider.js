import crypto from 'crypto';
import { VoiceProvider } from './VoiceProvider.js';
import { env } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

/**
 * Generic Custom AI Voice Provider Adapter.
 * Connects with any voice calling platform (Vapi, Bland.ai, Bolna, Twilio/OpenAI, etc.)
 * by dispatching an HTTP POST outbound call and mapping incoming webhook payloads.
 */
export class CustomAIProvider extends VoiceProvider {
  constructor() {
    super();
    this.name = 'custom';
    this.apiKey = env.CUSTOM_AI_API_KEY || process.env.CUSTOM_AI_API_KEY || '';
    this.apiUrl = env.CUSTOM_AI_API_URL || process.env.CUSTOM_AI_API_URL || '';
    this.agentId = env.CUSTOM_AI_AGENT_ID || process.env.CUSTOM_AI_AGENT_ID || process.env.RINGG_AGENT_ID || '';
    this.callerId = env.CUSTOM_AI_CALLER_ID || process.env.CUSTOM_AI_CALLER_ID || process.env.RINGG_CALLER_ID || '';
    this.webhookSecret = env.CUSTOM_AI_WEBHOOK_SECRET || process.env.CUSTOM_AI_WEBHOOK_SECRET || process.env.VISTARA_WEBHOOK_TOKEN || '';
  }

  /**
   * Dispatches an outbound call to any custom AI voice platform API (Ringg.ai, Vapi, Bland, etc.).
   * @param {Object} params
   * @param {string} params.to - Customer phone number in E.164 (+91...)
   * @param {string} params.customerName - Name of the customer
   * @param {string} params.invoiceNumber - Bill / Invoice number
   * @param {string} params.itemsSummary - Purchased items summary
   * @param {string} params.feedbackProcessId - Internal process ID for tracking
   * @returns {Promise<{ providerCallId: string, status: string }>}
   */
  async initiateCall({ to, customerName, invoiceNumber, itemsSummary, feedbackProcessId }) {
    if (!this.apiUrl) {
      throw new Error('CUSTOM_AI_API_URL is not configured in environment variables');
    }

    // Construct payload supporting diverse AI providers (Ringg.ai, Vapi, Bland, etc.)
    const isRingg = this.apiUrl.includes('ringg.ai') || this.apiKey.startsWith('rg_');
    const isVistara = this.apiUrl.includes('vistaraai.in');
    const isCallerIdUuid = this.callerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(this.callerId.trim());

    const payload = isVistara
      ? {
        phone: to,
        agentId: this.agentId,
        name: customerName || 'Customer',
        metadata: {
          feedbackProcessId,
          invoiceNumber,
          customerName,
          itemsSummary,
        },
      } : {
        name: `Feedback Call - ${customerName || 'Customer'}`,
        agent_id: this.agentId || undefined,
        phone_number: to,
        mobile_number: to,
        to_number: to,
        to,
        customer_name: customerName,
        callee_name: customerName,
        invoice_number: invoiceNumber,
        items_summary: itemsSummary,
        feedback_process_id: feedbackProcessId,
        variables: {
          customer_name: customerName,
          callee_name: customerName,
          invoice_number: invoiceNumber,
          items_summary: itemsSummary,
          feedback_process_id: feedbackProcessId,
        },
        custom_args_values: {
          customer_name: customerName,
          callee_name: customerName,
          invoice_number: invoiceNumber,
          items_summary: itemsSummary,
          feedback_process_id: feedbackProcessId,
        },
        metadata: {
          feedbackProcessId,
          invoiceNumber,
        },
      };

    // Set caller number or caller ID according to provider schema
    if (this.callerId) {
      if (isCallerIdUuid) {
        payload.from_number_id = this.callerId.trim();
      } else {
        payload.from_number = this.callerId.trim();
        payload.caller_id = this.callerId.trim();
      }
    }

    logger.info({ to, feedbackProcessId, customerName, provider: this.name, apiUrl: this.apiUrl }, 'Dispatching outbound call to Voice API');

    const isTestCall =
      process.env.VISTARA_CALL_TYPE === 'test' ||
      process.env.NODE_ENV === 'development';

    const headers = {
      'Content-Type': 'application/json',
      'x-call-type': isTestCall ? 'test' : 'general',
      'x-calling-number-type': 'general'
    };

    if (this.apiKey) {
      if (isRingg) {
        headers['X-API-KEY'] = this.apiKey;
      } else if (isVistara) {
        headers['x-api-key'] = this.apiKey;
      } else {
        headers['Authorization'] = `Bearer ${this.apiKey}`;
      }
    }

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ status: response.status, error: errorText }, 'Custom AI API call initiation failed');
      throw new Error(`Custom AI API error (${response.status}): ${errorText}`);
    }

    const data = await response.json();
    console.log(data);

    // Resolve provider call ID across common response schemas (call_id, id, callId, data.call_id)
    const providerCallId =
      data.call_id ||
      data.id ||
      data.callId ||
      data.data?.call_id ||
      data.data?.id ||
      `custom_${Date.now()}`;

    return {
      providerCallId,
      status: data.status || data.call_status || 'initiated',
    };
  }

  /**
   * Verifies incoming webhook HMAC signature or URL query token.
   * @param {Object} headers
   * @param {Buffer|string} rawBody
   * @param {Object} query
   * @returns {boolean}
   */
  verifyWebhookSignature(headers = {}, rawBody = '', query = {}) {
    const secret = this.webhookSecret;
    if (!secret) {
      // In development or when no secret is configured, allow request
      return true;
    }

    // 1. Check URL query token (standard for Vistara: ?token=<secret>) or token header
    const token =
      query?.token ||
      headers?.['x-webhook-token'] ||
      headers?.['x-token'];

    if (token) {
      try {
        const tokenBuf = Buffer.from(String(token));
        const secretBuf = Buffer.from(String(secret));
        if (tokenBuf.length !== secretBuf.length) {
          logger.warn('Webhook token length mismatch');
          return false;
        }
        return crypto.timingSafeEqual(tokenBuf, secretBuf);
      } catch (err) {
        logger.error({ err: err.message }, 'Failed during timingSafeEqual token verification');
        return false;
      }
    }

    // 2. Check HMAC signature headers (for platforms signing with HMAC)
    const signature =
      headers?.['x-custom-signature'] ||
      headers?.['x-signature'] ||
      headers?.['x-hub-signature-256'] ||
      headers?.['authorization'];

    if (!signature) {
      logger.warn('Missing signature or token in webhook request');
      return false;
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(typeof rawBody === 'string' ? rawBody : JSON.stringify(rawBody))
        .digest('hex');

      const cleanSig = signature.replace(/^sha256=/, '');
      const cleanSigBuf = Buffer.from(cleanSig);
      const expectedSigBuf = Buffer.from(expectedSignature);
      if (cleanSigBuf.length !== expectedSigBuf.length) return false;
      return crypto.timingSafeEqual(cleanSigBuf, expectedSigBuf);
    } catch (err) {
      logger.error({ err: err.message }, 'Failed to verify custom webhook signature');
      return false;
    }
  }

  /**
   * Normalizes any generic AI provider webhook payload into standard feedback format.
   * Accommodates common payload shapes from Vapi, Bland, Bolna, Retell, and custom webhooks.
   * @param {Object} rawPayload
   * @returns {Object} Normalized event object
   */
  normalizeWebhookEvent(rawPayload) {
    const callData = rawPayload.call || rawPayload.data || rawPayload;
    const providerCallId =
      callData.call_id ||
      callData.id ||
      callData.callId ||
      rawPayload.callId ||
      rawPayload.call_id ||
      rawPayload.providerCallId ||
      rawPayload.id;

    // Resolve call status across diverse platforms (including Ringg.ai sub_status, Vistara event/status)
    const rawStatus = (
      callData.sub_status ||
      callData.status ||
      callData.event ||
      callData.event_type ||
      callData.disconnection_reason ||
      rawPayload.sub_status ||
      rawPayload.status ||
      rawPayload.event_type ||
      rawPayload.eventType ||
      (rawPayload.event === 'call.completed' ? 'completed' : rawPayload.event === 'call.failed' ? 'failed' : '') ||
      'completed'
    ).toLowerCase();

    let mappedStatus = 'completed';
    if (
      rawStatus.includes('no_answer') ||
      rawStatus.includes('no-answer') ||
      rawStatus.includes('unanswered') ||
      rawStatus.includes('no answer') ||
      rawStatus === 'user_did_not_answer'
    ) {
      mappedStatus = 'no_answer';
    } else if (rawStatus.includes('busy') || rawStatus === 'user_busy') {
      mappedStatus = 'busy';
    } else if (
      rawStatus.includes('failed') ||
      rawStatus.includes('error') ||
      rawStatus === 'dial_failed' ||
      rawStatus === 'canceled' ||
      rawStatus === 'cancelled'
    ) {
      mappedStatus = 'failed';
    }

    // Extract dynamic analysis / feedback / deliverables answers
    const analysis = callData.analysis || callData.call_analysis || rawPayload.analysis || {};
    const answers = callData.answers || rawPayload.answers || {};
    const customData =
      analysis.custom_analysis_data ||
      callData.custom_args_values ||
      rawPayload.custom_args_values ||
      rawPayload.custom_data ||
      answers ||
      analysis;

    // Rating extraction and validation (Strictly 1 to 5)
    let rating =
      answers['Overall rating (1 to 5)'] ??
      customData.rating ??
      customData.overall_rating ??
      rawPayload.rating ??
      analysis.rating;

    if (rating !== undefined && rating !== null) {
      rating = parseInt(rating, 10);
      if (isNaN(rating) || rating < 1 || rating > 5) {
        rating = null; // Enforce Rule 7: discard invalid ratings
      }
    } else {
      rating = null;
    }

    // Sentiment extraction
    const rawSentiment = (
      callData.sentiment ||
      analysis.sentiment ||
      analysis.user_sentiment ||
      rawPayload.sentiment ||
      'neutral'
    ).toLowerCase();
    const validSentiments = ['positive', 'neutral', 'negative', 'unknown'];
    const sentiment = validSentiments.includes(rawSentiment) ? rawSentiment : 'neutral';

    // Duration extraction (Handles Ringg.ai call_duration, seconds, or ms)
    let durationSeconds =
      callData.call_duration ||
      callData.duration_seconds ||
      callData.duration ||
      rawPayload.call_duration ||
      rawPayload.durationSeconds ||
      Math.round((callData.duration_ms || 0) / 1000);

    if (typeof durationSeconds !== 'number' || isNaN(durationSeconds)) {
      durationSeconds = 0;
    }

    // Feedback text & transcript
    let rawTranscript = '';
    if (Array.isArray(callData.transcript)) {
      rawTranscript = callData.transcript
        .map((turn) => `${turn.role || 'speaker'}: ${turn.text || ''}`)
        .join('\n');
    } else if (Array.isArray(rawPayload.transcript)) {
      rawTranscript = rawPayload.transcript
        .map((turn) => `${turn.role || 'speaker'}: ${turn.text || ''}`)
        .join('\n');
    } else {
      rawTranscript =
        callData.transcript ||
        rawPayload.transcript ||
        callData.rawTranscript ||
        '';
    }

    // Comments and summary
    const customerComments =
      answers['Customer comments and suggestions'] ||
      customData.feedback_text ||
      rawPayload.feedbackText ||
      '';

    const feedbackText =
      customerComments ||
      callData.summary ||
      analysis.summary ||
      analysis.call_summary ||
      rawTranscript ||
      '';

    const summary =
      callData.summary ||
      analysis.summary ||
      analysis.call_summary ||
      rawPayload.summary ||
      'Feedback conversation completed.';

    // Language extraction
    let rawLang = (
      answers['Primary language used'] ||
      customData.language_used ||
      rawPayload.language ||
      analysis.language ||
      'malayalam'
    ).toLowerCase();

    let languageUsed = 'malayalam';
    if (rawLang.includes('eng')) languageUsed = 'english';
    else if (rawLang.includes('manglish') || rawLang.includes('mixed')) languageUsed = 'manglish';
    else if (rawLang.includes('malayalam')) languageUsed = 'malayalam';

    // Opt-out detection
    const optOutRequested = Boolean(
      answers['Did customer request Do-Not-Call opt out?'] === 'Yes' ||
      customData.opt_out_requested ||
      customData.opt_out ||
      rawPayload.optOut ||
      rawPayload.opt_out
    );

    // Complaint detection
    const complaintDetected = Boolean(
      answers['Was a complaint or issue reported?'] === 'Yes' ||
      customData.complaint_detected ||
      rawPayload.complaint ||
      (rating !== null && rating <= 2)
    );

    // Complaint summary
    const complaintSummary =
      answers['Complaint summary'] ||
      customData.complaint_summary ||
      undefined;

    // Recording URL
    const recordingUrl =
      callData.recordingUrl ||
      callData.recording_url ||
      rawPayload.recordingUrl ||
      rawPayload.recording_url ||
      null;

    return {
      providerCallId,
      eventType: mappedStatus,
      durationSeconds,
      rawTranscript,
      recordingUrl,
      extractedFeedback: {
        overallRating: rating,
        feedbackText,
        summary,
        sentiment,
        languageUsed,
        complaintDetected,
        complaintCategory: customData.complaint_category || (complaintDetected ? 'service' : undefined),
        complaintSummary,
        suggestion: customData.suggestion || undefined,
        optOutRequested,
        recordingUrl,
      },
      failureReason: callData.disconnection_reason || rawPayload.error || rawPayload.failureReason || null,
    };
  }
}

