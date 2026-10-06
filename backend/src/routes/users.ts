import { Router } from 'express';
import { getAllUsers, getUserById, updateUser, createUser, deleteUser } from '../controllers/users';
import { requireAuth, requireSelf } from '../middleware/auth';
import { upload } from '../middleware/upload';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../schemas/user';

const router = Router();

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: Get all users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *   post:
 *     tags: [Users]
 *     summary: Create a new user (register)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, firstName, lastName]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error or username taken
 *       429:
 *         description: Too many registration attempts
 */
router.get('/', getAllUsers);
/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID (includes their images)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User with images
 *       404:
 *         description: User not found
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               bio:
 *                 type: string
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated user
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden
 *   delete:
 *     tags: [Users]
 *     summary: Delete user account
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
 *         description: User deleted
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Forbidden
 */
router.get('/:id', getUserById);
router.post('/', authLimiter, validate(createUserSchema), createUser);
router.put('/:id', requireAuth, requireSelf, upload.single('avatar'), validate(updateUserSchema), updateUser);
router.delete('/:id', requireAuth, requireSelf, deleteUser);

export default router;
