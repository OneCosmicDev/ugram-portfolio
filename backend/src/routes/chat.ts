import { Router } from 'express';
import { getConversations, getOrCreateConversation, sendMessage, getUnreadCount } from '../controllers/chat';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/conversations', requireAuth, getConversations);
router.get('/unread', requireAuth, getUnreadCount);
router.get('/conversations/:userId', requireAuth, getOrCreateConversation);
router.post('/conversations/:userId/messages', requireAuth, sendMessage);

export default router;
