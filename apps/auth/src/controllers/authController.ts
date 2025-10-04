import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    comparePassword,
    CustomError,
    CustomResponse,
    hashPassword,
} from "@repo/common-backend/utils";
import jwt from "jsonwebtoken";
import {
    ChangePasswordSchema,
    ChangePasswordType,
    LoginSchema,
    LoginType,
    RegisterSchema,
    RegisterType,
    UpdateProfileSchema,
    UpdateProfileType,
} from "@repo/common/schemas";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { generateTokens } from "../helpers/authHelpers";
import {
    UserCreatedPublisher,
    UserLoggedInPublisher,
} from "../events/publishers/authPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";

export const register = asyncHandler(async (req, res) => {
    const validatedData: RegisterType = RegisterSchema.parse(req.body);

    logger.info("User registration attempt", LogCategory.AUTH, {
        email: validatedData.email,
        role: validatedData.role,
        ipAddress: req.ip,
    });

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
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

    // Create user
    const user = await prisma.user.create({
        data: {
            email: validatedData.email,
            name: validatedData.name,
            phone: validatedData.phone,
            password: hashedPassword,
            role: validatedData.role,
        },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
        },
    });

    logger.logAuth("User Registered", user.id, {
        email: user.email,
        name: user.name,
        role: user.role,
        ipAddress: req.ip,
    });

    // Audit log
    logger.audit(
        "CREATE",
        "User",
        user.id,
        user.id,
        null,
        {
            email: user.email,
            name: user.name,
            role: user.role,
        },
        {
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        }
    );

    // Publish user created event
    const userCreatedPublisher = new UserCreatedPublisher(
        kafkaWrapper.producer
    );
    await userCreatedPublisher.publish({
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone || undefined,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt.toISOString(),
    });

    logger.info("User registration successful", LogCategory.AUTH, {
        userId: user.id,
        email: user.email,
    });

    const response = new CustomResponse(
        201,
        "User registered successfully. Please login.",
        {
            user,
        }
    );

    res.status(response.statusCode).json(response);
});

export const login = asyncHandler(async (req, res) => {
    const validatedData: LoginType = LoginSchema.parse(req.body);

    logger.info("User login attempt", LogCategory.AUTH, {
        email: validatedData.email,
        ipAddress: req.ip,
    });

    // Find user
    const user = await prisma.user.findUnique({
        where: { email: validatedData.email },
    });

    if (!user) {
        logger.warn("Login failed - user not found", LogCategory.AUTH, {
            email: validatedData.email,
            ipAddress: req.ip,
        });
        throw new CustomError(401, "Invalid email or password");
    }

    // Check if user is active
    if (!user.isActive) {
        logger.warn("Login failed - user inactive", LogCategory.AUTH, {
            email: validatedData.email,
            userId: user.id,
            ipAddress: req.ip,
        });
        throw new CustomError(401, "Account is deactivated");
    }

    // Check password
    const isPasswordValid = await comparePassword(
        validatedData.password,
        user.password
    );

    if (!isPasswordValid) {
        // Increment failed login attempts
        await prisma.user.update({
            where: { id: user.id },
            data: {
                failedLoginAttempts: { increment: 1 },
                lastLoginIP: req.ip,
            },
        });

        logger.warn("Login failed - invalid password", LogCategory.AUTH, {
            email: validatedData.email,
            userId: user.id,
            ipAddress: req.ip,
        });
        throw new CustomError(401, "Invalid email or password");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await generateTokens(user);

    // Create session
    const session = await prisma.userSession.create({
        data: {
            userId: user.id,
            sessionToken: accessToken,
            refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
            deviceInfo: req.headers["user-agent"]
                ? { userAgent: req.headers["user-agent"] as string }
                : undefined,
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        },
    });

    // Update user login info
    await prisma.user.update({
        where: { id: user.id },
        data: {
            lastLoginAt: new Date(),
            lastLoginIP: req.ip,
            failedLoginAttempts: 0, // Reset failed attempts
        },
    });

    logger.logAuth("User Logged In", user.id, {
        email: user.email,
        sessionId: session.id,
        ipAddress: req.ip,
    });

    // Publish user logged in event
    const userLoggedInPublisher = new UserLoggedInPublisher(
        kafkaWrapper.producer
    );
    await userLoggedInPublisher.publish({
        userId: user.id,
        email: user.email,
        sessionId: session.id,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        loginAt: new Date().toISOString(),
    });

    res.status(200)
        .cookie("accessToken", accessToken, {
            httpOnly: true,
            maxAge: 15 * 60 * 1000,
            secure: true,
        })
        .json(
            new CustomResponse(200, "Login successful", {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    role: user.role,
                    isActive: user.isActive,
                },
                accessToken,
                refreshToken,
                expiresIn: process.env.JWT_EXPIRES_IN || "15m",
            })
        );
});

export const logout = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace("Bearer ", "");

    if (userId && token) {
        // Deactivate session
        await prisma.userSession.updateMany({
            where: {
                userId,
                sessionToken: token,
                isActive: true,
            },
            data: {
                isActive: false,
            },
        });

        logger.logAuth("User Logged Out", userId, {
            ipAddress: req.ip,
        });
    }
    const options: {
        httpOnly: boolean;
        maxAge: number;
        secure: boolean;
    } = {
        httpOnly: true,
        maxAge: 0,
        secure: true,
    };
    res.status(200)
        .clearCookie("accessToken", options)
        .json(new CustomResponse(200, "Logout sucessfull"));
});

export const getProfile = asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
        },
    });

    if (!user) {
        throw new CustomError(404, "User not found");
    }

    const response = new CustomResponse(200, "Profile retrieved successfully", {
        user,
    });
    res.status(response.statusCode).json(response);
});

export const updateProfile = asyncHandler(async (req, res) => {
    const validatedData: UpdateProfileType = UpdateProfileSchema.parse(
        req.body
    );
    const userId = req.user!.userId;

    const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: validatedData,
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            role: true,
            isActive: true,
            updatedAt: true,
        },
    });

    logger.logAuth("Profile Updated", userId, {
        changes: validatedData,
        ipAddress: req.ip,
    });

    const response = new CustomResponse(200, "Profile updated successfully", {
        user: updatedUser,
    });
    res.status(response.statusCode).json(response);
});

export const changePassword = asyncHandler(async (req, res) => {
    const validatedData: ChangePasswordType = ChangePasswordSchema.parse(
        req.body
    );
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
        where: { id: userId },
    });

    if (!user) {
        throw new CustomError(404, "User not found");
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(
        validatedData.currentPassword,
        user.password
    );

    if (!isCurrentPasswordValid) {
        throw new CustomError(400, "Current password is incorrect");
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(validatedData.newPassword);

    // Update password
    await prisma.user.update({
        where: { id: userId },
        data: { password: hashedNewPassword },
    });

    logger.logAuth("Password Changed", userId, {
        ipAddress: req.ip,
    });

    const response = new CustomResponse(200, "Password changed successfully");
    res.status(response.statusCode).json(response);
});
