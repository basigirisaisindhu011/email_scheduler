import { z } from 'zod';

export const createEmailSchema = z.object({
  recipient: z.string().email('Recipient must be a valid email address'),
  subject: z.string().trim().min(1, 'Subject is required'),
  body: z.string().trim().min(1, 'Body is required'),
  scheduledAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'scheduledAt must be a valid date string',
  }).refine((value) => new Date(value).getTime() > Date.now(), {
    message: 'scheduledAt must be in the future',
  }),
});

export const rescheduleEmailSchema = z.object({
  scheduledAt: z.string().refine((value) => !Number.isNaN(Date.parse(value)), {
    message: 'scheduledAt must be a valid date string',
  }).refine((value) => new Date(value).getTime() > Date.now(), {
    message: 'scheduledAt must be in the future',
  }),
});

export const emailQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.enum(['SCHEDULED', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED']).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'scheduledAt', 'sentAt']).default('createdAt'),
  order: z.enum(['asc', 'desc']).default('desc'),
});


