import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getNotifications, markAsRead, markAllRead } from '../controllers/notifications';

const router = Router();

router.get('/notifications', requireAuth, getNotifications);
router.patch('/notifications/read-all', requireAuth, markAllRead);
router.patch('/notifications/:id/read', requireAuth, markAsRead);

export default router;
