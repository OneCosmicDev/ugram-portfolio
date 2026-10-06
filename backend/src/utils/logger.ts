import winston from 'winston';

const { combine, timestamp, colorize, printf, json } = winston.format;

const isProduction = process.env.NODE_ENV === 'production';

const devFormat = combine(
    colorize(),
    timestamp({ format: 'HH:mm:ss' }),
    printf(({ timestamp, level, message, ...meta }) => {
        const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
        return `${timestamp} [${level}] ${message}${metaStr}`;
    })
);

const prodFormat = combine(
    timestamp(),
    json()
);

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
    format: isProduction ? prodFormat : devFormat,
    transports: [new winston.transports.Console()],
});

export default logger;
