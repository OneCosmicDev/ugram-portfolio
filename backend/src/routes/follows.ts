import { Router } from 'express';
import { toggleFollow, getFollowStatus, getRecommendedAccounts } from '../controllers/follows';
import { requireAuth, optionalAuth } from '../middleware/auth';

const router = Router();

router.get('/recommended', requireAuth, getRecommendedAccounts);
router.post('/:id/follow', requireAuth, toggleFollow);
router.get('/:id/follow', optionalAuth, getFollowStatus);

export default router;
