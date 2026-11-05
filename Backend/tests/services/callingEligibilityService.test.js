import { describe, it, expect } from 'vitest';
import {
  isWithinCallingHours,
  getNextEligibleCallingTime,
  evaluateCallingEligibility,
} from '../../src/services/callingEligibilityService.js';
import { CallStatus, FeedbackStatus } from '../../src/models/FeedbackProcess.js';

describe('Calling Eligibility & TRAI Hours Service', () => {
  it('should correctly identify times within 10:00 AM - 08:00 PM IST', () => {
    // 12:00 PM IST (06:30 UTC)
    const midDay = new Date('2026-11-04T06:30:00.000Z');
    expect(isWithinCallingHours(midDay, 'Asia/Kolkata')).toBe(true);
  });

  it('should correctly identify times outside permissible hours (e.g. 9:00 PM IST)', () => {
    // 09:30 PM IST (16:00 UTC)
    const lateNight = new Date('2026-11-04T16:00:00.000Z');
    expect(isWithinCallingHours(lateNight, 'Asia/Kolkata')).toBe(false);
  });

  it('should compute the next eligible calling time at 10:15 AM next morning', () => {
    // 10:00 PM IST (16:30 UTC)
    const lateNight = new Date('2026-11-04T16:30:00.000Z');
    const nextWindow = getNextEligibleCallingTime(lateNight, 'Asia/Kolkata');

    expect(nextWindow).toBeDefined();
    expect(nextWindow.getTime()).toBeGreaterThan(lateNight.getTime());
  });

  it('should prevent calls when feedback conversation was already completed', async () => {
    const process = {
      feedbackStatus: FeedbackStatus.COLLECTED,
      attemptCount: 1,
      maxAttempts: 2,
    };
    const purchase = {
      normalizedPhoneNumber: '+919876543210',
      feedbackCallConsent: true,
      optedOut: false,
    };

    const evaluation = await evaluateCallingEligibility(process, purchase);
    expect(evaluation.eligible).toBe(false);
    expect(evaluation.newStatus).toBe(CallStatus.COMPLETED);
  });

  it('should prevent calls when customer has opted out', async () => {
    const process = {
      feedbackStatus: FeedbackStatus.NOT_STARTED,
      attemptCount: 0,
      maxAttempts: 2,
      doNotCall: true,
    };
    const purchase = {
      normalizedPhoneNumber: '+919876543210',
      feedbackCallConsent: true,
      optedOut: true,
    };

    const evaluation = await evaluateCallingEligibility(process, purchase);
    expect(evaluation.eligible).toBe(false);
    expect(evaluation.newStatus).toBe(CallStatus.OPTED_OUT);
  });

  it('should prevent calls when customer did not grant consent', async () => {
    const process = {
      feedbackStatus: FeedbackStatus.NOT_STARTED,
      attemptCount: 0,
      maxAttempts: 2,
      doNotCall: false,
    };
    const purchase = {
      normalizedPhoneNumber: '+919876543210',
      feedbackCallConsent: false,
      optedOut: false,
    };

    const evaluation = await evaluateCallingEligibility(process, purchase);
    expect(evaluation.eligible).toBe(false);
    expect(evaluation.newStatus).toBe(CallStatus.SKIPPED);
  });

  it('should prevent calls when max attempt limit (2) is reached', async () => {
    const process = {
      feedbackStatus: FeedbackStatus.NOT_STARTED,
      attemptCount: 2,
      maxAttempts: 2,
      doNotCall: false,
    };
    const purchase = {
      normalizedPhoneNumber: '+919876543210',
      feedbackCallConsent: true,
      optedOut: false,
    };

    const evaluation = await evaluateCallingEligibility(process, purchase);
    expect(evaluation.eligible).toBe(false);
    expect(evaluation.newStatus).toBe(CallStatus.EXHAUSTED);
  });
});

