import { Router } from 'express';
import { searchUsers, searchImages, searchHashtags, getTrendingHashtags } from '../controllers/search';

const router = Router();

/**
 * @openapi
 * /api/search/users:
 *   get:
 *     tags: [Search]
 *     summary: Search users by username
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching users
 * /api/search/hashtags:
 *   get:
 *     tags: [Search]
 *     summary: Search hashtags
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching hashtags
 * /api/search/images:
 *   get:
 *     tags: [Search]
 *     summary: Search images by description or hashtag
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching images
 */
router.get('/users', searchUsers);
router.get('/hashtags/trending', getTrendingHashtags);
router.get('/hashtags', searchHashtags);
router.get('/images', searchImages);

export default router;