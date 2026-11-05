import { FeedbackProcess, CallStatus } from '../models/FeedbackProcess.js';
import { Purchase } from '../models/Purchase.js';
import { CallAttempt, AttemptStatus } from '../models/CallAttempt.js';
import { OptOutRegistry } from '../models/OptOutRegistry.js';
import { AuditLog } from '../models/AuditLog.js';
import { evaluateCallingEligibility } from './callingEligibilityService.js';
import { getVoiceProvider } from '../providers/voice/index.js';
import { scheduleFeedbackCallJob } from '../queues/callingQueue.js';
import { logger } from '../utils/logger.js';

const LEASE_DURATION_MS = 5 * 60 * 1000; // 5 minute worker lease

/**
 * Atomically claims a feedback process for execution by a worker.
 * Prevents concurrent workers from initiating the same call attempt.
 */
export async function claimProcessForCalling(processId, workerInstanceId = 'worker-1') {
  const now = new Date();
  const leaseExpiration = new Date(now.getTime() + LEASE_DURATION_MS);

  const process = await FeedbackProcess.findOneAndUpdate(
    {
      _id: processId,
      callStatus: { $in: [CallStatus.SCHEDULED, CallStatus.RETRY_SCHEDULED] },
      $or: [
        { lockLeaseUntil: { $exists: false } },
        { lockLeaseUntil: { $lt: now } },
      ],
    },
    {
      $set: {
        callStatus: CallStatus.QUEUED,
        lockLeaseUntil: leaseExpiration,
        lockedBy: workerInstanceId,
      },
    },
    { new: true }
  );

  return process;
}

/**
 * Executes a single outbound call attempt with full pre-flight eligibility checks.
 */
export async function executeCallAttempt(processId, workerInstanceId = 'worker-1') {
  // 1. Atomically claim process
  const process = await claimProcessForCalling(processId, workerInstanceId);
  if (!process) {
    logger.debug({ processId }, 'Job already claimed or not in scheduled state. Skipping.');
    return { success: false, reason: 'Already claimed or ineligible status' };
  }

  // 2. Load linked purchase
  const purchase = await Purchase.findById(process.purchaseId);
  if (!purchase) {
    await FeedbackProcess.findByIdAndUpdate(process._id, {
      callStatus: CallStatus.FAILED,
      cancellationReason: 'Linked purchase record not found',
      $unset: { lockLeaseUntil: 1, lockedBy: 1 },
    });
    return { success: false, reason: 'Purchase not found' };
  }

  // 3. Pre-flight eligibility evaluation
  const evaluation = await evaluateCallingEligibility(process, purchase);

  if (!evaluation.eligible) {
    logger.info({ processId: process._id, reason: evaluation.reason }, 'Call attempt prevented by eligibility check');

    const updateFields = {
      callStatus: evaluation.newStatus,
      cancellationReason: evaluation.reason,
      $unset: { lockLeaseUntil: 1, lockedBy: 1 },
    };

    if (evaluation.deferUntil) {
      updateFields.nextAttemptAt = evaluation.deferUntil;
      // Re-enqueue for deferred window
      await scheduleFeedbackCallJob(process._id, evaluation.deferUntil);
    }

    await FeedbackProcess.findByIdAndUpdate(process._id, updateFields);
    return { success: false, deferred: Boolean(evaluation.deferUntil), reason: evaluation.reason };
  }

  // 4. Update attempt counters and initiate call
  const nextAttemptNumber = process.attemptCount + 1;
  const voiceProvider = getVoiceProvider();

  // Create CallAttempt record
  const callAttempt = await CallAttempt.create({
    feedbackProcessId: process._id,
    attemptNumber: nextAttemptNumber,
    provider: voiceProvider.name,
    status: AttemptStatus.INITIATED,
    startedAt: new Date(),
  });

  // Update process to CALLING
  await FeedbackProcess.findByIdAndUpdate(process._id, {
    callStatus: CallStatus.CALLING,
    attemptCount: nextAttemptNumber,
    lastAttemptAt: new Date(),
    $unset: { lockLeaseUntil: 1, lockedBy: 1 },
  });

  try {
    // 5. Call voice provider adapter
    const providerResult = await voiceProvider.initiateCall({
      to: purchase.normalizedPhoneNumber,
      customerName: purchase.customerName,
      invoiceNumber: purchase.invoiceNumber,
      itemsSummary: purchase.itemsSummary,
      feedbackProcessId: process._id.toString(),
    });

    // Update CallAttempt with provider UUID
    callAttempt.providerCallId = providerResult.providerCallId;
    await callAttempt.save();

    logger.info(
      {
        processId: process._id,
        attemptNumber: nextAttemptNumber,
        providerCallId: providerResult.providerCallId,
      },
      'Outbound feedback call successfully dispatched to provider'
    );

    return {
      success: true,
      callAttemptId: callAttempt._id,
      providerCallId: providerResult.providerCallId,
    };
  } catch (providerError) {
    logger.error({ err: providerError.message, processId: process._id }, 'Voice provider call dispatch failed');

    callAttempt.status = AttemptStatus.FAILED;
    callAttempt.telephonyError = {
      code: 'DISPATCH_ERROR',
      message: providerError.message,
    };
    await callAttempt.save();

    await FeedbackProcess.findByIdAndUpdate(process._id, {
      callStatus: CallStatus.FAILED,
      cancellationReason: `Provider error: ${providerError.message}`,
    });

    return { success: false, error: providerError.message };
  }
}

/**
 * Cancels a scheduled or queued call process.
 */
export async function cancelFeedbackProcess(processId, reason = 'Cancelled by administrator', adminUserId) {
  const process = await FeedbackProcess.findById(processId);
  if (!process) throw new Error('Feedback process not found');

  if ([CallStatus.COMPLETED, CallStatus.CALLING].includes(process.callStatus)) {
    throw new Error(`Cannot cancel a call that is already ${process.callStatus}`);
  }

  const previousStatus = process.callStatus;
  process.callStatus = CallStatus.CANCELLED;
  process.cancellationReason = reason;
  process.lockLeaseUntil = undefined;
  process.lockedBy = undefined;
  await process.save();

  if (adminUserId) {
    await AuditLog.create({
      actorUserId: adminUserId,
      action: 'CANCEL_FEEDBACK_PROCESS',
      resourceType: 'FeedbackProcess',
      resourceId: processId.toString(),
      details: { previousStatus, reason },
    });
  }

  return process;
}

/**
 * Reschedules an eligible call process.
 */
export async function rescheduleFeedbackProcess(processId, newScheduledTime, adminUserId) {
  const process = await FeedbackProcess.findById(processId);
  if (!process) throw new Error('Feedback process not found');

  if (process.callStatus === CallStatus.COMPLETED) {
    throw new Error('Cannot reschedule a process that already completed feedback');
  }

  if (process.attemptCount >= process.maxAttempts) {
    throw new Error(`Maximum attempts (${process.maxAttempts}) already exhausted`);
  }

  const scheduledAt = new Date(newScheduledTime);
  const previousStatus = process.callStatus;

  process.callStatus = CallStatus.SCHEDULED;
  process.scheduledAt = scheduledAt;
  process.nextAttemptAt = scheduledAt;
  process.cancellationReason = undefined;
  process.lockLeaseUntil = undefined;
  process.lockedBy = undefined;
  await process.save();

  await scheduleFeedbackCallJob(process._id, scheduledAt);

  if (adminUserId) {
    await AuditLog.create({
      actorUserId: adminUserId,
      action: 'RESCHEDULE_FEEDBACK_PROCESS',
      resourceType: 'FeedbackProcess',
      resourceId: processId.toString(),
      details: { previousStatus, scheduledAt },
    });
  }

  return process;
}

/**
 * Marks a customer as Do-Not-Call (opt-out) and suppresses future calls.
 */
export async function markCustomerDoNotCall(processId, reason = 'Customer requested Do-Not-Call', adminUserId) {
  const process = await FeedbackProcess.findById(processId);
  if (!process) throw new Error('Feedback process not found');

  const purchase = await Purchase.findById(process.purchaseId);

  process.doNotCall = true;
  process.callStatus = CallStatus.OPTED_OUT;
  process.cancellationReason = reason;
  await process.save();

  if (purchase) {
    purchase.optedOut = true;
    await purchase.save();

    // Register in centralized OptOutRegistry
    await OptOutRegistry.findOneAndUpdate(
      { normalizedPhoneNumber: purchase.normalizedPhoneNumber },
      {
        normalizedPhoneNumber: purchase.normalizedPhoneNumber,
        reason,
        source: adminUserId ? 'admin_manual' : 'call_opt_out',
        optedOutAt: new Date(),
        optedOutBy: adminUserId,
      },
      { upsert: true }
    );
  }

  if (adminUserId) {
    await AuditLog.create({
      actorUserId: adminUserId,
      action: 'OPT_OUT_CUSTOMER',
      resourceType: 'FeedbackProcess',
      resourceId: processId.toString(),
      details: { reason, phone: purchase?.normalizedPhoneNumber },
    });
  }

  return process;
}

