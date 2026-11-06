import mongoose from 'mongoose';

const purchaseSchema = new mongoose.Schema(
  {
    source: {
      type: String,
      required: true,
      trim: true,
      default: 'billing_pos',
    },
    externalPurchaseId: {
      type: String,
      required: true,
      trim: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
      trim: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    normalizedPhoneNumber: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    purchaseDate: {
      type: Date,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
      uppercase: true,
    },
    itemsSummary: {
      type: String,
      required: true,
      trim: true,
    },
    branchId: {
      type: String,
      trim: true,
      default: 'main_branch',
    },
    feedbackCallConsent: {
      type: Boolean,
      required: true,
      default: false,
    },
    consentCapturedAt: {
      type: Date,
      default: Date.now,
    },
    optedOut: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique purchase per source billing system
purchaseSchema.index({ source: 1, externalPurchaseId: 1 }, { unique: true });
purchaseSchema.index({ invoiceNumber: 1 });
purchaseSchema.index({ purchaseDate: -1 });

export const Purchase = mongoose.model('Purchase', purchaseSchema);

