// packages/common-backend/src/logger/middleware.ts
import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { logger, LogCategory } from "./logger";

interface RequestWithTracking extends Request {
    requestId?: string;
    startTime?: number;
}

// Request logging middleware
export const requestLoggerMiddleware = (
    req: RequestWithTracking,
    res: Response,
    next: NextFunction
): void => {
    // Generate unique request ID
    req.requestId = uuidv4();
    req.startTime = Date.now();

    // Add correlation ID if not present
    if (!req.headers["x-correlation-id"]) {
        req.headers["x-correlation-id"] = req.requestId;
    }

    // Log incoming request
    logger.info(
        `Incoming request: ${req.method} ${req.originalUrl}`,
        LogCategory.API,
        {
            requestId: req.requestId,
            method: req.method,
            url: req.originalUrl,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            userId: req.user?.userId,
            correlationId: req.headers["x-correlation-id"] as string,
        }
    );

    // Log response when finished
    res.on("finish", () => {
        const responseTime = req.startTime ? Date.now() - req.startTime : 0;

        logger.http(`${req.method} ${req.originalUrl}`, {
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers["user-agent"],
            userId: req.user?.userId,
            correlationId: req.headers["x-correlation-id"] as string,
        });

        // Log slow requests
        if (responseTime > 5000) {
            logger.warn(`Slow request detected`, LogCategory.API, {
                requestId: req.requestId,
                method: req.method,
                url: req.originalUrl,
                responseTime,
                statusCode: res.statusCode,
                userId: req.user?.userId,
            });
        }
    });

    next();
};
