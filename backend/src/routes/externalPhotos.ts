import { Router } from 'express';
import { searchUnsplash, importUnsplashPhoto } from '../controllers/externalPhotos';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/search', searchUnsplash);
router.post('/import', requireAuth, importUnsplashPhoto);

export default router;
