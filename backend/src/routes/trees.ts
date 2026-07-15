import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  createTree,
  listTrees,
  getTree,
  addNode,
  updateNode,
  deleteNode,
  toggleVisibility,
  saveNodeNote,
} from '../controllers/treeController.js';

const router = Router();

router.use(authMiddleware);

router.post('/', createTree);
router.get('/room/:roomId', listTrees);
router.get('/:id', getTree);
router.post('/:id/nodes', addNode);
router.patch('/:id/nodes/:nodeId', updateNode);
router.delete('/:id/nodes/:nodeId', deleteNode);
router.patch('/:id/nodes/:nodeId/visibility', toggleVisibility);
router.post('/:id/nodes/:nodeId/notes', saveNodeNote);

export default router;
