import mongoose from 'mongoose';

export const CallStatus = {
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  QUEUED: 'queued',
  CALLING: 'calling',
  COMPLETED: 'completed',
  NO_ANSWER: 'no_answer',
  BUSY: 'busy',
  FAILED: 'failed',
  RETRY_SCHEDULED: 'retry_scheduled',
  SKIPPED: 'skipped',
  OPTED_OUT: 'opted_out',
  CANCELLED: 'cancelled',
  EXHAUSTED: 'exhausted',
};

export const FeedbackStatus = {
  NOT_STARTED: 'not_started',
  PARTIALLY_COLLECTED: 'partially_collected',
  COLLECTED: 'collected',
  NOT_PROVIDED: 'not_provided',
};

const feedbackProcessSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
      unique: true,
      index: true,
    },
    callStatus: {
      type: String,
      enum: Object.values(CallStatus),
      default: CallStatus.PENDING,
      index: true,
    },
    feedbackStatus: {
      type: String,
      enum: Object.values(FeedbackStatus),
      default: FeedbackStatus.NOT_STARTED,
      index: true,
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    nextAttemptAt: {
      type: Date,
      index: true,
    },
    lastAttemptAt: {
      type: Date,
    },
    attemptCount: {
      type: Number,
      default: 0,
      min: 0,
      max: 2, // Hard rule: max 2 attempts
    },
    maxAttempts: {
      type: Number,
      default: 2,
    },
    completedAt: {
      type: Date,
    },
    // Distributed lease lock for workers
    lockLeaseUntil: {
      type: Date,
    },
    lockedBy: {
      type: String,
    },
    cancellationReason: {
      type: String,
    },
    doNotCall: {
      type: Boolean,
      default: false,
      index: true,
    },
    requiresFollowUp: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

feedbackProcessSchema.index({ callStatus: 1, nextAttemptAt: 1 });

export const FeedbackProcess = mongoose.model('FeedbackProcess', feedbackProcessSchema);

