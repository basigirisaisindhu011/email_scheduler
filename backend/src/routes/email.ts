import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { emailService } from '../services/emailService.js';
import { createEmailSchema, emailQuerySchema, rescheduleEmailSchema } from '../validators/email.js';

const router = Router();

router.use(authMiddleware);

/**
 * @openapi
 * /api/emails:
 *   post:
 *     summary: Schedule a new email
 *     tags: [Emails]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateEmailRequest'
 *     responses:
 *       201:
 *         description: Email scheduled successfully
 */
router.post('/emails', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = createEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }

    const result = await emailService.scheduleEmail(req.user!.id, parsed.data);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/emails', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = emailQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }

    const result = await emailService.listEmails(req.user!.id, parsed.data);
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/emails/scheduled', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = emailQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }
    const result = await emailService.listEmails(req.user!.id, { ...parsed.data, status: 'SCHEDULED' });
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/emails/sent', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = emailQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }
    const result = await emailService.listEmails(req.user!.id, { ...parsed.data, status: 'SENT' });
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/emails/failed', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = emailQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }
    const result = await emailService.listEmails(req.user!.id, { ...parsed.data, status: 'FAILED' });
    return res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/emails/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emailId = req.params.id as string;
    const email = await emailService.getById(req.user!.id, emailId);
    return res.json(email);
  } catch (error) {
    next(error);
  }
});

router.put('/emails/:id/reschedule', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emailId = req.params.id as string;
    const parsed = rescheduleEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }

    const updated = await emailService.rescheduleEmail(req.user!.id, emailId, parsed.data.scheduledAt);
    return res.json(updated);
  } catch (error) {
    next(error);
  }
});

router.delete('/emails/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const emailId = req.params.id as string;
    const cancelled = await emailService.cancelEmail(req.user!.id, emailId);
    return res.json(cancelled);
  } catch (error) {
    next(error);
  }
});

router.get('/dashboard/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await emailService.getStats(req.user!.id);
    return res.json(stats);
  } catch (error) {
    next(error);
  }
});

export default router;

