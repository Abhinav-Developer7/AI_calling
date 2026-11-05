/**
 * Abstract Base Class for Voice Telephony Providers (Retell, Vapi, Exotel, Mock).
 */
export class VoiceProvider {
  /**
   * Initiates an outbound feedback call.
   * @param {Object} params - Call parameters (to, customerName, invoiceNumber, itemsSummary, feedbackProcessId)
   * @returns {Promise<{ providerCallId: string, status: string }>}
   */
  async initiateCall(params) {
    throw new Error('initiateCall must be implemented by the provider adapter');
  }

  /**
   * Verifies incoming webhook HMAC signature.
   * @param {Object} headers - HTTP request headers
   * @param {Buffer|string} rawBody - Raw body buffer or string
   * @returns {boolean}
   */
  verifyWebhookSignature(headers, rawBody) {
    throw new Error('verifyWebhookSignature must be implemented by the provider adapter');
  }

  /**
   * Normalizes provider-specific webhook payload into a standardized event structure.
   * @param {Object} rawPayload - Raw webhook body
   * @returns {Object} Normalized event object
   */
  normalizeWebhookEvent(rawPayload) {
    throw new Error('normalizeWebhookEvent must be implemented by the provider adapter');
  }
}

