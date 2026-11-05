import pino from 'pino';
import { env } from '../config/env.js';

export function maskPhoneNumber(phone) {
  if (!phone || typeof phone !== 'string') return phone;
  const cleaned = phone.trim();
  if (cleaned.length <= 4) return '****';
  // Show first 3 and last 2 characters, mask the middle
  const start = cleaned.slice(0, 3);
  const end = cleaned.slice(-2);
  const maskedLength = Math.max(0, cleaned.length - 5);
  return `${start}${'*'.repeat(maskedLength)}${end}`;
}

export function maskObjectPII(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(maskObjectPII);

  const masked = {};
  for (const [key, value] of Object.entries(obj)) {
    if (['phoneNumber', 'normalizedPhoneNumber', 'phone', 'to'].includes(key)) {
      masked[key] = maskPhoneNumber(value);
    } else if (['password', 'token', 'authorization', 'apiKey', 'secret'].includes(key.toLowerCase())) {
      masked[key] = '***REDACTED***';
    } else if (value && typeof value === 'object') {
      masked[key] = maskObjectPII(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

export const logger = pino({
  level: env.NODE_ENV === 'test' ? 'silent' : env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
});

