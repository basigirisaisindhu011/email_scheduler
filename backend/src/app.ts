import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import { swaggerSpec } from './config/swagger.js';
import authRoutes from './routes/auth.js';
import emailRoutes from './routes/email.js';
import { errorHandler } from './middleware/errorHandler.js';
import { prisma } from './config/prisma.js';
import { redis } from './config/redis.js';
import { emailService } from './services/emailService.js';

export const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const configuredFrontend = (env.frontendUrl || 'https://email-scheduler-frontend-gamma.vercel.app').replace(/\/$/, '');
      const incomingOrigin = origin.replace(/\/$/, '');

      const isAllowed =
        incomingOrigin === configuredFrontend ||
        incomingOrigin === 'https://email-scheduler-frontend-gamma.vercel.app' ||
        incomingOrigin.endsWith('.vercel.app') ||
        incomingOrigin === 'http://localhost:5173' ||
        incomingOrigin === 'http://localhost:3000' ||
        process.env.NODE_ENV !== 'production';

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', async (_req, res) => {
  let dbState = 'disconnected';
  let redisState = 'disconnected';

  try {
    await prisma.$queryRaw`SELECT 1`;
    dbState = 'connected';
  } catch {
    dbState = 'error';
  }

  try {
    await redis.ping();
    redisState = 'connected';
  } catch {
    redisState = 'error';
  }

  res.json({ status: 'ok', database: dbState, redis: redisState });
});

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/auth', authRoutes);
app.use('/api', emailRoutes);

app.use(errorHandler);

export const startupReconciliation = async () => {
  await emailService.reconcileScheduledJobs();
};
