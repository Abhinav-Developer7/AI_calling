import mongoose from 'mongoose';

const agentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Agent name is required'],
      trim: true,
    },
    language: {
      type: String,
      default: 'English',
      trim: true,
    },
    voice: {
      type: String,
      enum: ['meera', 'nisha', 'siya', 'rohan', 'dev', 'vikram'],
      default: 'meera',
    },
    first_message: {
      type: String,
      required: [true, 'First message greeting is required'],
      maxlength: [5000, 'First message cannot exceed 5000 characters'],
      trim: true,
    },
    agent_prompt: {
      type: String,
      required: [true, 'Agent prompt is required'],
      maxlength: [45000, 'Agent prompt cannot exceed 45000 characters'],
    },
    max_call: {
      type: Number,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Agent = mongoose.model('Agent', agentSchema);

