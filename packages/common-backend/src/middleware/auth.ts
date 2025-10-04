// packages/common-backend/src/middlewares/auth.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CustomError } from "../utils/index";

interface JWTPayload {
    name?: string;
    userId: string;
    email: string;
    role: string;
    iat: number;
    exp: number;
}

declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token =
            req.cookies?.accessToken ||
            req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new CustomError(401, "Access denied. No token provided.");
        }

        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            throw new CustomError(500, "JWT secret not configured");
        }

        const decoded = jwt.verify(token, jwtSecret) as JWTPayload;
        req.user = decoded;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            throw new CustomError(401, "Invalid token");
        }
        if (error instanceof jwt.TokenExpiredError) {
            throw new CustomError(401, "Token expired");
        }
        next(error);
    }
};

export const authorize = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            throw new CustomError(401, "Authentication required");
        }

        if (!roles.includes(req.user.role)) {
            throw new CustomError(
                403,
                "Access denied. Insufficient permissions."
            );
        }

        next();
    };
};
