import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { CallStatus, FeedbackStatus } from '../models/FeedbackProcess.js';
import { OptOutRegistry } from '../models/OptOutRegistry.js';
import { logger } from '../utils/logger.js';

/**
 * Checks if the given date/time is within permissible commercial calling hours in India (IST).
 * TRAI Rules: Permitted commercial call window is 10:00 AM to 08:00 PM IST.
 */
export function isWithinCallingHours(date = new Date(), timezone = env.TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hour = parseInt(parts.find((p) => p.type === 'hour').value, 10);
  const minute = parseInt(parts.find((p) => p.type === 'minute').value, 10);
  const currentMinutes = hour * 60 + minute;

  const [startHour, startMin] = env.CALLING_HOURS_START.split(':').map((v) => parseInt(v, 10));
  const [endHour, endMin] = env.CALLING_HOURS_END.split(':').map((v) => parseInt(v, 10));

  const windowStartMinutes = startHour * 60 + startMin;
  const windowEndMinutes = endHour * 60 + endMin;

  return currentMinutes >= windowStartMinutes && currentMinutes < windowEndMinutes;
}

/**
 * Calculates the next eligible calling timestamp in IST (e.g. 10:15 AM next morning).
 */
export function getNextEligibleCallingTime(fromTime = new Date(), timezone = env.TIMEZONE) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(fromTime);
  const year = parseInt(parts.find((p) => p.type === 'year').value, 10);
  const month = parseInt(parts.find((p) => p.type === 'month').value, 10);
  const day = parseInt(parts.find((p) => p.type === 'day').value, 10);
  const hour = parseInt(parts.find((p) => p.type === 'hour').value, 10);

  const [startHour, startMin] = env.CALLING_HOURS_START.split(':').map((v) => parseInt(v, 10));
  const targetHour = startHour;
  const targetMinute = startMin + 15;

  let targetDay = day;
  if (hour >= 20) {
    targetDay += 1;
  }

  const pad = (n) => String(n).padStart(2, '0');
  const istString = `${year}-${pad(month)}-${pad(targetDay)}T${pad(targetHour)}:${pad(targetMinute)}:00+05:30`;

  return new Date(istString);
}

/**
 * Comprehensive pre-flight check before initiating any call.
 */
export async function evaluateCallingEligibility(process, purchase) {
  // 1. Completion Check: Has feedback already been collected?
  if (process.feedbackStatus === FeedbackStatus.COLLECTED) {
    return {
      eligible: false,
      reason: 'Feedback conversation already successfully completed.',
      newStatus: CallStatus.COMPLETED,
    };
  }

  // 2. Direct Process/Purchase Opt-out Flag Check
  if (process.doNotCall || purchase.optedOut) {
    return {
      eligible: false,
      reason: 'Customer has opted out of automated calls.',
      newStatus: CallStatus.OPTED_OUT,
    };
  }

  // 3. Explicit Customer Consent Check
  if (!purchase.feedbackCallConsent) {
    return {
      eligible: false,
      reason: 'Customer did not grant consent for feedback calls.',
      newStatus: CallStatus.SKIPPED,
    };
  }

  // 4. Attempt Limit Check (Rule: Maximum 2 attempts total)
  if (process.attemptCount >= process.maxAttempts) {
    return {
      eligible: false,
      reason: `Maximum permitted call attempts reached (${process.maxAttempts}).`,
      newStatus: CallStatus.EXHAUSTED,
    };
  }

  // 5. Centralized Opt-Out Registry Check (when database connection active)
  if (mongoose.connection.readyState === 1 && purchase.normalizedPhoneNumber) {
    try {
      const isRegisteredOptOut = await OptOutRegistry.exists({
        normalizedPhoneNumber: purchase.normalizedPhoneNumber,
      });
      if (isRegisteredOptOut) {
        return {
          eligible: false,
          reason: 'Customer phone number is registered in Do-Not-Call / Opt-Out Registry.',
          newStatus: CallStatus.OPTED_OUT,
        };
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'Failed to check OptOutRegistry');
    }
  }

  // 6. Calling Hours Window Check (TRAI Compliance)
  const now = new Date();
  if (!isWithinCallingHours(now)) {
    const nextTime = getNextEligibleCallingTime(now);
    return {
      eligible: false,
      deferUntil: nextTime,
      reason: `Current time is outside permissible calling hours (${env.CALLING_HOURS_START} - ${env.CALLING_HOURS_END} IST). Deferred to next window.`,
      newStatus: CallStatus.SCHEDULED,
    };
  }

  return { eligible: true };
}
