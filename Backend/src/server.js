import { app } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { startReconciliationTimer } from './workers/callingWorker.js';
import { logger } from './utils/logger.js';

let reconciliationTimer = null;

async function startServer() {
  await connectDB();

  // Start background calling worker so scheduled/due calls dial automatically
  reconciliationTimer = startReconciliationTimer(10000);

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 API Server running on port ${env.PORT} in ${env.NODE_ENV} mode`);
    logger.info(`Health check available at http://localhost:${env.PORT}/api/v1/health`);
  });

  const gracefulShutdown = async (signal) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    if (reconciliationTimer) clearInterval(reconciliationTimer);
    server.close(async () => {
      await disconnectDB();
      logger.info('Closed out remaining connections.');
      process.exit(0);
    });

    // Force close after 10s if stuck
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    logger.error({ err }, 'Failed to start server');
    process.exit(1);
  });
}

