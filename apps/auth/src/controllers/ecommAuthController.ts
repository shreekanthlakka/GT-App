import { LogCategory, logger } from "@repo/common-backend/logger";
import {
    CustomError,
    CustomResponse,
    asyncHandler,
    comparePassword,
    generateVerificationToken,
    hashPassword,
    generateEventId,
} from "@repo/common-backend/utils";

import { prisma } from "@repo/db/prisma";
import {
    EcommerceUserCreatedPublisher,
    EcommerceUserLoggedInPublisher,
    EcommerceUserLoggedOutPublisher,
    EcommerceUserLoginFailedPublisher,
} from "../events/publishers/ecommAuthPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import {
    createEcommerceUserSession,
    extractDeviceInfo,
} from "../helpers/authHelpers";
import {
    CreateEcommerceUserType,
    EcommerceLoginType,
} from "@repo/common/ecommSchemas";
import { generateJWT, verifyJWT } from "../utils/jwt";
import { SendEmailRequestPublisher } from "@repo/common-backend/publisher";
import { Prisma } from "@repo/db";

// ========================================
// REGISTER
// ========================================

export const register = asyncHandler(async (req, res) => {
    const validatedData: CreateEcommerceUserType = req.body;

    logger.info("Ecommerce user registration attempt", LogCategory.AUTH, {
        email: validatedData.email,
        signupSource: validatedData.signupSource,
        ipAddress: req.ip,
    });

    // Check if user already exists
    const existingUser = await prisma.ecommerceUser.findUnique({
        where: { email: validatedData.email },
    });

    if (existingUser) {
        logger.warn(
            "Registration failed - email already exists",
            LogCategory.AUTH,
            {
                email: validatedData.email,
                ipAddress: req.ip,
            }
        );
        throw new CustomError(409, "User with this email already exists");
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Generate referral code
    const referralCode = `${validatedData.name.substring(0, 3).toUpperCase()}${Date.now().toString().slice(-6)}`;

    // Create user with transaction
    const result = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            // Generate email verification token (6-digit OTP)
            const emailVerificationToken = Math.floor(
                100000 + Math.random() * 900000
            ).toString();

            const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

            const user = await tx.ecommerceUser.create({
                data: {
                    email: validatedData.email,
                    name: validatedData.name,
                    phone: validatedData.phone,
                    password: hashedPassword,
                    dateOfBirth: validatedData.dateOfBirth
                        ? new Date(validatedData.dateOfBirth)
                        : undefined,
                    gender: validatedData.gender,
                    referralCode,
                    referredBy: validatedData.referralCode,
                    signupSource: validatedData.signupSource,
                    emailVerificationToken,
                    passwordResetExpiry: tokenExpiry, // Using this field for email verification expiry
                    preferences:
                        validatedData.preferences ||
                        ({
                            newsletter: true,
                            sms: true,
                            whatsapp: true,
                            language: "en",
                            currency: "INR",
                        } as any),
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    phone: true,
                    emailVerified: true,
                    phoneVerified: true,
                    signupSource: true,
                    referralCode: true,
                    preferences: true,
                    createdAt: true,
                },
            });

            return { user, emailVerificationToken };
        }
    );

    const { user, emailVerificationToken } = result;

    // Send verification email using event system
    let welcomeEmailSent = false;
    try {
        // Create and publish email verification event
        const emailVerificationPublisher = new SendEmailRequestPublisher(
            kafkaWrapper.producer
        );

        await emailVerificationPublisher.publish({
            eventId: generateEventId(),
            recipientType: "USER",
            recipientId: user.id,
            recipient: {
                email: user.email,
                name: user.name,
                phone: user.phone || undefined,
            },
            email: {
                subject: "Verify Your Email Address",
                templateName: "email_verification", // Email template name
                templateData: {
                    userName: user.name,
                    verificationToken: emailVerificationToken,
                    verificationLink: `${process.env.FRONTEND_URL}/verify-email?token=${emailVerificationToken}&email=${encodeURIComponent(user.email)}`,
                    expiryTime: "24 hours",
                    supportEmail:
                        process.env.SUPPORT_EMAIL || "support@yourstore.com",
                },
            },
            metadata: {
                sourceService: "ecommerce-auth-service",
                sourceEntity: "EcommerceUser",
                sourceEntityId: user.id,
                priority: "HIGH",
            },
            userId: user.id, // For ecommerce users, using their own ID
            timestamp: new Date().toISOString(),
        });

        welcomeEmailSent = true;

        logger.info(
            "Email verification event published successfully",
            LogCategory.NOTIFICATION,
            {
                userId: user.id,
                email: user.email,
                eventId: generateEventId(),
            }
        );
    } catch (error) {
        logger.error(
            "Failed to publish email verification event",
            undefined,
            LogCategory.NOTIFICATION,
            {
                userId: user.id,
                email: user.email,
                error: error instanceof Error ? error.message : "Unknown error",
            }
        );
        // Continue with registration even if email sending fails
        welcomeEmailSent = false;
    }

    // Log successful registration
    logger.logAuth("Ecommerce User Registered", user.id, {
        email: user.email,
        name: user.name,
        signupSource: user.signupSource,
        ipAddress: req.ip,
    });

    // Audit log
    logger.audit(
        "CREATE",
        "EcommerceUser",
        user.id,
        user.id,
        null,
        {
            email: user.email,
            name: user.name,
            signupSource: user.signupSource,
        },
        {
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        }
    );

    // Publish user created event
    const userCreatedPublisher = new EcommerceUserCreatedPublisher(
        kafkaWrapper.producer
    );
    await userCreatedPublisher.publish({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || undefined,
        emailVerified: user.emailVerified,
        phoneVerified: user.phoneVerified,
        signupSource: user.signupSource as any,
        referralCode: user.referralCode || undefined,
        preferences: user.preferences as any,
        deviceInfo: extractDeviceInfo(req),
        ipAddress: req.ip,
        createdAt: user.createdAt.toISOString(),
        welcomeEmailSent,
        onboardingStarted: false,
    });

    logger.info("Ecommerce user registration successful", LogCategory.AUTH, {
        userId: user.id,
        email: user.email,
    });

    const response = new CustomResponse(
        201,
        welcomeEmailSent
            ? "Registration successful. Please check your email for verification code."
            : "Registration successful. Please contact support for email verification.",
        {
            user: {
                ...user,
                needsEmailVerification: true,
            },
        }
    );

    res.status(response.statusCode).json(response);
});

// =========================================================================================
//               ######################     LOGIN      ###############################
// =========================================================================================

export const login = asyncHandler(async (req, res) => {
    const validatedData: EcommerceLoginType = req.body;

    logger.info("Ecommerce user login attempt", LogCategory.AUTH, {
        email: validatedData.email,
        ipAddress: req.ip,
        deviceType: validatedData.deviceInfo?.type,
    });

    // Find user
    const user = await prisma.ecommerceUser.findUnique({
        where: { email: validatedData.email },
        select: {
            id: true,
            email: true,
            name: true,
            password: true,
            isActive: true,
            isBlocked: true,
            emailVerified: true,
            phoneVerified: true,
            lastLoginAt: true,
            lastLoginIP: true,
        },
    });

    if (!user) {
        // Publish login failed event
        const loginFailedPublisher = new EcommerceUserLoginFailedPublisher(
            kafkaWrapper.producer
        );
        await loginFailedPublisher.publish({
            email: validatedData.email,
            failureReason: "ACCOUNT_NOT_FOUND",
            attemptNumber: 1,
            maxAttemptsAllowed: 5,
            attemptsRemaining: 4,
            ipAddress: req.ip,
            suspiciousActivity: false,
            failedAt: new Date().toISOString(),
        });

        logger.warn("Login failed - user not found", LogCategory.AUTH, {
            email: validatedData.email,
            ipAddress: req.ip,
        });
        throw new CustomError(401, "Invalid email or password");
    }

    // Check if user is blocked
    if (user.isBlocked) {
        const loginFailedPublisher = new EcommerceUserLoginFailedPublisher(
            kafkaWrapper.producer
        );
        await loginFailedPublisher.publish({
            email: validatedData.email,
            failureReason: "ACCOUNT_BLOCKED",
            attemptNumber: 1,
            maxAttemptsAllowed: 5,
            attemptsRemaining: 0,
            ipAddress: req.ip,
            suspiciousActivity: true,
            failedAt: new Date().toISOString(),
        });

        logger.warn("Login failed - account blocked", LogCategory.AUTH, {
            userId: user.id,
            email: user.email,
            ipAddress: req.ip,
        });
        throw new CustomError(
            403,
            "Account is blocked. Please contact support."
        );
    }

    // Check if user is active
    if (!user.isActive) {
        const loginFailedPublisher = new EcommerceUserLoginFailedPublisher(
            kafkaWrapper.producer
        );
        await loginFailedPublisher.publish({
            email: validatedData.email,
            failureReason: "ACCOUNT_INACTIVE",
            attemptNumber: 1,
            maxAttemptsAllowed: 5,
            attemptsRemaining: 4,
            failedAt: new Date().toISOString(),
        });

        logger.warn("Login failed - account inactive", LogCategory.AUTH, {
            userId: user.id,
            email: user.email,
            ipAddress: req.ip,
        });
        throw new CustomError(
            403,
            "Account is inactive. Please contact support."
        );
    }

    // Verify password
    const isPasswordValid = await comparePassword(
        validatedData.password,
        user.password!
    );

    if (!isPasswordValid) {
        const loginFailedPublisher = new EcommerceUserLoginFailedPublisher(
            kafkaWrapper.producer
        );
        await loginFailedPublisher.publish({
            email: validatedData.email,
            failureReason: "INVALID_CREDENTIALS",
            attemptNumber: 1,
            maxAttemptsAllowed: 5,
            attemptsRemaining: 4,
            ipAddress: req.ip,
            suspiciousActivity: false,
            failedAt: new Date().toISOString(),
        });

        logger.warn("Login failed - invalid password", LogCategory.AUTH, {
            userId: user.id,
            email: user.email,
            ipAddress: req.ip,
        });
        throw new CustomError(401, "Invalid email or password");
    }

    // Create session
    const session = await createEcommerceUserSession(
        user.id,
        req,
        validatedData.rememberMe
    );

    // Generate JWT tokens
    const accessToken = generateJWT(
        {
            userId: user.id,
            email: user.email,
            type: "ecommerce",
            sessionId: session.id,
        },
        "1h"
    );

    const refreshToken = generateJWT(
        {
            userId: user.id,
            sessionId: session.id,
            type: "ecommerce",
            email: user.email,
        },
        validatedData.rememberMe ? "30d" : "7d"
    );

    // Update last login info
    await prisma.ecommerceUser.update({
        where: { id: user.id },
        data: {
            lastLoginAt: new Date(),
            lastLoginIP: req.ip,
        },
    });

    // Get cart and wishlist counts
    const [cartCount, wishlistCount] = await Promise.all([
        prisma.cartItem.count({ where: { ecommerceUserId: user.id } }),
        prisma.wishlistItem.count({ where: { ecommerceUserId: user.id } }),
    ]);

    logger.logAuth("Ecommerce User Logged In", user.id, {
        email: user.email,
        name: user.name,
        sessionId: session.id,
        ipAddress: req.ip,
    });

    // Publish login event
    const loginPublisher = new EcommerceUserLoggedInPublisher(
        kafkaWrapper.producer
    );
    await loginPublisher.publish({
        email: user.email,
        name: user.name,
        loginMethod: "EMAIL_PASSWORD",
        sessionId: session.id,
        rememberMe: validatedData.rememberMe,
        deviceInfo: validatedData.deviceInfo || extractDeviceInfo(req),
        ipAddress: req.ip,
        isSuspiciousLogin: false,
        newDevice: true, // Simplified logic
        newLocation: user.lastLoginIP !== req.ip,
        lastLoginAt: user.lastLoginAt?.toISOString(),
        loginAt: new Date().toISOString(),
        cartItemsCount: cartCount,
        wishlistItemsCount: wishlistCount,
        ecommerceUserId: user.id,
    });

    logger.info("Ecommerce user login successful", LogCategory.AUTH, {
        userId: user.id,
        email: user.email,
        sessionId: session.id,
    });

    const response = new CustomResponse(200, "Login successful", {
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            emailVerified: user.emailVerified,
            phoneVerified: user.phoneVerified,
        },
        tokens: {
            accessToken,
            refreshToken,
        },
        session: {
            id: session.id,
            expiresAt: session.expiresAt.toISOString(),
        },
        counts: {
            cart: cartCount,
            wishlist: wishlistCount,
        },
    });

    // Set HTTP-only cookie for refresh token
    res.status(response.statusCode)
        .cookie("ecom_refresh_token", refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: validatedData.rememberMe
                ? 30 * 24 * 60 * 60 * 1000
                : 7 * 24 * 60 * 60 * 1000,
        })
        .json(response);
});

// ========================================
// Logout
// ========================================

export const logout = asyncHandler(async (req, res) => {
    const sessionId = req.user!.sessionId; // Assuming middleware sets this
    const userId = req.user!.userId; // Assuming middleware sets this

    if (sessionId) {
        // Get session info for analytics
        const session = await prisma.ecommerceUserSession.findUnique({
            where: { id: sessionId },
        });

        if (session) {
            // Deactivate session
            await prisma.ecommerceUserSession.update({
                where: { id: sessionId },
                data: { isActive: false },
            });

            // Get session analytics
            const sessionDuration = Math.floor(
                (new Date().getTime() - session.createdAt.getTime()) /
                    (1000 * 60)
            );

            // Publish logout event
            const logoutPublisher = new EcommerceUserLoggedOutPublisher(
                kafkaWrapper.producer
            );
            await logoutPublisher.publish({
                ecommerceUserId: userId!,
                sessionId,
                logoutMethod: "USER_ACTION",
                sessionDuration,
                deviceType: (session.deviceInfo as any)?.type || "desktop",
                loggedOutAt: new Date().toISOString(),
                cartSaved: true,
            });

            logger.logAuth("Ecommerce User Logged Out", userId!, {
                sessionId,
                sessionDuration,
                ipAddress: req.ip,
            });
        }
    }

    // Clear refresh token cookie
    res.clearCookie("ecom_refresh_token");

    const response = new CustomResponse(200, "Logout successful");
    res.status(response.statusCode).json(response);
});

// ========================================
// REFRESH TOKEN
// ========================================

export const refreshToken = asyncHandler(async (req, res) => {
    const refreshToken =
        req.cookies.ecom_refresh_token || req.body.refreshToken;

    if (!refreshToken) {
        throw new CustomError(401, "Refresh token not provided");
    }

    try {
        const decoded = verifyJWT(refreshToken) as any;

        if (decoded.type !== "ecommerce") {
            throw new CustomError(401, "Invalid token type");
        }

        // Verify session exists and is active
        const session = await prisma.ecommerceUserSession.findUnique({
            where: {
                id: decoded.sessionId,
                ecommerceUserId: decoded.userId,
                isActive: true,
            },
            include: {
                ecommerceUser: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                        isActive: true,
                        isBlocked: true,
                    },
                },
            },
        });

        if (!session) {
            throw new CustomError(401, "Invalid refresh token");
        }

        if (
            session.ecommerceUser.isBlocked ||
            !session.ecommerceUser.isActive
        ) {
            throw new CustomError(403, "Account access restricted");
        }

        // Generate new access token
        const newAccessToken = generateJWT(
            {
                userId: decoded.userId,
                email: session.ecommerceUser.email,
                type: "ecommerce",
                sessionId: session.id,
            },
            "1h"
        );

        // Update session
        await prisma.ecommerceUserSession.update({
            where: { id: session.id },
            data: { updatedAt: new Date() },
        });

        logger.info("Ecommerce token refreshed", LogCategory.AUTH, {
            userId: decoded.userId,
            sessionId: session.id,
        });

        const response = new CustomResponse(200, "Token refreshed", {
            accessToken: newAccessToken,
            user: {
                id: session.ecommerceUser.id,
                email: session.ecommerceUser.email,
                name: session.ecommerceUser.name,
            },
        });

        res.status(response.statusCode).json(response);
    } catch (error) {
        logger.warn("Refresh token verification failed", LogCategory.AUTH, {
            error: error instanceof Error ? error.message : "Unknown error",
            ipAddress: req.ip,
        });
        throw new CustomError(401, "Invalid refresh token");
    }
});
