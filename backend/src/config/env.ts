import dotenv from 'dotenv';

dotenv.config();

export const normalizeRedisUrl = (rawUrl?: string): string | undefined => {
  if (!rawUrl) return undefined;

  const value = rawUrl.trim();
  if (!value) return undefined;

  const placeholderPatterns = [
    'YOUR_UPSTASH',
    'your_upstash',
    'YOUR_REDIS',
    'your_redis',
    'placeholder',
    'example.com',
  ];

  const isPlaceholder = placeholderPatterns.some((pattern) => value.toLowerCase().includes(pattern.toLowerCase()));
  return isPlaceholder ? undefined : value;
};

export const normalizeCredential = (rawVal?: string): string | undefined => {
  if (!rawVal) return undefined;
  const value = rawVal.trim();
  if (!value) return undefined;
  const placeholderPatterns = ['your_ethereal', 'placeholder', 'example.com', 'your_username', 'your_password'];
  const isPlaceholder = placeholderPatterns.some((pattern) => value.toLowerCase().includes(pattern.toLowerCase()));
  return isPlaceholder ? undefined : value;
};

export const env = {
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/email_scheduler',
  redisUrl: normalizeRedisUrl(process.env.REDIS_URL),
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: Number(process.env.REDIS_PORT || 6379),
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  redisTls: process.env.REDIS_TLS === 'true' || process.env.REDIS_TLS === '1',
  jwtSecret: process.env.JWT_SECRET || 'development-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY || 3),
  emailRateLimitMax: Number(process.env.EMAIL_RATE_LIMIT_MAX || 5),
  emailRateLimitDuration: Number(process.env.EMAIL_RATE_LIMIT_DURATION || 1000),
  etherealHost: process.env.ETHEREAL_HOST || 'smtp.ethereal.email',
  etherealPort: Number(process.env.ETHEREAL_PORT || 587),
  etherealUser: normalizeCredential(process.env.ETHEREAL_USER),
  etherealPass: normalizeCredential(process.env.ETHEREAL_PASS),
};
