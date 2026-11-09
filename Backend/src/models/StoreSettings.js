import mongoose from 'mongoose';

const storeSettingsSchema = new mongoose.Schema(
  {
    storeName: {
      type: String,
      required: true,
      trim: true,
      default: 'Aurum Jewellery',
    },
    brandDisplayName: {
      type: String,
      required: true,
      trim: true,
      default: 'Aurum Jewellery',
    },
    branchName: {
      type: String,
      trim: true,
      default: 'Ernakulam Flagship Store',
    },
    callingHoursStart: {
      type: String,
      required: true,
      trim: true,
      default: '10:00',
    },
    callingHoursEnd: {
      type: String,
      required: true,
      trim: true,
      default: '20:00',
    },
    timezone: {
      type: String,
      required: true,
      trim: true,
      default: 'Asia/Kolkata',
    },
    callDelayMinutes: {
      type: Number,
      required: true,
      default: 15,
      min: 0,
    },
    maxCallAttempts: {
      type: Number,
      required: true,
      default: 2,
      min: 1,
      max: 5,
    },
    retryDelayMinutes: {
      type: Number,
      required: true,
      default: 30,
      min: 5,
    },
    aiAgentName: {
      type: String,
      trim: true,
      default: 'Anjali',
    },
    aiVoiceLanguage: {
      type: String,
      trim: true,
      default: 'Malayalam & English',
    },
    aiAgentTone: {
      type: String,
      trim: true,
      default: 'Polite & Warm (Kerala Malayalam)',
    },
    aiAgentGreeting: {
      type: String,
      trim: true,
      default: 'Namaskaram! This is Anjali from Aurum Jewellery regarding your recent jewellery purchase.',
    },
    retentionDays: {
      type: Number,
      default: 180, // DPDP compliance: 180 days default customer recording retention
    },
  },
  {
    timestamps: true,
  }
);

export const StoreSettings = mongoose.model('StoreSettings', storeSettingsSchema);

