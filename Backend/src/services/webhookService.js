import { WebhookEvent } from '../models/WebhookEvent.js';
import { CallAttempt, AttemptStatus } from '../models/CallAttempt.js';
import { FeedbackProcess, CallStatus, FeedbackStatus } from '../models/FeedbackProcess.js';
import { Feedback, SentimentEnum } from '../models/Feedback.js';
import { Complaint, ComplaintCategory, ComplaintStatus, ComplaintPriority } from '../models/Complaint.js';
import { Purchase } from '../models/Purchase.js';
import { markCustomerDoNotCall } from './callingService.js';
import { isWithinCallingHours, getNextEligibleCallingTime } from './callingEligibilityService.js';
import { scheduleFeedbackCallJob } from '../queues/callingQueue.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

export async function processProviderWebhook({
  provider = 'custom',
  externalEventId,
  normalizedEvent,
  rawPayload,
}) {
  const eventId = externalEventId || `evt_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  // 1. Idempotency Check
  const existingEvent = await WebhookEvent.findOne({ provider, externalEventId: eventId });
  if (existingEvent && existingEvent.processingStatus === 'processed') {
    logger.info({ provider, externalEventId: eventId }, 'Duplicate webhook event received; safely ignoring.');
    return { duplicate: true, message: 'Event already processed' };
  }

  // 2. Persist Webhook Event for Audit Trail
  let webhookRecord = existingEvent;
  if (!webhookRecord) {
    webhookRecord = await WebhookEvent.create({
      provider,
      externalEventId: eventId,
      eventType: normalizedEvent.eventType,
      payload: rawPayload,
      processingStatus: 'pending',
    });
  }

  try {
    const { providerCallId, eventType, durationSeconds, rawTranscript, extractedFeedback, failureReason } =
      normalizedEvent;

    // 3. Locate linked CallAttempt
    const callAttempt = await CallAttempt.findOne({ providerCallId });
    if (!callAttempt) {
      logger.warn({ providerCallId }, 'Webhook received for unknown providerCallId; recorded for audit.');
      webhookRecord.processingStatus = 'ignored';
      webhookRecord.errorDetails = 'No matching CallAttempt found for providerCallId';
      await webhookRecord.save();
      return { success: false, reason: 'CallAttempt not found' };
    }

    // 4. Locate linked FeedbackProcess
    const feedbackProcess = await FeedbackProcess.findById(callAttempt.feedbackProcessId);
    if (!feedbackProcess) {
      webhookRecord.processingStatus = 'failed';
      webhookRecord.errorDetails = 'FeedbackProcess missing';
      await webhookRecord.save();
      return { success: false, reason: 'FeedbackProcess not found' };
    }

    // Update CallAttempt telemetry
    callAttempt.status = eventType;
    callAttempt.durationSeconds = durationSeconds || 0;
    callAttempt.endedAt = new Date();
    if (extractedFeedback?.recordingUrl || normalizedEvent?.recordingUrl) {
      callAttempt.recordingUrl = extractedFeedback?.recordingUrl || normalizedEvent?.recordingUrl;
    }
    if (failureReason) {
      callAttempt.telephonyError = { code: 'CALL_DISCONNECTED', message: failureReason };
    }
    await callAttempt.save();

    // 5. Invariant Protection: Completed processes cannot be regressed
    if (feedbackProcess.callStatus === CallStatus.COMPLETED) {
      logger.info({ processId: feedbackProcess._id }, 'Process already marked completed. Ignoring status regression.');
      webhookRecord.processingStatus = 'processed';
      webhookRecord.processedAt = new Date();
      await webhookRecord.save();
      return { success: true, message: 'Process already completed' };
    }

    // 6. Handle Outcomes
    if (eventType === 'completed') {
      // Validate rating (1-5 or null)
      let validatedRating = extractedFeedback?.overallRating;
      if (typeof validatedRating === 'number') {
        validatedRating = Math.round(validatedRating);
        if (validatedRating < 1 || validatedRating > 5) {
          validatedRating = null;
        }
      } else {
        validatedRating = null;
      }

      // Create Feedback Record
      const feedback = await Feedback.create({
        feedbackProcessId: feedbackProcess._id,
        callAttemptId: callAttempt._id,
        overallRating: validatedRating,
        feedbackText: extractedFeedback?.feedbackText || '',
        summary: extractedFeedback?.summary || 'Feedback conversation completed.',
        languageUsed: extractedFeedback?.languageUsed || 'malayalam',
        sentiment: extractedFeedback?.sentiment || SentimentEnum.NEUTRAL,
        complaintDetected: Boolean(extractedFeedback?.complaintDetected),
        complaintSummary: extractedFeedback?.complaintSummary,
        suggestion: extractedFeedback?.suggestion,
        recordingUrl: extractedFeedback?.recordingUrl || normalizedEvent?.recordingUrl,
        transcript: rawTranscript,
        transcriptReference: rawTranscript ? `transcript_call_${callAttempt._id}` : undefined,
        collectedAt: new Date(),
      });

      // Update FeedbackProcess
      feedbackProcess.callStatus = CallStatus.COMPLETED;
      feedbackProcess.feedbackStatus = FeedbackStatus.COLLECTED;
      feedbackProcess.completedAt = new Date();
      await feedbackProcess.save();

      // Check Customer Opt-Out Request during call
      if (extractedFeedback?.optOutRequested) {
        await markCustomerDoNotCall(feedbackProcess._id, 'Customer verbal request during feedback call');
      }

      // Check Complaint Escalation Trigger: Rating <= 2 OR complaintDetected
      if ((validatedRating !== null && validatedRating <= 2) || extractedFeedback?.complaintDetected) {
        const priority = validatedRating !== null && validatedRating === 1 ? ComplaintPriority.HIGH : ComplaintPriority.MEDIUM;
        const category = extractedFeedback?.complaintCategory || ComplaintCategory.OTHER;
        const description =
          extractedFeedback?.complaintSummary ||
          extractedFeedback?.feedbackText ||
          `Customer gave low rating (${validatedRating}/5) during feedback call.`;

        await Complaint.create({
          purchaseId: feedbackProcess.purchaseId,
          feedbackProcessId: feedbackProcess._id,
          feedbackId: feedback._id,
          category,
          priority,
          description,
          status: ComplaintStatus.OPEN,
        });

        feedbackProcess.requiresFollowUp = true;
        await feedbackProcess.save();

        logger.info(
          { purchaseId: feedbackProcess.purchaseId, rating: validatedRating },
          'Complaint record automatically created for staff attention'
        );
      }
    } else if (eventType === 'no_answer' || eventType === 'busy') {
      // Temporary Telephony Failure: Check Retry Policy (Max 2 attempts total)
      if (feedbackProcess.attemptCount < feedbackProcess.maxAttempts) {
        const retryDelayMs = env.RETRY_DELAY_MINUTES * 60 * 1000;
        let nextRetryTime = new Date(Date.now() + retryDelayMs);

        // Enforce Calling Hours Window
        if (!isWithinCallingHours(nextRetryTime)) {
          nextRetryTime = getNextEligibleCallingTime(nextRetryTime);
        }

        feedbackProcess.callStatus = CallStatus.RETRY_SCHEDULED;
        feedbackProcess.nextAttemptAt = nextRetryTime;
        feedbackProcess.cancellationReason = `Customer was ${eventType.replace('_', ' ')}. Retry scheduled.`;
        await feedbackProcess.save();

        // Enqueue delayed retry
        await scheduleFeedbackCallJob(feedbackProcess._id, nextRetryTime);

        logger.info(
          { processId: feedbackProcess._id, nextRetryTime },
          `Scheduled retry attempt #${feedbackProcess.attemptCount + 1}`
        );
      } else {
        // Max attempts reached
        feedbackProcess.callStatus = CallStatus.EXHAUSTED;
        feedbackProcess.cancellationReason = `Maximum attempts (${feedbackProcess.maxAttempts}) reached without answer.`;
        await feedbackProcess.save();
      }
    } else {
      // Failed or other unhandled outcome
      if (feedbackProcess.attemptCount < feedbackProcess.maxAttempts) {
        const retryDelayMs = env.RETRY_DELAY_MINUTES * 60 * 1000;
        let nextRetryTime = new Date(Date.now() + retryDelayMs);
        if (!isWithinCallingHours(nextRetryTime)) {
          nextRetryTime = getNextEligibleCallingTime(nextRetryTime);
        }

        feedbackProcess.callStatus = CallStatus.RETRY_SCHEDULED;
        feedbackProcess.nextAttemptAt = nextRetryTime;
        await feedbackProcess.save();
        await scheduleFeedbackCallJob(feedbackProcess._id, nextRetryTime);
      } else {
        feedbackProcess.callStatus = CallStatus.FAILED;
        feedbackProcess.cancellationReason = failureReason || 'Provider technical failure';
        await feedbackProcess.save();
      }
    }

    // 7. Finalize Webhook Record
    webhookRecord.processingStatus = 'processed';
    webhookRecord.processedAt = new Date();
    await webhookRecord.save();

    return {
      success: true,
      callStatus: feedbackProcess.callStatus,
      feedbackStatus: feedbackProcess.feedbackStatus,
    };
  } catch (error) {
    logger.error({ err: error.message }, 'Failed processing provider webhook event');
    webhookRecord.processingStatus = 'failed';
    webhookRecord.errorDetails = error.message;
    await webhookRecord.save();
    throw error;
  }
}

