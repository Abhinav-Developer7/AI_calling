import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  logger.error(
    {
      err: err.message,
      stack: env.NODE_ENV !== 'production' ? err.stack : undefined,
      path: req.originalUrl,
      method: req.method,
    },
    'API Error encountered'
  );

  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    return res.status(409).json({
      success: false,
      message: `A record with this ${field} already exists.`,
    });
  }

  // Mongoose CastError (e.g. invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: `Invalid resource identifier: ${err.value}`,
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : env.NODE_ENV === 'production' ? 'An unexpected server error occurred.' : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

