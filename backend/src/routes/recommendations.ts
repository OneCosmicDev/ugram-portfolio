import { Router } from 'express';
import { getInterestBasedImages } from '../controllers/recommendations';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/recommended', requireAuth, getInterestBasedImages);

export default router;
