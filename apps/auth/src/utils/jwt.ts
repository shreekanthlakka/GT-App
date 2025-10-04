import jwt from "jsonwebtoken";
import { logger, LogCategory } from "@repo/common-backend/logger";

// JWT Configuration
interface JWTConfig {
    accessTokenSecret: string;
    refreshTokenSecret: string;
    accessTokenExpiry: string;
    refreshTokenExpiry: string;
    issuer: string;
    audience: string;
}

const config: JWTConfig = {
    accessTokenSecret:
        process.env.JWT_ACCESS_SECRET || "your-super-secret-access-key",
    refreshTokenSecret:
        process.env.JWT_REFRESH_SECRET || "your-super-secret-refresh-key",
    accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || "1h",
    refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || "30d",
    issuer: process.env.JWT_ISSUER || "yourtextilestore.com",
    audience: process.env.JWT_AUDIENCE || "yourtextilestore.com",
};

// JWT Payload interfaces
export interface AccessTokenPayload {
    userId: string;
    email: string;
    type: "internal" | "ecommerce";
    sessionId?: string;
    role?: string; // For internal users
    permissions?: string[]; // For internal users
}

export interface RefreshTokenPayload {
    userId: string;
    sessionId: string;
    type: "internal" | "ecommerce";
    tokenVersion?: number; // For token invalidation
}

// JWT Options
interface JWTOptions {
    expiresIn?: string;
    issuer?: string;
    audience?: string;
    subject?: string;
    notBefore?: string;
    jwtid?: string;
}

/**
 * Generate a JWT access token
 * @param payload - Token payload
 * @param expiresIn - Expiration time (default: 1h)
 * @param options - Additional JWT options
 * @returns JWT token string
 */
export const generateJWT = (
    payload: AccessTokenPayload,
    expiresIn: string = config.accessTokenExpiry,
    options: Partial<JWTOptions> = {}
): string => {
    try {
        const jwtOptions: jwt.SignOptions = {
            expiresIn,
            issuer: options.issuer || config.issuer,
            audience: options.audience || config.audience,
            subject: payload.userId,
            algorithm: "HS256",
            ...options,
        };

        const token = jwt.sign(payload, config.accessTokenSecret, jwtOptions);

        logger.info("JWT token generated", LogCategory.AUTH, {
            userId: payload.userId,
            type: payload.type,
            expiresIn,
            sessionId: payload.sessionId,
        });

        return token;
    } catch (error) {
        logger.error("JWT generation failed", undefined, LogCategory.AUTH, {
            userId: payload.userId,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw new Error("Token generation failed");
    }
};

/**
 * Generate a JWT refresh token
 * @param payload - Refresh token payload
 * @param expiresIn - Expiration time (default: 30d)
 * @returns JWT refresh token string
 */
export const generateRefreshToken = (
    payload: RefreshTokenPayload,
    expiresIn: string = config.refreshTokenExpiry
): string => {
    try {
        const jwtOptions: jwt.SignOptions = {
            expiresIn,
            issuer: config.issuer,
            audience: config.audience,
            subject: payload.userId,
            algorithm: "HS256",
        };

        const token = jwt.sign(payload, config.refreshTokenSecret, jwtOptions);

        logger.info("Refresh token generated", LogCategory.AUTH, {
            userId: payload.userId,
            type: payload.type,
            sessionId: payload.sessionId,
            expiresIn,
        });

        return token;
    } catch (error) {
        logger.error(
            "Refresh token generation failed",
            undefined,
            LogCategory.AUTH,
            {
                userId: payload.userId,
                error: error instanceof Error ? error.message : "Unknown error",
            }
        );
        throw new Error("Refresh token generation failed");
    }
};

/**
 * Verify and decode a JWT token
 * @param token - JWT token to verify
 * @param isRefreshToken - Whether this is a refresh token (default: false)
 * @returns Decoded token payload
 */
export const verifyJWT = (
    token: string,
    isRefreshToken: boolean = false
): AccessTokenPayload | RefreshTokenPayload => {
    try {
        const secret = isRefreshToken
            ? config.refreshTokenSecret
            : config.accessTokenSecret;

        const jwtOptions: jwt.VerifyOptions = {
            issuer: config.issuer,
            audience: config.audience,
            algorithms: ["HS256"],
        };

        const decoded = jwt.verify(token, secret, jwtOptions) as any;

        logger.info("JWT token verified successfully", LogCategory.AUTH, {
            userId: decoded.userId,
            type: decoded.type,
            isRefreshToken,
            sessionId: decoded.sessionId,
        });

        return decoded;
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            logger.warn("JWT token expired", LogCategory.AUTH, {
                isRefreshToken,
                expiredAt: error.expiredAt,
            });
            throw new Error("Token expired");
        }

        if (error instanceof jwt.JsonWebTokenError) {
            logger.warn("Invalid JWT token", LogCategory.AUTH, {
                isRefreshToken,
                error: error.message,
            });
            throw new Error("Invalid token");
        }

        if (error instanceof jwt.NotBeforeError) {
            logger.warn("JWT token not active yet", LogCategory.AUTH, {
                isRefreshToken,
                date: error.date,
            });
            throw new Error("Token not active");
        }

        logger.error("JWT verification failed", undefined, LogCategory.AUTH, {
            isRefreshToken,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        throw new Error("Token verification failed");
    }
};

/**
 * Decode JWT without verification (for inspection)
 * @param token - JWT token to decode
 * @returns Decoded token payload or null
 */
export const decodeJWT = (token: string): any | null => {
    try {
        return jwt.decode(token);
    } catch (error) {
        logger.error("JWT decode failed", undefined, LogCategory.AUTH, {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        return null;
    }
};

/**
 * Get token expiration date
 * @param token - JWT token
 * @returns Expiration date or null
 */
export const getTokenExpiration = (token: string): Date | null => {
    try {
        const decoded = jwt.decode(token) as any;
        if (decoded?.exp) {
            return new Date(decoded.exp * 1000);
        }
        return null;
    } catch (error) {
        return null;
    }
};

/**
 * Check if token is expired
 * @param token - JWT token
 * @returns True if expired
 */
export const isTokenExpired = (token: string): boolean => {
    const expiration = getTokenExpiration(token);
    if (!expiration) return true;
    return expiration < new Date();
};

/**
 * Get time until token expires
 * @param token - JWT token
 * @returns Milliseconds until expiration, or null if invalid
 */
export const getTimeUntilExpiry = (token: string): number | null => {
    const expiration = getTokenExpiration(token);
    if (!expiration) return null;
    return expiration.getTime() - Date.now();
};

/**
 * Extract user ID from token without verification
 * @param token - JWT token
 * @returns User ID or null
 */
export const extractUserIdFromToken = (token: string): string | null => {
    try {
        const decoded = jwt.decode(token) as any;
        return decoded?.userId || decoded?.sub || null;
    } catch (error) {
        return null;
    }
};

/**
 * Generate token pair (access + refresh)
 * @param accessPayload - Access token payload
 * @param refreshPayload - Refresh token payload
 * @returns Object with both tokens
 */
export const generateTokenPair = (
    accessPayload: AccessTokenPayload,
    refreshPayload: RefreshTokenPayload
) => {
    const accessToken = generateJWT(accessPayload);
    const refreshToken = generateRefreshToken(refreshPayload);

    return {
        accessToken,
        refreshToken,
        accessTokenExpiry: getTokenExpiration(accessToken),
        refreshTokenExpiry: getTokenExpiration(refreshToken),
    };
};

/**
 * Refresh access token using refresh token
 * @param refreshToken - Valid refresh token
 * @param newAccessPayload - New access token payload
 * @returns New access token
 */
export const refreshAccessToken = (
    refreshToken: string,
    newAccessPayload: Omit<AccessTokenPayload, "sessionId">
): string => {
    try {
        // Verify refresh token
        const refreshPayload = verifyJWT(
            refreshToken,
            true
        ) as RefreshTokenPayload;

        // Generate new access token with session from refresh token
        const accessPayload: AccessTokenPayload = {
            ...newAccessPayload,
            sessionId: refreshPayload.sessionId,
        };

        return generateJWT(accessPayload);
    } catch (error) {
        logger.error(
            "Access token refresh failed",
            undefined,
            LogCategory.AUTH,
            {
                error: error instanceof Error ? error.message : "Unknown error",
            }
        );
        throw new Error("Token refresh failed");
    }
};

/**
 * Create JWT for password reset
 * @param userId - User ID
 * @param email - User email
 * @param type - User type
 * @returns Short-lived JWT for password reset
 */
export const generatePasswordResetToken = (
    userId: string,
    email: string,
    type: "internal" | "ecommerce"
): string => {
    const payload = {
        userId,
        email,
        type,
        purpose: "password_reset",
    };

    return jwt.sign(payload, config.accessTokenSecret, {
        expiresIn: "1h", // Short expiry for security
        issuer: config.issuer,
        audience: config.audience,
        subject: userId,
        algorithm: "HS256",
    });
};

/**
 * Verify password reset token
 * @param token - Password reset token
 * @returns Decoded payload or throws error
 */
export const verifyPasswordResetToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, config.accessTokenSecret, {
            issuer: config.issuer,
            audience: config.audience,
            algorithms: ["HS256"],
        }) as any;

        if (decoded.purpose !== "password_reset") {
            throw new Error("Invalid token purpose");
        }

        return decoded;
    } catch (error) {
        logger.error(
            "Password reset token verification failed",
            undefined,
            LogCategory.AUTH,
            {
                error: error instanceof Error ? error.message : "Unknown error",
            }
        );
        throw new Error("Invalid or expired reset token");
    }
};

/**
 * Create JWT for email verification
 * @param userId - User ID
 * @param email - User email
 * @param type - User type
 * @returns JWT for email verification
 */
export const generateEmailVerificationToken = (
    userId: string,
    email: string,
    type: "internal" | "ecommerce"
): string => {
    const payload = {
        userId,
        email,
        type,
        purpose: "email_verification",
    };

    return jwt.sign(payload, config.accessTokenSecret, {
        expiresIn: "24h", // 24 hours for email verification
        issuer: config.issuer,
        audience: config.audience,
        subject: userId,
        algorithm: "HS256",
    });
};

/**
 * Verify email verification token
 * @param token - Email verification token
 * @returns Decoded payload or throws error
 */
export const verifyEmailVerificationToken = (token: string) => {
    try {
        const decoded = jwt.verify(token, config.accessTokenSecret, {
            issuer: config.issuer,
            audience: config.audience,
            algorithms: ["HS256"],
        }) as any;

        if (decoded.purpose !== "email_verification") {
            throw new Error("Invalid token purpose");
        }

        return decoded;
    } catch (error) {
        logger.error(
            "Email verification token verification failed",
            undefined,
            LogCategory.AUTH,
            {
                error: error instanceof Error ? error.message : "Unknown error",
            }
        );
        throw new Error("Invalid or expired verification token");
    }
};

/**
 * Generate API key JWT (long-lived, for API access)
 * @param userId - User ID
 * @param type - User type
 * @param permissions - API permissions
 * @param expiresIn - Expiration time (default: 1 year)
 * @returns API key JWT
 */
export const generateAPIKey = (
    userId: string,
    type: "internal" | "ecommerce",
    permissions: string[] = [],
    expiresIn: string = "1y"
): string => {
    const payload = {
        userId,
        type,
        permissions,
        purpose: "api_access",
        keyId: require("crypto").randomUUID(),
    };

    return jwt.sign(payload, config.accessTokenSecret, {
        expiresIn,
        issuer: config.issuer,
        audience: config.audience,
        subject: userId,
        algorithm: "HS256",
    });
};

/**
 * JWT configuration and constants
 */
export const JWTConfig = {
    // Default expiry times
    ACCESS_TOKEN_EXPIRY: "1h",
    REFRESH_TOKEN_EXPIRY: "30d",
    PASSWORD_RESET_EXPIRY: "1h",
    EMAIL_VERIFICATION_EXPIRY: "24h",
    API_KEY_EXPIRY: "1y",

    // Token types
    TOKEN_TYPES: {
        ACCESS: "access",
        REFRESH: "refresh",
        PASSWORD_RESET: "password_reset",
        EMAIL_VERIFICATION: "email_verification",
        API_KEY: "api_access",
    },

    // User types
    USER_TYPES: {
        INTERNAL: "internal",
        ECOMMERCE: "ecommerce",
    },
} as const;

/**
 * Utility functions for common JWT operations
 */
export const JWTUtils = {
    /**
     * Create tokens for internal user login
     */
    createInternalUserTokens: (
        userId: string,
        email: string,
        role: string,
        sessionId: string
    ) => {
        const accessPayload: AccessTokenPayload = {
            userId,
            email,
            type: "internal",
            role,
            sessionId,
        };

        const refreshPayload: RefreshTokenPayload = {
            userId,
            sessionId,
            type: "internal",
        };

        return generateTokenPair(accessPayload, refreshPayload);
    },

    /**
     * Create tokens for ecommerce user login
     */
    createEcommerceUserTokens: (
        userId: string,
        email: string,
        sessionId: string
    ) => {
        const accessPayload: AccessTokenPayload = {
            userId,
            email,
            type: "ecommerce",
            sessionId,
        };

        const refreshPayload: RefreshTokenPayload = {
            userId,
            sessionId,
            type: "ecommerce",
        };

        return generateTokenPair(accessPayload, refreshPayload);
    },

    /**
     * Validate token and return user info
     */
    validateAndExtractUserInfo: (token: string) => {
        const decoded = verifyJWT(token) as AccessTokenPayload;
        return {
            userId: decoded.userId,
            email: decoded.email,
            type: decoded.type,
            role: decoded.role,
            sessionId: decoded.sessionId,
        };
    },
};

export default {
    generateJWT,
    generateRefreshToken,
    verifyJWT,
    decodeJWT,
    getTokenExpiration,
    isTokenExpired,
    getTimeUntilExpiry,
    extractUserIdFromToken,
    generateTokenPair,
    refreshAccessToken,
    generatePasswordResetToken,
    verifyPasswordResetToken,
    generateEmailVerificationToken,
    verifyEmailVerificationToken,
    generateAPIKey,
    JWTConfig,
    JWTUtils,
};
