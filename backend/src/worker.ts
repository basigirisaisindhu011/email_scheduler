import { createQueueWorker } from './queues/emailQueue.js';
import { prisma } from './config/prisma.js';
import { redis, ensureRedisServer } from './config/redis.js';
import { sendEmail } from './services/emailSendingService.js';

const worker = createQueueWorker(async (job) => {
  const emailId = String(job.data.emailId);
  const email = await prisma.scheduledEmail.findUnique({ where: { id: emailId } });

  if (!email) {
    return;
  }

  if (email.status === 'SENT' || email.status === 'CANCELLED') {
    return;
  }

  await prisma.scheduledEmail.update({
    where: { id: email.id },
    data: { status: 'PROCESSING' },
  });

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

    console.log(`Email sent: ${email.id}`, info);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown send error';
    await prisma.scheduledEmail.update({
      where: { id: email.id },
      data: {
        status: 'FAILED',
        failureReason: message,
      },
    });

    console.error(`Failed to send email ${email.id}:`, message);
    throw error;
  }
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
