import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createCharacter,
  getCharacter,
  listRoomCharacters,
  updateCharacter,
  updateCharacterStatus,
  transferCoins,
} from '../controllers/characterController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createCharacter);
router.get('/room/:roomId', listRoomCharacters);
router.get('/:id', getCharacter);
router.patch('/:id', updateCharacter);
router.patch('/:id/status', updateCharacterStatus);
router.post('/transfer-coins', transferCoins);

export default router;
