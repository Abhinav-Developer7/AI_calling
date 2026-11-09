import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000').transform((val) => parseInt(val, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_BASE_URL: z.string().default('http://localhost:5000'),

  MONGODB_URI: z.string().default('mongodb://localhost:27017/jewellery_feedback_db'),

  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.string().default('6379').transform((val) => parseInt(val, 10)),
  REDIS_PASSWORD: z.string().optional(),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters long'),
  JWT_EXPIRES_IN: z.string().default('1d'),

  BILLING_INTEGRATION_API_KEY: z.string().min(8, 'BILLING_INTEGRATION_API_KEY is required'),

  VOICE_PROVIDER: z.enum(['mock', 'retell', 'vapi', 'custom']).default('mock'),
  RETELL_API_KEY: z.string().optional(),
  RETELL_AGENT_ID: z.string().optional(),
  RETELL_WEBHOOK_SECRET: z.string().optional(),
  CUSTOM_AI_API_KEY: z.string().optional(),
  CUSTOM_AI_API_URL: z.string().optional(),
  CUSTOM_AI_AGENT_ID: z.string().optional(),
  CUSTOM_AI_CALLER_ID: z.string().optional(),
  CUSTOM_AI_WEBHOOK_SECRET: z.string().optional(),
  VISTARA_API_KEY: z.string().optional(),
  VISTARA_AGENT_ID: z.string().optional(),
  VISTARA_BASE_URL: z.string().optional(),
  VISTARA_WEBHOOK_TOKEN: z.string().optional(),
  VISTARA_CALL_TYPE: z.string().optional(),
  VISTARA_AGENT_lIST_URL: z.string().optional(),
  VISTARA_AGENT_LIST_URL: z.string().optional(),
  VISTARA_AGENT_UPDATE_URL: z.string().optional(),
  VISTARA_AGENT_CREATE_URL: z.string().optional(),

  CALLING_HOURS_START: z.string().default('10:00'),
  CALLING_HOURS_END: z.string().default('20:00'),
  TIMEZONE: z.string().default('Asia/Kolkata'),
  CALL_DELAY_MINUTES: z.string().default('15').transform((val) => parseInt(val, 10)),
  MAX_CALL_ATTEMPTS: z.string().default('2').transform((val) => parseInt(val, 10)),
  RETRY_DELAY_MINUTES: z.string().default('30').transform((val) => parseInt(val, 10)),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;

