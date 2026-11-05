import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectDB() {
  if (isConnected) return;

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true,
    });
    isConnected = true;
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    logger.error({ err: error.message }, '❌ MongoDB connection error');
    if (env.NODE_ENV !== 'test') {
      process.exit(1);
    }
    throw error;
  }
}

export async function disconnectDB() {
  if (!isConnected) return;
  await mongoose.disconnect();
  isConnected = false;
  logger.info('MongoDB disconnected');
}

