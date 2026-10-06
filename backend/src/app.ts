import express, { Application, Request, Response, NextFunction } from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import session from 'express-session';
import morgan from 'morgan';
import usersRouter from './routes/users';
import imagesRouter from './routes/images';
import authRouter from './routes/auth';
import passport, { configurePassport } from './auth/passport';
import searchRouter from './routes/search';
import reactionsRouter from './routes/reactions';
import commentsRouter from './routes/comments';
import notificationsRouter from './routes/notifications';
import followsRouter from './routes/follows';
import recommendationsRouter from './routes/recommendations';
import externalPhotosRouter from './routes/externalPhotos';
import chatRouter from './routes/chat';
import logger from './utils/logger';
import { prisma } from './prisma';
import { startup } from './utils/startup';
import { apiLimiter } from './middleware/rateLimiter';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './utils/swagger';
import { metricsMiddleware, getMetrics } from './middleware/metrics';

dotenv.config();
configurePassport();

const app: Application = express();
app.set('trust proxy', 1);
const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(morgan(
    process.env.NODE_ENV === 'production' ? 'combined' : 'dev',
    { stream: { write: (msg) => logger.http(msg.trim()) } }
));

app.use(metricsMiddleware);

app.use(
    cors({
        origin: frontendUrl,
        credentials: true,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET || 'development-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.COOKIE_SECURE === 'true',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },
}));
app.use(passport.initialize());
app.use(passport.session());

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));
app.get('/api/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

app.get('/api/status', async (req: Request, res: Response) => {
    if (startup.migrationStatus !== 'done') {
        res.status(200).json({
            status: 'starting',
            migration: startup.migrationStatus,
            timestamp: new Date().toISOString(),
        });
        return;
    }

    let dbStatus: 'ok' | 'error' = 'ok';
    try {
        await prisma.$queryRaw`SELECT 1`;
    } catch {
        dbStatus = 'error';
    }

    const healthy = dbStatus === 'ok';
    res.status(healthy ? 200 : 503).json({
        status: healthy ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        services: {
            database: dbStatus,
            storage: process.env.AWS_ACCESS_KEY_ID ? 's3' : 'local',
        },
    });
});

app.get('/api/metrics', (_req: Request, res: Response) => {
    res.status(200).json(getMetrics());
});

app.get('/', (_req: Request, res: Response) => {
    res.status(200).json({
        message: 'Welcome to Ugram API',
        version: '1.0.0',
        metrics: '/api/metrics',
    });
});

app.use('/api', apiLimiter);
app.use('/api/users', followsRouter);
app.use('/api/users', usersRouter);
app.use('/api/images', recommendationsRouter);
app.use('/api/images', imagesRouter);
app.use('/auth', authRouter);
app.use('/api/search', searchRouter);
app.use('/api', reactionsRouter);
app.use('/api', commentsRouter);
app.use('/api', notificationsRouter);
app.use('/api/external-photos', externalPhotosRouter);
app.use('/api/chat', chatRouter);

app.use((req: Request, res: Response) => {
    res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`,
    });
});

app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
    logger.error(err.message, { stack: err.stack, method: req.method, path: req.path });
    res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    });
});

export default app;
