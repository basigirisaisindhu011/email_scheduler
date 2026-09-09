import { app, startupReconciliation } from './app.js';
import { env } from './config/env.js';
import { prisma } from './config/prisma.js';
import { redis, ensureRedisServer } from './config/redis.js';

let isShuttingDown = false;

const shutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`Received ${signal}. Shutting down gracefully...`);

  try {
    await prisma.$disconnect();
    await redis.quit();
    console.log('Database and Redis connections closed');
  } finally {
    process.exit(0);
  }
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

const startServer = async () => {
  try {
    await ensureRedisServer();
    await prisma.$connect();
    await redis.ping();
    await startupReconciliation();

    app.listen(env.port, () => {
      console.log(`Server listening on http://localhost:${env.port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};


startServer();
