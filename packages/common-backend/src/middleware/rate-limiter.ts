// packages/common-backend/src/middlewares/rate-limit.ts
import rateLimit from "express-rate-limit";

// General rate limit
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        error: "Too many requests from this IP, please try again later.",
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limit for authentication endpoints
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: {
        error: "Too many authentication attempts, please try again later.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// API rate limit
export const apiLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 requests per minute
    message: {
        error: "API rate limit exceeded, please slow down.",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
