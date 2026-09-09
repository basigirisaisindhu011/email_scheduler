import { Queue, Worker, Job, JobsOptions } from 'bullmq';
import { redis } from '../config/redis.js';
import { env } from '../config/env.js';

export const EMAIL_QUEUE_NAME = 'email-scheduler';

export const emailQueue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    removeOnComplete: { age: 3600, count: 100 },
    removeOnFail: { age: 86400, count: 100 },
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
});

export const addEmailJob = async (emailId: string, scheduledAt: Date) => {
  const delay = Math.max(0, new Date(scheduledAt).getTime() - Date.now());
  const job = await emailQueue.add(
    'send-email',
    { emailId },
    {
      delay,
      jobId: `email-${emailId}`,
      removeOnComplete: { age: 3600, count: 100 },
      removeOnFail: { age: 86400, count: 100 },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    } as JobsOptions,
  );
  return job;
};


export const getQueueJob = async (jobId: string) => {
  return await emailQueue.getJob(jobId);
};

export const removeQueueJob = async (jobId: string) => {
  const job = await emailQueue.getJob(jobId);
  if (job) await job.remove();
};

export const createQueueWorker = (handler: (job: Job) => Promise<void>) => {
  return new Worker(
    EMAIL_QUEUE_NAME,
    async (job) => {
      await handler(job);
    },
    {
      connection: redis,
      concurrency: env.workerConcurrency,
      limiter: {
        max: env.emailRateLimitMax,
        duration: env.emailRateLimitDuration,
      },
    },
  );
};
