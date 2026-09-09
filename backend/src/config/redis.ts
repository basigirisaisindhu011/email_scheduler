import IORedis from 'ioredis';
import net from 'node:net';
import { env } from './env.js';

let memoryServerInstance: any = null;

const checkPortOpen = (port: number, host: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
};

export const ensureRedisServer = async () => {
  const isOpen = await checkPortOpen(env.redisPort, env.redisHost);
  if (!isOpen) {
    console.log(`Redis port ${env.redisPort} not active. Starting embedded Redis Memory Server...`);
    const { RedisMemoryServer } = await import('redis-memory-server');
    memoryServerInstance = new RedisMemoryServer({
      instance: { port: env.redisPort },
    });
    await memoryServerInstance.getHost();
    await memoryServerInstance.getPort();
    console.log(`Embedded Redis Memory Server running at ${env.redisHost}:${env.redisPort}`);
  }
};

export const redis = new IORedis({
  host: env.redisHost,
  port: env.redisPort,
  password: env.redisPassword || undefined,
  maxRetriesPerRequest: null,
  enableReadyCheck: true,
  retryStrategy(times) {
    return Math.min(times * 100, 3000);
  },
});
