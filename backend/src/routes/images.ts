import { Router } from 'express';
import {
    getAllImages,
    getUserImages,
    getImageById,
    createImage,
    updateImage,
    deleteImage,
} from '../controllers/images';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { uploadLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { updateImageSchema } from '../schemas/image';

const router = Router();

/**
 * @openapi
 * /api/images:
 *   get:
 *     tags: [Images]
 *     summary: Get all images (feed)
 *     responses:
 *       200:
 *         description: List of images
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Image'
 *   post:
 *     tags: [Images]
 *     summary: Upload a new image
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [newImage]
 *             properties:
 *               newImage:
 *                 type: string
 *                 format: binary
 *               description:
 *                 type: string
 *                 maxLength: 2200
 *     responses:
 *       201:
 *         description: Image created
 *       400:
 *         description: No file uploaded
 *       401:
 *         description: Not authenticated
 *       429:
 *         description: Too many upload requests
 */
router.get('/', getAllImages);
/**
 * @openapi
 * /api/images/user/{id}:
 *   get:
 *     tags: [Images]
 *     summary: Get all images by a specific user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of images
 */
router.get('/user/:id', getUserImages);
/**
 * @openapi
 * /api/images/{id}:
 *   get:
 *     tags: [Images]
 *     summary: Get image by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image details
 *       404:
 *         description: Image not found
 *   put:
 *     tags: [Images]
 *     summary: Update image description
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *                 maxLength: 2200
 *     responses:
 *       200:
 *         description: Updated image
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Image not found
 *   delete:
 *     tags: [Images]
 *     summary: Delete an image
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Image deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Image not found
 */
router.get('/:id', getImageById);
router.post('/', requireAuth, uploadLimiter, upload.single('newImage'), createImage);
router.put('/:id', requireAuth, validate(updateImageSchema), updateImage);
router.delete('/:id', requireAuth, deleteImage);

export default router;
