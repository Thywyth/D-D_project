import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getRoomNotebooks,
  updateNotebook,
} from '../controllers/notebookController.js';

const router = Router();

router.use(authMiddleware);

router.get('/room/:roomId', getRoomNotebooks);
router.patch('/:id', updateNotebook);

export default router;