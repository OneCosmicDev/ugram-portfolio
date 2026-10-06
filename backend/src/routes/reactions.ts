import { Router } from 'express';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { toggleReaction, getReactions } from '../controllers/reactions';

const router = Router();

router.post('/images/:id/reactions', requireAuth, toggleReaction);
router.get('/images/:id/reactions', optionalAuth, getReactions);

export default router;
