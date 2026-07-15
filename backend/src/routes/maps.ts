import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  addMarker,
  listMarkers,
  updateMarker,
  deleteMarker,
  addMap,
  deleteMap,
  setActiveMap
} from '../controllers/mapController.js';

const router = Router();

router.use(authMiddleware);

// ─── Маркери ───
router.get('/:roomId/markers', listMarkers);
router.post('/:roomId/markers', addMarker);
router.patch('/:roomId/markers/:markerId', updateMarker);
router.delete('/:roomId/markers/:markerId', deleteMarker);

// ─── Мульти-карти (Нова система) ───
router.post('/:roomId/maps', addMap);
router.delete('/:roomId/maps/:mapId', deleteMap);
router.patch('/:roomId/maps/active', setActiveMap);

export default router;
