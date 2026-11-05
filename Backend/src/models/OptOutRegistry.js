import mongoose from 'mongoose';

const optOutRegistrySchema = new mongoose.Schema(
  {
    normalizedPhoneNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    reason: {
      type: String,
      default: 'Customer verbal request during feedback call',
    },
    source: {
      type: String,
      enum: ['call_opt_out', 'admin_manual', 'billing_sync'],
      default: 'call_opt_out',
    },
    optedOutAt: {
      type: Date,
      default: Date.now,
    },
    optedOutBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

export const OptOutRegistry = mongoose.model('OptOutRegistry', optOutRegistrySchema);

