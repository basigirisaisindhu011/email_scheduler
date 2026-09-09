import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { authService } from '../services/authService.js';
import { registerSchema, loginSchema } from '../validators/auth.js';

const router = Router();

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }

    const result = await authService.register(parsed.data.name, parsed.data.email, parsed.data.password);
    return res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed', errors: parsed.error.flatten() });
    }

    const result = await authService.login(parsed.data.email, parsed.data.password);
    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/me', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const profile = await authService.getProfile(userId);
    return res.status(200).json(profile);
  } catch (error) {
    next(error);
  }
});

export default router;
