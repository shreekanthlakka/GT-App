import jwt from "jsonwebtoken";
import { prisma } from "@repo/db/prisma";
import { Request, Response } from "express";
import { generateVerificationToken } from "@repo/common-backend/utils";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { EcommerceUserSessionCreatedPublisher } from "../events/publishers/ecommAuthPublishers";
import type { EcommerceUserSession } from "@repo/db";

const generateTokens = async (
    user: any
): Promise<{
    accessToken: string;
    refreshToken: string;
}> => {
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
    };

    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
        throw new Error("JWT secrets not configured");
    }

    const accessToken = jwt.sign(payload, jwtSecret, { expiresIn: "15m" });
    const refreshToken = jwt.sign(payload, jwtRefreshSecret, {
        expiresIn: "7d",
    });

    return { accessToken, refreshToken };
};

const createSession = async (
    userId: string,
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
): Promise<void> => {
    // ✅ Direct use of shared prisma
    const sessionToken = jwt.sign({ userId }, process.env.JWT_SECRET!, {
        expiresIn: "7d",
    });

    await prisma.userSession.create({
        data: {
            userId,
            sessionToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            ipAddress,
            userAgent,
            deviceInfo: userAgent ? { userAgent } : undefined,
        },
    });
};

const handleFailedLogin = async (userId: string): Promise<void> => {
    // ✅ Direct use of shared prisma
    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) return;

    const failedAttempts = user.failedLoginAttempts + 1;
    const updateData: any = { failedLoginAttempts: failedAttempts };

    if (failedAttempts >= 5) {
        updateData.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }

    await prisma.user.update({
        where: { id: userId },
        data: updateData,
    });
};

const extractDeviceInfo = (req: Request) => {
    const userAgent = req.headers["user-agent"] || "";
    const deviceInfo = {
        type: "desktop" as "mobile" | "desktop" | "tablet",
        userAgent,
        os: undefined as string | undefined,
        browser: undefined as string | undefined,
    };

    // Simple device detection
    if (/mobile/i.test(userAgent)) deviceInfo.type = "mobile";
    else if (/tablet/i.test(userAgent)) deviceInfo.type = "tablet";

    return deviceInfo;
};

// Helper to create session
const createEcommerceUserSession = async (
    ecommerceUserId: string,
    req: Request,
    rememberMe: boolean = false
): Promise<EcommerceUserSession> => {
    const deviceInfo = extractDeviceInfo(req);
    const sessionDuration = rememberMe ? 30 * 24 : 24; // 30 days or 1 day
    const expiresAt = new Date(Date.now() + sessionDuration * 60 * 60 * 1000);

    const session = await prisma.ecommerceUserSession.create({
        data: {
            ecommerceUserId,
            sessionToken: generateVerificationToken(),
            refreshToken: generateVerificationToken(),
            expiresAt,
            deviceInfo: deviceInfo as any,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        },
    });

    // Publish session created event
    const sessionPublisher = new EcommerceUserSessionCreatedPublisher(
        kafkaWrapper.producer
    );
    await sessionPublisher.publish({
        ecommerceUserId,
        sessionId: session.id,
        sessionToken: session.sessionToken, // Masked in actual implementation
        createdAt: session.createdAt.toISOString(),
        expiresAt: session.expiresAt.toISOString(),
        deviceInfo,
        ipAddress: req.ip || "",
        rememberMe,
        sessionDuration,
        isSecure: req.secure,
        activeSessions: await prisma.ecommerceUserSession.count({
            where: { ecommerceUserId, isActive: true },
        }),
    });

    return session;
};

export {
    generateTokens,
    createSession,
    handleFailedLogin,
    extractDeviceInfo,
    createEcommerceUserSession,
};
