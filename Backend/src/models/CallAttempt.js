import mongoose from 'mongoose';

export const AttemptStatus = {
  INITIATED: 'initiated',
  RINGING: 'ringing',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  NO_ANSWER: 'no_answer',
  BUSY: 'busy',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
};

const callAttemptSchema = new mongoose.Schema(
  {
    feedbackProcessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackProcess',
      required: true,
      index: true,
    },
    attemptNumber: {
      type: Number,
      required: true,
      enum: [1, 2],
    },
    provider: {
      type: String,
      required: true,
      default: 'mock',
    },
    providerCallId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(AttemptStatus),
      default: AttemptStatus.INITIATED,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    answeredAt: {
      type: Date,
    },
    endedAt: {
      type: Date,
    },
    durationSeconds: {
      type: Number,
      default: 0,
    },
    callCost: {
      type: Number,
    },
    recordingUrl: {
      type: String,
      trim: true,
    },
    telephonyError: {
      code: { type: String },
      message: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

callAttemptSchema.index({ feedbackProcessId: 1, attemptNumber: 1 });

export const CallAttempt = mongoose.model('CallAttempt', callAttemptSchema);

