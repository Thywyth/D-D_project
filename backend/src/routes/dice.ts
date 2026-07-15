import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { roll } from '../controllers/diceController.js';

const router = Router();

router.use(authMiddleware);

router.post('/roll', roll);

export default router;
