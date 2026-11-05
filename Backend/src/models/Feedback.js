import mongoose from 'mongoose';

export const SentimentEnum = {
  POSITIVE: 'positive',
  NEUTRAL: 'neutral',
  NEGATIVE: 'negative',
  UNKNOWN: 'unknown',
};

const feedbackSchema = new mongoose.Schema(
  {
    feedbackProcessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackProcess',
      required: true,
      index: true,
    },
    callAttemptId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CallAttempt',
      required: true,
    },
    overallRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    productSatisfaction: {
      type: String,
      enum: Object.values(SentimentEnum),
      default: SentimentEnum.UNKNOWN,
    },
    serviceSatisfaction: {
      type: String,
      enum: Object.values(SentimentEnum),
      default: SentimentEnum.UNKNOWN,
    },
    pricingSatisfaction: {
      type: String,
      enum: Object.values(SentimentEnum),
      default: SentimentEnum.UNKNOWN,
    },
    feedbackText: {
      type: String,
      trim: true,
    },
    summary: {
      type: String,
      trim: true,
    },
    languageUsed: {
      type: String,
      enum: ['malayalam', 'english', 'manglish', 'other'],
      default: 'english',
    },
    sentiment: {
      type: String,
      enum: Object.values(SentimentEnum),
      default: SentimentEnum.UNKNOWN,
    },
    complaintDetected: {
      type: Boolean,
      default: false,
    },
    complaintSummary: {
      type: String,
      trim: true,
    },
    suggestion: {
      type: String,
      trim: true,
    },
    transcriptReference: {
      type: String,
    },
    recordingUrl: {
      type: String,
      trim: true,
    },
    transcript: {
      type: String,
    },
    collectedAt: {
      type: Date,
      default: Date.now,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    reviewedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Feedback = mongoose.model('Feedback', feedbackSchema);

