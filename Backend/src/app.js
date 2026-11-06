import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import authRoutes from './routes/authRoutes.js';
import purchaseRoutes from './routes/purchaseRoutes.js';
import integrationRoutes from './routes/integrationRoutes.js';
import callingRoutes from './routes/callingRoutes.js';
import webhookRoutes from './routes/webhookRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

export const app = express();

app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(mongoSanitize());

// Health check endpoint
app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'jewellery-feedback-ai-calling-system',
  });
});

// Rate limit generic API endpoints
app.use('/api/v1', apiLimiter);

// Register routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/purchases', purchaseRoutes);
app.use('/api/v1/integrations', integrationRoutes);
app.use('/api/v1/feedback-processes', callingRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/feedback', feedbackRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/settings', settingsRoutes);

// Centralized error handler
app.use(errorHandler);

