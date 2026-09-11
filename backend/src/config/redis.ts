import IORedis, { RedisOptions } from 'ioredis';
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
  if (env.redisUrl || (env.redisHost !== 'localhost' && env.redisHost !== '127.0.0.1')) {
    console.log('Using remote/Upstash Redis server.');
    return;
  }

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

const createRedisClient = (): IORedis => {
  const commonOptions: RedisOptions = {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy(times) {
      return Math.min(times * 100, 3000);
    },
  };

  if (env.redisUrl) {
    const isTls = env.redisUrl.startsWith('rediss://');
    return new IORedis(env.redisUrl, {
      ...commonOptions,
      ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
    });
  }

  const isTls = env.redisTls || (env.redisHost && env.redisHost.includes('upstash.io'));
  return new IORedis({
    host: env.redisHost,
    port: env.redisPort,
    password: env.redisPassword || undefined,
    ...commonOptions,
    ...(isTls ? { tls: { rejectUnauthorized: false } } : {}),
  });
};

export const redis = createRedisClient();

export const stopRedisServer = async () => {
  if (memoryServerInstance) {
    try {
      await memoryServerInstance.stop();
      memoryServerInstance = null;
    } catch {
      // Ignore cleanup error
    }
  }
};

redis.on('error', (err) => {
  if (err.message?.includes('ECONNREFUSED') || err.name === 'AggregateError' || err.message?.includes('closed')) {
    return;
  }
  console.error('[Redis Error]', err.message);
});
