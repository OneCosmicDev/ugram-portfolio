import { exec } from 'child_process';
import { createServer } from 'http';
import fs from 'fs';
import path from 'path';
import app from './app';
import { initSocket, setIO } from './socket';
import logger from './utils/logger';
import { startup } from './utils/startup';

const PORT = process.env.PORT || 4000;
const MIGRATION_NAME = '20260415234421_normalize_hashtags_m2m';
const frontendUrl = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || 'http://localhost:3000';

function runCommand(cmd: string): Promise<void> {
    return new Promise((resolve, reject) => {
        exec(cmd, (error, _stdout, stderr) => {
            if (error) reject(new Error(stderr || error.message));
            else resolve();
        });
    });
}

async function runMigrations(): Promise<void> {
    startup.migrationStatus = 'running';
    try {
        await runCommand('npx prisma migrate deploy');
    } catch (err) {
        const msg = (err as Error).message;
        if (msg.includes('P3005')) {
            logger.warn('DB has schema without migration history — baselining...');
            await runCommand(`npx prisma migrate resolve --applied "${MIGRATION_NAME}"`);
            await runCommand('npx prisma migrate deploy');
        } else {
            throw err;
        }
    }
}

fs.mkdirSync(path.join(process.cwd(), 'uploads'), { recursive: true });

const httpServer = createServer(app);
const io = initSocket(httpServer, frontendUrl);
setIO(io);

// Start listening FIRST so EB health check gets a response immediately.
// Migrations run in the background — /api/status reflects the current state.
httpServer.listen(PORT, () => {
    logger.info(`Ugram API running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`Storage: ${process.env.AWS_ACCESS_KEY_ID ? 'S3' : 'local disk'}`);

    runMigrations()
        .then(() => {
            startup.migrationStatus = 'done';
            logger.info('Database migrations complete — app fully ready');
        })
        .catch((err: Error) => {
            startup.migrationStatus = 'failed';
            startup.migrationError = err.message;
            logger.error('Database migration failed — shutting down', { error: err.message });
            // Exit so EB marks the deployment as failed and triggers rollback.
            process.exit(1);
        });
});
