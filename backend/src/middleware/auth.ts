import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';
import { publicUserSelect } from '../auth/publicUser';

const jwtSecret = process.env.SESSION_SECRET || 'development-session-secret';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        return next();
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
            if (user) {
                req.user = user as Express.User;
                return next();
            }
        } catch {
        }
    }
    return res.status(401).json({ error: 'Authentication required' });
};

export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
    if (req.isAuthenticated && req.isAuthenticated() && req.user) {
        return next();
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
            if (user) {
                req.user = user as Express.User;
            }
        } catch {
        }
    }
    return next();
};

export const requireSelf = (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as { id: string } | undefined;
    if (!user || user.id !== req.params.id) {
        return res.status(403).json({ error: 'Forbidden: you can only modify your own account' });
    }
    return next();
};
