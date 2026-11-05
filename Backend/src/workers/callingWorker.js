import { Worker } from 'bullmq';
import { connectDB, disconnectDB } from '../config/db.js';
import { getRedisConnection } from '../queues/callingQueue.js';
import { executeCallAttempt } from '../services/callingService.js';
import { FeedbackProcess, CallStatus } from '../models/FeedbackProcess.js';
import { logger } from '../utils/logger.js';

const WORKER_ID = `worker-${process.pid}-${Date.now()}`;
let isShuttingDown = false;
let reconciliationInterval = null;
let bullWorker = null;

/**
 * Durable MongoDB reconciliation loop.
 * Guarantees that even if Redis was offline or restarted, any due calls are picked up.
 */
export async function reconcileDueCalls() {
  if (isShuttingDown) return;

  try {
    const now = new Date();

    const dueProcesses = await FeedbackProcess.find({
      callStatus: { $in: [CallStatus.SCHEDULED, CallStatus.RETRY_SCHEDULED] },
      $or: [
        { scheduledAt: { $lte: now } },
        { nextAttemptAt: { $lte: now } },
      ],
      $and: [
        {
          $or: [
            { lockLeaseUntil: { $exists: false } },
            { lockLeaseUntil: { $lt: now } },
          ],
        },
      ],
    })
      .limit(10)
      .select('_id');

    for (const process of dueProcesses) {
      if (isShuttingDown) break;
      await executeCallAttempt(process._id, WORKER_ID);
    }
  } catch (error) {
    logger.warn({ err: error.message }, 'Error in calling reconciliation cycle');
  }
}

/**
 * Starts a background periodic reconciliation timer in the running server.
 */
export function startReconciliationTimer(intervalMs = 10000) {
  const timer = setInterval(reconcileDueCalls, intervalMs);
  reconcileDueCalls(); // Run once immediately
  logger.info(`Background calling reconciliation active (interval: ${intervalMs}ms)`);
  return timer;
}

async function startWorker() {
  logger.info(`Starting Calling Worker Service (${WORKER_ID})...`);
  await connectDB();

  // 1. Initialize BullMQ Queue Worker
  try {
    const connection = getRedisConnection();
    bullWorker = new Worker(
      'feedback-calling-queue',
      async (job) => {
        logger.info({ jobId: job.id, processId: job.data.feedbackProcessId }, 'Processing scheduled BullMQ calling job');
        return executeCallAttempt(job.data.feedbackProcessId, WORKER_ID);
      },
      {
        connection,
        concurrency: 5,
      }
    );

    bullWorker.on('completed', (job) => {
      logger.info({ jobId: job.id }, 'BullMQ calling job completed');
    });

    bullWorker.on('failed', (job, err) => {
      logger.error({ jobId: job?.id, err: err.message }, 'BullMQ calling job failed');
    });
  } catch (err) {
    logger.warn({ err: err.message }, 'BullMQ worker disabled. Falling back to MongoDB scheduler.');
  }

  // 2. Start durable reconciliation loop (runs every 10 seconds)
  reconciliationInterval = setInterval(reconcileDueCalls, 10000);
  // Run first reconciliation immediately
  reconcileDueCalls();

  logger.info('Calling Worker is active and monitoring due feedback calls.');
}

const gracefulShutdown = async (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  logger.info(`Received ${signal}. Shutting down worker gracefully...`);

  if (reconciliationInterval) {
    clearInterval(reconciliationInterval);
  }

  if (bullWorker) {
    await bullWorker.close();
  }

  await disconnectDB();
  logger.info('Worker shutdown complete.');
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

if (process.env.NODE_ENV !== 'test') {
  startWorker().catch((err) => {
    logger.error({ err }, 'Fatal error starting calling worker');
    process.exit(1);
  });
}

