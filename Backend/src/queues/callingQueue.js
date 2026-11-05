import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let callingQueue = null;
let redisClient = null;

export function getRedisConnection() {
  if (!redisClient) {
    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      lazyConnect: true,
    });

    redisClient.on('error', (err) => {
      // Don't crash if Redis is not running in local test mode
      logger.warn({ err: err.message }, 'Redis connection warning');
    });
  }
  return redisClient;
}

export function getCallingQueue() {
  if (!callingQueue) {
    try {
      const connection = getRedisConnection();
      callingQueue = new Queue('feedback-calling-queue', {
        connection,
        defaultJobOptions: {
          attempts: 2,
          backoff: {
            type: 'exponential',
            delay: 5000,
          },
          removeOnComplete: {
            age: 7 * 24 * 3600, // keep for 7 days
          },
          removeOnFail: {
            age: 14 * 24 * 3600, // keep for 14 days
          },
        },
      });
    } catch (err) {
      logger.warn({ err: err.message }, 'Could not initialize BullMQ calling queue');
    }
  }
  return callingQueue;
}

export async function scheduleFeedbackCallJob(feedbackProcessId, scheduledAt) {
  try {
    const queue = getCallingQueue();
    if (!queue) {
      logger.warn('Calling queue not initialized. Skipping BullMQ job enqueue.');
      return null;
    }

    const now = Date.now();
    const targetTime = new Date(scheduledAt).getTime();
    const delayMs = Math.max(0, targetTime - now);

    const job = await queue.add(
      'initiate-feedback-call',
      { feedbackProcessId: feedbackProcessId.toString() },
      {
        jobId: `call-${feedbackProcessId.toString()}`,
        delay: delayMs,
      }
    );

    logger.info(
      { feedbackProcessId, delayMs, scheduledAt },
      `Enqueued feedback calling job for ${new Date(scheduledAt).toISOString()}`
    );
    return job;
  } catch (error) {
    logger.warn({ err: error.message }, 'Failed to schedule BullMQ call job (Redis may be offline in dev)');
    return null;
  }
}

