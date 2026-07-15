import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createRoom,
  listRooms,
  getRoom,
  joinRoom,
  generateCode,
  advanceTime,
} from '../controllers/roomController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createRoom);
router.get('/', listRooms);
router.post('/join', joinRoom);
router.get('/:id', getRoom);
router.post('/:id/generate-code', generateCode);
router.patch('/:id/time', advanceTime);

export default router;
