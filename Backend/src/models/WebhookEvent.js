import mongoose from 'mongoose';

const webhookEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      index: true,
    },
    externalEventId: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processed', 'failed', 'ignored'],
      default: 'pending',
    },
    errorDetails: {
      type: String,
    },
    receivedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Idempotency constraint: identical provider event ID cannot be re-processed
webhookEventSchema.index({ provider: 1, externalEventId: 1 }, { unique: true });

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);

