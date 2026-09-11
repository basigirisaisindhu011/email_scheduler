import type { Prisma } from '@prisma/client';
import { prisma } from '../config/prisma.js';
import { addEmailJob, getQueueJob, removeQueueJob } from '../queues/emailQueue.js';
import { AppError } from '../utils/errors.js';

export const emailService = {
  async listEmails(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      status?: 'SCHEDULED' | 'PROCESSING' | 'SENT' | 'FAILED' | 'CANCELLED';
      search?: string;
      sortBy?: 'createdAt' | 'scheduledAt' | 'sentAt';
      order?: 'asc' | 'desc';
    },
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: Prisma.ScheduledEmailWhereInput = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? {
            OR: [
              { recipient: { contains: query.search, mode: 'insensitive' } },
              { subject: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.scheduledEmail.findMany({
        where,
        orderBy: { [query.sortBy ?? 'createdAt']: query.order ?? 'desc' },
        skip,
        take: limit,
      }),
      prisma.scheduledEmail.count({ where }),
    ]);

    return {
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  },

  async getById(userId: string, emailId: string) {
    const email = await prisma.scheduledEmail.findFirst({
      where: { id: emailId, userId },
    });

    if (!email) {
      throw new AppError('Email not found', 404);
    }

    return email;
  },

  async scheduleEmail(
    userId: string,
    payload: {
      recipient: string;
      subject: string;
      body: string;
      scheduledAt: string;
    },
  ) {
    const scheduledAtDate = new Date(payload.scheduledAt);

    const email = await prisma.scheduledEmail.create({
      data: {
        userId,
        recipient: payload.recipient,
        subject: payload.subject,
        body: payload.body,
        scheduledAt: scheduledAtDate,
        status: 'SCHEDULED',
      },
    });

    try {
      const job = await addEmailJob(email.id, scheduledAtDate);
      const jobIdStr = job.id ? String(job.id) : `email-${email.id}`;
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: { jobId: jobIdStr },
      });
      return { ...email, jobId: jobIdStr };
    } catch (error) {
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: { status: 'FAILED', failureReason: 'Queue scheduling failed' },
      });
      throw error;
    }
  },

  async cancelEmail(userId: string, emailId: string) {
    const email = await prisma.scheduledEmail.findFirst({
      where: { id: emailId, userId, status: { not: 'SENT' } },
    });

    if (!email) {
      throw new AppError('Scheduled email not found or already sent', 404);
    }

    if (email.jobId) {
      await removeQueueJob(email.jobId);
    }

    return prisma.scheduledEmail.update({
      where: { id: emailId },
      data: {
        status: 'CANCELLED',
        failureReason: 'Cancelled by user',
      },
    });
  },

  async rescheduleEmail(userId: string, emailId: string, newScheduledAt: string) {
    const email = await prisma.scheduledEmail.findFirst({
      where: { id: emailId, userId, status: 'SCHEDULED' },
    });

    if (!email) {
      throw new AppError('Scheduled email not found or cannot be rescheduled', 404);
    }

    if (email.jobId) {
      await removeQueueJob(email.jobId);
    }

    const scheduledAtDate = new Date(newScheduledAt);
    const job = await addEmailJob(email.id, scheduledAtDate);
    const jobIdStr = job.id ? String(job.id) : `email-${email.id}`;

    return prisma.scheduledEmail.update({
      where: { id: emailId },
      data: {
        scheduledAt: scheduledAtDate,
        jobId: jobIdStr,
        status: 'SCHEDULED',
      },
    });
  },

  async getStats(userId: string) {
    const counts = await prisma.scheduledEmail.groupBy({
      by: ['status'],
      where: { userId },
      _count: { status: true },
    });

    const stats = {
      scheduled: 0,
      sent: 0,
      failed: 0,
      cancelled: 0,
    };

    for (const item of counts) {
      if (item.status === 'SCHEDULED') stats.scheduled = item._count.status;
      if (item.status === 'SENT') stats.sent = item._count.status;
      if (item.status === 'FAILED') stats.failed = item._count.status;
      if (item.status === 'CANCELLED') stats.cancelled = item._count.status;
    }

    return stats;
  },

  async reconcileScheduledJobs() {
    const emails = await prisma.scheduledEmail.findMany({
      where: { status: { in: ['SCHEDULED', 'PROCESSING'] } },
    });

    for (const email of emails) {
      if (email.status === 'PROCESSING') {
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: { status: 'SCHEDULED' },
        });
      }

      if (!email.jobId) {
        const newJob = await addEmailJob(email.id, email.scheduledAt);
        const jobIdStr = newJob.id ? String(newJob.id) : `email-${email.id}`;
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: { jobId: jobIdStr },
        });
        continue;
      }

      const queueJob = await getQueueJob(email.jobId);
      if (!queueJob) {
        const newJob = await addEmailJob(email.id, email.scheduledAt);
        const jobIdStr = newJob.id ? String(newJob.id) : `email-${email.id}`;
        await prisma.scheduledEmail.update({
          where: { id: email.id },
          data: { jobId: jobIdStr },
        });
      }
    }
  },
};

