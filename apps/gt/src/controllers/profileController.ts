// apps/ecommerce/src/controllers/profileController.ts
import { Request, Response } from "express";
import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import {
    EcommerceUserProfileUpdatedPublisher,
    EcommerceUserPreferencesUpdatedPublisher,
} from "../events/publishers/profilePublisher";
import { kafkaWrapper } from "@repo/common-backend/kafka";

/**
 * Get user profile
 * GET /api/ecommerce/profile
 */
export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const ecommerceUserId = req.user?.userId;

    const user = await prisma.ecommerceUser.findUnique({
        where: { id: ecommerceUserId },
        select: {
            id: true,
            email: true,
            name: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            avatar: true,
            emailVerified: true,
            phoneVerified: true,
            preferences: true,
            signupSource: true,
            lastLoginAt: true,
            createdAt: true,
        },
    });

    if (!user) {
        throw new CustomError(404, "User not found");
    }

    const response = new CustomResponse(
        200,
        "Profile retrieved successfully",
        user
    );
    res.status(response.statusCode).json(response);
});

/**
 * Update user profile
 * PUT /api/ecommerce/profile
 */
export const updateProfile = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { name, phone, dateOfBirth, gender, avatar } = req.body;

        const user = await prisma.ecommerceUser.findUnique({
            where: { id: ecommerceUserId },
        });

        if (!user) {
            throw new CustomError(404, "User not found");
        }

        const updatedUser = await prisma.ecommerceUser.update({
            where: { id: ecommerceUserId },
            data: {
                name,
                phone,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
                gender,
                avatar,
            },
            select: {
                id: true,
                email: true,
                name: true,
                phone: true,
                dateOfBirth: true,
                gender: true,
                avatar: true,
                emailVerified: true,
                phoneVerified: true,
                preferences: true,
            },
        });

        // Publish profile updated event
        const publisher = new EcommerceUserProfileUpdatedPublisher(
            kafkaWrapper.producer
        );

        await publisher.publish({
            ecommerceUserId: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            phone: updatedUser.phone || undefined,
            updatedAt: new Date().toISOString(),
            updatedFields: Object.keys(req.body),
        });

        logger.info("Profile updated", LogCategory.ECOMMERCE, {
            ecommerceUserId: updatedUser.id,
        });

        const response = new CustomResponse(
            200,
            "Profile updated successfully",
            updatedUser
        );
        res.status(response.statusCode).json(response);
    }
);

/**
 * Update user preferences
 * PUT /api/ecommerce/profile/preferences
 */
export const updatePreferences = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const preferences = req.body;

        const updatedUser = await prisma.ecommerceUser.update({
            where: { id: ecommerceUserId },
            data: {
                preferences,
            },
            select: {
                id: true,
                email: true,
                preferences: true,
            },
        });

        // Publish preferences updated event
        const publisher = new EcommerceUserPreferencesUpdatedPublisher(
            kafkaWrapper.producer
        );

        await publisher.publish({
            ecommerceUserId: updatedUser.id,
            email: updatedUser.email,
            preferences,
            updatedAt: new Date().toISOString(),
        });

        logger.info("Preferences updated", LogCategory.ECOMMERCE, {
            ecommerceUserId: updatedUser.id,
        });

        const response = new CustomResponse(
            200,
            "Preferences updated successfully",
            updatedUser
        );
        res.status(response.statusCode).json(response);
    }
);

/**
 * Soft delete user account
 * DELETE /api/ecommerce/profile
 */
export const deleteAccount = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;

        await prisma.ecommerceUser.update({
            where: { id: ecommerceUserId },
            data: {
                isActive: false,
            },
        });

        logger.info("Account deactivated", LogCategory.ECOMMERCE, {
            ecommerceUserId,
        });

        const response = new CustomResponse(
            200,
            "Account deactivated successfully",
            null
        );
        res.status(response.statusCode).json(response);
    }
);
