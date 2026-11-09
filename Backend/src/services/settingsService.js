import { StoreSettings } from '../models/StoreSettings.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let cachedSettings = null;
let lastFetchedAt = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Retrieves the current store settings.
 * Ensures a default record exists in MongoDB.
 */
export async function getStoreSettings() {
  const now = Date.now();
  if (cachedSettings && now - lastFetchedAt < CACHE_TTL_MS) {
    return cachedSettings;
  }

  let settings = await StoreSettings.findOne().lean();

  if (!settings) {
    // Seed default settings from environment variables
    const created = await StoreSettings.create({
      storeName: 'Aurum Jewellery',
      brandDisplayName: 'Aurum Jewellery',
      branchName: 'Ernakulam Flagship Store',
      callingHoursStart: env.CALLING_HOURS_START || '10:00',
      callingHoursEnd: env.CALLING_HOURS_END || '20:00',
      timezone: env.TIMEZONE || 'Asia/Kolkata',
      callDelayMinutes: env.CALL_DELAY_MINUTES || 15,
      maxCallAttempts: env.MAX_CALL_ATTEMPTS || 2,
      retryDelayMinutes: env.RETRY_DELAY_MINUTES || 30,
      aiAgentName: 'Anjali',
      aiVoiceLanguage: 'Malayalam & English',
      aiAgentTone: 'Polite & Warm (Kerala Malayalam)',
      aiAgentGreeting: 'Namaskaram! This is Anjali from Aurum Jewellery regarding your recent jewellery purchase.',
      retentionDays: 180,
    });
    settings = created.toObject();
    logger.info('Initialized default StoreSettings document in database');
  }

  cachedSettings = settings;
  lastFetchedAt = now;
  return settings;
}

/**
 * Updates store settings.
 */
export async function updateStoreSettings(updates) {
  const allowedFields = [
    'storeName',
    'brandDisplayName',
    'branchName',
    'callingHoursStart',
    'callingHoursEnd',
    'timezone',
    'callDelayMinutes',
    'maxCallAttempts',
    'retryDelayMinutes',
    'aiAgentName',
    'aiVoiceLanguage',
    'aiAgentTone',
    'aiAgentGreeting',
    'retentionDays',
  ];

  const filteredUpdates = {};
  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      filteredUpdates[key] = updates[key];
    }
  }

  let settings = await StoreSettings.findOneAndUpdate(
    {},
    { $set: filteredUpdates },
    { new: true, upsert: true, runValidators: true }
  ).lean();

  cachedSettings = settings;
  lastFetchedAt = Date.now();

  logger.info({ updates: filteredUpdates }, 'StoreSettings updated successfully');
  return settings;
}

