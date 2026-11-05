import { env } from '../config/env.js';

export function authenticateApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || req.query.apiKey;

  if (!apiKey || apiKey !== env.BILLING_INTEGRATION_API_KEY) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized integration request: Invalid or missing API key.',
    });
  }

  next();
}

