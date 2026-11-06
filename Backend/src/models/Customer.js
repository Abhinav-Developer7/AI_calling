import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    normalizedPhoneNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    originalPhoneNumber: {
      type: String,
      trim: true,
    },
    firstPurchaseDate: {
      type: Date,
      default: Date.now,
    },
    lastPurchaseDate: {
      type: Date,
      default: Date.now,
    },
    totalPurchasesCount: {
      type: Number,
      default: 1,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    isOptedOut: {
      type: Boolean,
      default: false,
      index: true,
    },
    optedOutAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Customer = mongoose.model('Customer', customerSchema);
