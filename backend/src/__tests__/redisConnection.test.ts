import test, { describe, after } from 'node:test';
import assert from 'node:assert/strict';
import { redis, ensureRedisServer, stopRedisServer } from '../config/redis.js';
import { emailQueue, createQueueWorker } from '../queues/emailQueue.js';

describe('Redis and BullMQ Connectivity', () => {
  after(async () => {
    await emailQueue.close();
    redis.disconnect();
    await stopRedisServer();
    setTimeout(() => process.exit(0), 100);
  });

  test('connects to Redis and pings successfully', async () => {
    await ensureRedisServer();
    const pingResult = await redis.ping();
    assert.strictEqual(pingResult, 'PONG');
  });

  test('initializes BullMQ Queue correctly', async () => {
    assert.ok(emailQueue, 'emailQueue should be instantiated');
    const isPaused = await emailQueue.isPaused();
    assert.strictEqual(typeof isPaused, 'boolean');
  });

  test('initializes BullMQ Worker with shared Redis connection', async () => {
    const testWorker = createQueueWorker(async () => {});
    assert.ok(testWorker, 'BullMQ Worker should be created successfully');
    await testWorker.close();
  });
});
