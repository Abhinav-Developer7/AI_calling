import mongoose from 'mongoose';

export const ComplaintCategory = {
  STAFF_BEHAVIOR: 'staff_behavior',
  QUALITY_CRAFTSMANSHIP: 'quality_craftsmanship',
  PRICING_BILLING: 'pricing_billing',
  DELAY: 'delay',
  OTHER: 'other',
};

export const ComplaintStatus = {
  OPEN: 'open',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed',
};

export const ComplaintPriority = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

const complaintSchema = new mongoose.Schema(
  {
    purchaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
      required: true,
      index: true,
    },
    feedbackProcessId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FeedbackProcess',
      required: true,
      index: true,
    },
    feedbackId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Feedback',
      required: true,
    },
    category: {
      type: String,
      enum: Object.values(ComplaintCategory),
      default: ComplaintCategory.OTHER,
    },
    priority: {
      type: String,
      enum: Object.values(ComplaintPriority),
      default: ComplaintPriority.MEDIUM,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(ComplaintStatus),
      default: ComplaintStatus.OPEN,
      index: true,
    },
    resolutionNotes: {
      type: String,
      trim: true,
    },
    resolvedAt: {
      type: Date,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const Complaint = mongoose.model('Complaint', complaintSchema);

