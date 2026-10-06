import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getComments, createComment, deleteComment } from '../controllers/comments';

const router = Router();

router.get('/images/:id/comments', getComments);
router.post('/images/:id/comments', requireAuth, createComment);
router.delete('/comments/:id', requireAuth, deleteComment);

export default router;
