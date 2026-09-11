import { createQueueWorker } from './queues/emailQueue.js';
import { prisma } from './config/prisma.js';
import { redis, ensureRedisServer } from './config/redis.js';
import { sendEmail } from './services/emailSendingService.js';

const worker = createQueueWorker(async (job) => {
  const emailId = String(job.data.emailId);
  console.log(`[Worker] Processing job ${job.id} for email ${emailId}`);

  const email = await prisma.scheduledEmail.findUnique({ where: { id: emailId } });

  if (!email) {
    console.warn(`[Worker] Email ${emailId} not found in database`);
    return;
  }

  if (email.status === 'SENT' || email.status === 'CANCELLED') {
    console.log(`[Worker] Email ${emailId} is already in status ${email.status}. Skipping.`);
    return;
  }

  console.log(`[Worker] Sending email to ${email.recipient}`);

  await prisma.scheduledEmail.update({
    where: { id: email.id },
    data: { status: 'PROCESSING' },
  });
  console.log(`[Worker] Status updated to PROCESSING for email ${email.id}`);

  try {
    const info = await sendEmail({
      to: email.recipient,
      subject: email.subject,
      text: email.body,
      html: `<p>${email.body}</p>`,
    });

    await prisma.scheduledEmail.update({
      where: { id: email.id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        failureReason: null,
      },
    });

    console.log(`[Worker] Email sent successfully to ${email.recipient}`);
    console.log(`[Worker] Status updated to SENT for email ${email.id}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown send error';
    await prisma.scheduledEmail.update({
      where: { id: email.id },
      data: {
        status: 'FAILED',
        failureReason: message,
      },
    });

    console.error(`[Worker] Email failed for ${email.id}: ${message}`);
    throw error;
  }
});

worker.on('completed', (job) => {
  console.log(`[Worker] BullMQ marked job ${job.id} as COMPLETED`);
});

worker.on('failed', (job, err) => {
  console.error(`[Worker] BullMQ marked job ${job?.id} as FAILED: ${err.message}`);
});

const startWorker = async () => {
  await ensureRedisServer();
  await prisma.$connect();
  await redis.ping();
  console.log('Worker started');
};

startWorker();


const shutdown = async (signal: string) => {
  console.log(`Received ${signal}. Closing worker...`);
  await worker.close();
  await prisma.$disconnect();
  await redis.quit();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
