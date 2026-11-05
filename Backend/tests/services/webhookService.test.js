import { describe, it, expect } from 'vitest';
import { RetellVoiceProvider } from '../../src/providers/voice/RetellVoiceProvider.js';
import { MockVoiceProvider } from '../../src/providers/voice/MockVoiceProvider.js';

describe('Voice Provider Webhook Event Normalization', () => {
  const retellProvider = new RetellVoiceProvider();
  const mockProvider = new MockVoiceProvider();

  it('should correctly normalize completed call with valid 1-5 rating', () => {
    const rawPayload = {
      event: 'call_ended',
      call: {
        call_id: 'call_12345',
        disconnection_reason: 'agent_hung_up',
        duration_ms: 65000,
        transcript: 'Customer expressed satisfaction with gold purchase.',
        call_analysis: {
          user_sentiment: 'Positive',
          call_summary: 'Customer rated 5 stars for jewelry craftsmanship.',
          custom_analysis_data: {
            rating: 5,
            language_used: 'malayalam',
          },
        },
      },
    };

    const normalized = retellProvider.normalizeWebhookEvent(rawPayload);

    expect(normalized.providerCallId).toBe('call_12345');
    expect(normalized.eventType).toBe('completed');
    expect(normalized.durationSeconds).toBe(65);
    expect(normalized.extractedFeedback.overallRating).toBe(5);
    expect(normalized.extractedFeedback.sentiment).toBe('positive');
    expect(normalized.extractedFeedback.languageUsed).toBe('malayalam');
    expect(normalized.extractedFeedback.complaintDetected).toBe(false);
  });

  it('should sanitize and reject invalid out-of-bounds ratings (Rule 7)', () => {
    const rawPayload = {
      event: 'call_ended',
      call: {
        call_id: 'call_invalid_rating',
        disconnection_reason: 'agent_hung_up',
        call_analysis: {
          custom_analysis_data: {
            rating: 10, // Invalid: must be 1-5
          },
        },
      },
    };

    const normalized = retellProvider.normalizeWebhookEvent(rawPayload);
    // Invalid rating must be converted to null
    expect(normalized.extractedFeedback.overallRating).toBeNull();
  });

  it('should automatically flag complaint review when rating <= 2', () => {
    const rawPayload = {
      event: 'call_ended',
      call: {
        call_id: 'call_low_rating',
        disconnection_reason: 'user_hung_up',
        duration_ms: 30000,
        call_analysis: {
          user_sentiment: 'Negative',
          call_summary: 'Customer complained about billing queue delay.',
          custom_analysis_data: {
            rating: 2,
            complaint_category: 'delay',
          },
        },
      },
    };

    const normalized = retellProvider.normalizeWebhookEvent(rawPayload);
    expect(normalized.extractedFeedback.overallRating).toBe(2);
    expect(normalized.extractedFeedback.sentiment).toBe('negative');
    expect(normalized.extractedFeedback.complaintDetected).toBe(true);
    expect(normalized.extractedFeedback.complaintCategory).toBe('delay');
  });

  it('should map disconnection reasons (no_answer, busy, failed)', () => {
    const noAnswerPayload = {
      call: {
        call_id: 'call_no_ans',
        disconnection_reason: 'user_did_not_answer',
      },
    };
    expect(retellProvider.normalizeWebhookEvent(noAnswerPayload).eventType).toBe('no_answer');

    const busyPayload = {
      call: {
        call_id: 'call_busy',
        disconnection_reason: 'user_busy',
      },
    };
    expect(retellProvider.normalizeWebhookEvent(busyPayload).eventType).toBe('busy');

    const dialFailedPayload = {
      call: {
        call_id: 'call_failed',
        disconnection_reason: 'dial_failed',
      },
    };
    expect(retellProvider.normalizeWebhookEvent(dialFailedPayload).eventType).toBe('failed');
  });

  it('should verify mock provider normalizes correctly', () => {
    const mockPayload = {
      providerCallId: 'call_mock_123',
      rating: 4,
      sentiment: 'positive',
    };
    const normalized = mockProvider.normalizeWebhookEvent(mockPayload);
    expect(normalized.providerCallId).toBe('call_mock_123');
    expect(normalized.extractedFeedback.overallRating).toBe(4);
    expect(normalized.eventType).toBe('completed');
  });
});

