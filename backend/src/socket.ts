import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';
import logger from './utils/logger';

const jwtSecret = process.env.SESSION_SECRET || 'development-session-secret';

export function initSocket(httpServer: HttpServer, frontendUrl: string): SocketIOServer {
    const io = new SocketIOServer(httpServer, {
        cors: {
            origin: frontendUrl,
            credentials: true,
        },
    });

    io.use(async (socket: Socket, next) => {
        try {
            const token = socket.handshake.auth.token as string | undefined;
            if (!token) return next(new Error('Authentication required'));

            const payload = jwt.verify(token, jwtSecret) as { userId: string };
            const user = await prisma.user.findUnique({ where: { id: payload.userId } });
            if (!user) return next(new Error('User not found'));

            (socket as Socket & { userId: string }).userId = user.id;
            next();
        } catch {
            next(new Error('Invalid token'));
        }
    });

    io.on('connection', (socket: Socket) => {
        const userId = (socket as Socket & { userId: string }).userId;
        logger.info('Socket connected', { userId, socketId: socket.id });

        socket.on('join_conversation', (conversationId: string) => {
            socket.join(`conversation:${conversationId}`);
        });

        socket.on('leave_conversation', (conversationId: string) => {
            socket.leave(`conversation:${conversationId}`);
        });

        socket.on('disconnect', () => {
            logger.info('Socket disconnected', { userId, socketId: socket.id });
        });
    });

    return io;
}

let _io: SocketIOServer | null = null;

export function setIO(io: SocketIOServer) {
    _io = io;
}

export function getIO(): SocketIOServer {
    if (!_io) throw new Error('Socket.io not initialized');
    return _io;
}
