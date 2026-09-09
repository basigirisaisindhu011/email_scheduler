import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/email_scheduler',
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number(process.env.REDIS_PORT || 6379),
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  jwtSecret: process.env.JWT_SECRET || 'development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY || 3),
  emailRateLimitMax: Number(process.env.EMAIL_RATE_LIMIT_MAX || 5),
  emailRateLimitDuration: Number(process.env.EMAIL_RATE_LIMIT_DURATION || 1000),
  etherealHost: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
  etherealPort: Number(process.env.ETHEREAL_PORT || 587),
  etherealUser: process.env.ETHEREAL_USER || '',
  etherealPass: process.env.ETHEREAL_PASS || '',
};
