import { Request, Response, NextFunction } from 'express';

interface RouteMetric {
    count: number;
    totalDurationMs: number;
    errors4xx: number;
    errors5xx: number;
}

const startTime = Date.now();
const counters = {
    totalRequests: 0,
    errors4xx: 0,
    errors5xx: 0,
};
const routeMetrics = new Map<string, RouteMetric>();

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
    const begin = Date.now();
    counters.totalRequests++;

    res.on('finish', () => {
        const duration = Date.now() - begin;
        const status = res.statusCode;
        const key = `${req.method} ${req.route?.path ?? req.path}`;

        if (status >= 400 && status < 500) counters.errors4xx++;
        else if (status >= 500) counters.errors5xx++;

        const existing = routeMetrics.get(key) ?? { count: 0, totalDurationMs: 0, errors4xx: 0, errors5xx: 0 };
        existing.count++;
        existing.totalDurationMs += duration;
        if (status >= 400 && status < 500) existing.errors4xx++;
        else if (status >= 500) existing.errors5xx++;
        routeMetrics.set(key, existing);
    });

    next();
}

export function getMetrics() {
    const uptimeSeconds = Math.floor((Date.now() - startTime) / 1000);

    const routes = Array.from(routeMetrics.entries())
        .map(([route, m]) => ({
            route,
            requests: m.count,
            avgDurationMs: m.count > 0 ? Math.round(m.totalDurationMs / m.count) : 0,
            errors4xx: m.errors4xx,
            errors5xx: m.errors5xx,
        }))
        .sort((a, b) => b.requests - a.requests);

    return {
        uptimeSeconds,
        totalRequests: counters.totalRequests,
        errors4xx: counters.errors4xx,
        errors5xx: counters.errors5xx,
        errorRate: counters.totalRequests > 0
            ? Number((((counters.errors4xx + counters.errors5xx) / counters.totalRequests) * 100).toFixed(2))
            : 0,
        topRoutes: routes.slice(0, 10),
    };
}
