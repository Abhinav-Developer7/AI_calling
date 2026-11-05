import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';
import { CustomAIProvider } from '../../src/providers/voice/CustomAIProvider.js';

describe('CustomAIProvider', () => {
  let provider;

  beforeEach(() => {
    provider = new CustomAIProvider();
  });

  describe('normalizeWebhookEvent', () => {
    it('should correctly normalize a standard successful call payload', () => {
      const rawPayload = {
        call_id: 'call_abc_123',
        status: 'completed',
        duration_seconds: 75,
        transcript: 'Customer loved the shopping experience.',
        analysis: {
          custom_analysis_data: {
            rating: 5,
            feedback_text: 'Staff was very helpful.',
            language_used: 'malayalam',
          },
          sentiment: 'positive',
          summary: 'Positive feedback',
        },
      };

      const normalized = provider.normalizeWebhookEvent(rawPayload);

      expect(normalized.providerCallId).toBe('call_abc_123');
      expect(normalized.eventType).toBe('completed');
      expect(normalized.durationSeconds).toBe(75);
      expect(normalized.extractedFeedback.overallRating).toBe(5);
      expect(normalized.extractedFeedback.sentiment).toBe('positive');
      expect(normalized.extractedFeedback.complaintDetected).toBe(false);
      expect(normalized.extractedFeedback.optOutRequested).toBe(false);
    });

    it('should enforce Rule 7: reject ratings outside 1-5 and set to null', () => {
      const rawPayload = {
        call_id: 'call_invalid_rating',
        status: 'completed',
        analysis: {
          custom_analysis_data: {
            rating: 10, // Invalid rating
          },
        },
      };

      const normalized = provider.normalizeWebhookEvent(rawPayload);
      expect(normalized.extractedFeedback.overallRating).toBeNull();
    });

    it('should auto-detect complaint when rating is 2 or lower', () => {
      const rawPayload = {
        call_id: 'call_complaint_rating',
        status: 'completed',
        analysis: {
          custom_analysis_data: {
            rating: 2,
            feedback_text: 'Too long waiting in billing counter.',
          },
        },
      };

      const normalized = provider.normalizeWebhookEvent(rawPayload);
      expect(normalized.extractedFeedback.overallRating).toBe(2);
      expect(normalized.extractedFeedback.complaintDetected).toBe(true);
    });

    it('should correctly map no-answer and busy states', () => {
      const busyPayload = {
        call_id: 'call_busy_123',
        status: 'user_busy',
      };
      const noAnswerPayload = {
        call_id: 'call_no_ans_123',
        status: 'no_answer',
      };

      expect(provider.normalizeWebhookEvent(busyPayload).eventType).toBe('busy');
      expect(provider.normalizeWebhookEvent(noAnswerPayload).eventType).toBe('no_answer');
    });

    it('should detect opt-out requests', () => {
      const optOutPayload = {
        call_id: 'call_optout_123',
        status: 'completed',
        analysis: {
          custom_analysis_data: {
            opt_out_requested: true,
          },
        },
      };

      const normalized = provider.normalizeWebhookEvent(optOutPayload);
      expect(normalized.extractedFeedback.optOutRequested).toBe(true);
    });

    it('should correctly normalize Ringg.ai webhook payload with array transcript and sub_status', () => {
      const ringgPayload = {
        event_type: 'call_completed',
        call_id: '8fa588e2-4e28-442b-817a-88bbd367548a',
        status: 'completed',
        sub_status: 'COMPLETED',
        call_duration: 52,
        custom_args_values: {
          callee_name: 'Anjali',
          rating: 4,
          feedback_text: 'Staff was courteous and helpful with Malayalam guidance.',
          language_used: 'malayalam',
        },
        transcript: [
          { role: 'agent', text: 'Namaskaram Anjali, Aurum Jewellery-il ninnumulla call aanu.' },
          { role: 'user', text: 'Enikku nalla experience aayirunnu. 4 rating tharam.' }
        ]
      };

      const normalized = provider.normalizeWebhookEvent(ringgPayload);
      expect(normalized.providerCallId).toBe('8fa588e2-4e28-442b-817a-88bbd367548a');
      expect(normalized.eventType).toBe('completed');
      expect(normalized.durationSeconds).toBe(52);
      expect(normalized.extractedFeedback.overallRating).toBe(4);
      expect(normalized.extractedFeedback.languageUsed).toBe('malayalam');
      expect(normalized.rawTranscript).toContain('agent: Namaskaram Anjali');
      expect(normalized.rawTranscript).toContain('user: Enikku nalla experience');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('should return true if no webhook secret is configured', () => {
      provider.webhookSecret = '';
      expect(provider.verifyWebhookSignature({}, {})).toBe(true);
    });

    it('should verify valid HMAC signature when secret is configured', () => {
      const secret = 'my_test_secret_12345';
      provider.webhookSecret = secret;

      const body = JSON.stringify({ event: 'call_ended', call_id: 'test_call' });
      const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');

      const headers = { 'x-signature': signature };
      expect(provider.verifyWebhookSignature(headers, body)).toBe(true);
    });

    it('should reject invalid HMAC signature', () => {
      provider.webhookSecret = 'my_test_secret_12345';
      const body = JSON.stringify({ event: 'call_ended' });
      const headers = { 'x-signature': 'invalid_signature_hex' };

      expect(provider.verifyWebhookSignature(headers, body)).toBe(false);
    });

    it('should verify valid Vistara URL query token using constant-time comparison', () => {
      provider.webhookSecret = 'whsec_vistara_jewellery_fb_98a72b64d1f0';
      const validQuery = { token: 'whsec_vistara_jewellery_fb_98a72b64d1f0' };
      const invalidQuery = { token: 'invalid_token_attempt_123456789012' };

      expect(provider.verifyWebhookSignature({}, {}, validQuery)).toBe(true);
      expect(provider.verifyWebhookSignature({}, {}, invalidQuery)).toBe(false);
    });
  });

  describe('normalizeWebhookEvent - Vistara AI payload', () => {
    it('should cleanly parse Vistara call.completed webhook and deliverables answers', () => {
      const vistaraPayload = {
        event: 'call.completed',
        timestamp: '2026-11-05T08:59:22.022Z',
        callId: 'c5dd8a9a-7368-4e9c-970b-bc51b86c1abb',
        data: {
          customerName: 'Abhinav',
          phone: '+918086939423',
          duration: 55,
          status: 'completed',
          transcript: 'Agent: നമസ്കാരം\nCustomer: അതെ',
          summary: 'Positive feedback regarding jewellery shopping.',
          sentiment: 'Positive',
          answers: {
            'Overall rating (1 to 5)': '4',
            'Was a complaint or issue reported?': 'No',
            'Complaint summary': null,
            'Customer comments and suggestions': 'Friendly staff and good collection.',
            'Did customer request Do-Not-Call opt out?': 'No',
            'Primary language used': 'Malayalam',
          },
          meaningfulConversation: true,
          recordingUrl: 'https://pub-289b538dd626497894edab150e829e31.r2.dev/recordings/test.mp3',
        },
      };

      const normalized = provider.normalizeWebhookEvent(vistaraPayload);

      expect(normalized.providerCallId).toBe('c5dd8a9a-7368-4e9c-970b-bc51b86c1abb');
      expect(normalized.eventType).toBe('completed');
      expect(normalized.durationSeconds).toBe(55);
      expect(normalized.extractedFeedback.overallRating).toBe(4);
      expect(normalized.extractedFeedback.sentiment).toBe('positive');
      expect(normalized.extractedFeedback.languageUsed).toBe('malayalam');
      expect(normalized.extractedFeedback.complaintDetected).toBe(false);
      expect(normalized.extractedFeedback.optOutRequested).toBe(false);
      expect(normalized.extractedFeedback.feedbackText).toBe('Friendly staff and good collection.');
      expect(normalized.extractedFeedback.recordingUrl).toBe(
        'https://pub-289b538dd626497894edab150e829e31.r2.dev/recordings/test.mp3'
      );
    });

    it('should detect complaint and opt-out from Vistara answers', () => {
      const vistaraComplaintPayload = {
        event: 'call.completed',
        callId: 'call_complaint_999',
        data: {
          duration: 60,
          status: 'completed',
          sentiment: 'Negative',
          answers: {
            'Overall rating (1 to 5)': '2',
            'Was a complaint or issue reported?': 'Yes',
            'Complaint summary': 'Billing delay occurred at counter',
            'Did customer request Do-Not-Call opt out?': 'Yes',
          },
        },
      };

      const normalized = provider.normalizeWebhookEvent(vistaraComplaintPayload);

      expect(normalized.extractedFeedback.overallRating).toBe(2);
      expect(normalized.extractedFeedback.complaintDetected).toBe(true);
      expect(normalized.extractedFeedback.complaintSummary).toBe('Billing delay occurred at counter');
      expect(normalized.extractedFeedback.optOutRequested).toBe(true);
      expect(normalized.extractedFeedback.sentiment).toBe('negative');
    });
  });
});

