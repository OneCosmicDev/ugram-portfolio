import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import passport from '../auth/passport';
import { prisma } from '../prisma';
import { publicUserSelect } from '../auth/publicUser';
import { authLimiter } from '../middleware/rateLimiter';
import { validate } from '../middleware/validate';
import { loginSchema } from '../schemas/auth';

const router = Router();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
const jwtSecret = process.env.SESSION_SECRET || 'development-session-secret';

const googleOAuthConfigured = Boolean(
    process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
);

async function getCurrentUser(req: Request) {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        return req.user;
    }
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
        try {
            const token = authHeader.slice(7);
            const payload = jwt.verify(token, jwtSecret) as { userId: string };
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                select: publicUserSelect,
            });
            return user;
        } catch {
            return null;
        }
    }
    return null;
}

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 */
router.get('/me', async (req: Request, res: Response) => {
    const user = await getCurrentUser(req);
    if (!user) {
        return res.status(401).json({ error: 'Not authenticated' });
    }
    return res.status(200).json({ user });
});

router.get('/google', (req: Request, res: Response, next: NextFunction) => {
    if (!googleOAuthConfigured) {
        return res.status(500).json({
            error: 'Google OAuth is not configured on the server.',
        });
    }
    return passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

router.get(
    '/google/callback',
    passport.authenticate('google', {
        failureRedirect: `${frontendUrl}/login/?error=oauth_failed`,
        session: true,
    }),
    (req: Request, res: Response) => {
        const user = req.user as { id: string };
        const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
        res.redirect(`${frontendUrl}/feed/?auth_token=${encodeURIComponent(token)}`);
    }
);

import bcrypt from 'bcryptjs';

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 1
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ValidationError'
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Too many login attempts
 */
router.post('/login', authLimiter, validate(loginSchema), async (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.password) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }
    const token = jwt.sign({ userId: user.id }, jwtSecret, { expiresIn: '7d' });
    return res.status(200).json({ 
        token, 
        user: { 
            id: user.id, 
            username: user.username, 
            email: user.email, 
            firstName: user.firstName, 
            lastName: user.lastName, 
            avatar: user.avatar 
        } 
    });
});

router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
    req.logout((logoutError) => {
        if (logoutError) {
            return next(logoutError);
        }
        req.session.destroy((sessionError) => {
            if (sessionError) {
                return next(sessionError);
            }
            res.clearCookie('connect.sid');
            return res.status(200).json({ message: 'Logged out successfully' });
        });
    });
});

export default router;
