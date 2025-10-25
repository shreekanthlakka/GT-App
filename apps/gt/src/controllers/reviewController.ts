// ========================================
// reviewController.ts (Key parts with ecommerceUserId)
// ========================================

import { kafkaWrapper } from "@repo/common-backend/kafka";
import { LogCategory, logger } from "@repo/common-backend/logger";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import { prisma } from "@repo/db/prisma";
import { Request, Response } from "express";
import {
    ReviewCreatedPublisher,
    ReviewDeletedPublisher,
    ReviewUpdatedPublisher,
} from "../events/publishers/reviewPublisher";

export const createReview = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const {
            inventoryItemId,
            orderId,
            rating,
            title,
            comment,
            images,
            aspects,
        } = req.body;

        // Check if user has purchased this product
        let isVerified = false;
        if (orderId) {
            const order = await prisma.order.findFirst({
                where: {
                    id: orderId,
                    ecommerceUserId,
                    status: "DELIVERED",
                    items: {
                        some: { inventoryItemId },
                    },
                },
            });

            isVerified = !!order;
        }

        // Check if user already reviewed this product
        const existingReview = await prisma.review.findFirst({
            where: {
                ecommerceUserId,
                inventoryItemId,
            },
        });

        if (existingReview) {
            throw new CustomError(
                400,
                "You have already reviewed this product"
            );
        }

        const review = await prisma.review.create({
            data: {
                ecommerceUserId: ecommerceUserId!,
                inventoryItemId,
                orderId,
                rating,
                title,
                comment,
                images,
                aspects,
                isVerified,
                isApproved: false,
            },
            include: {
                ecommerceUser: {
                    select: { name: true, email: true },
                },
                inventoryItem: {
                    select: { name: true },
                },
            },
        });

        // Publish review created event
        const publisher = new ReviewCreatedPublisher(kafkaWrapper.producer);

        await publisher.publish({
            reviewId: review.id,
            ecommerceUserId: review.ecommerceUserId,
            userName: review.ecommerceUser.name,
            inventoryItemId: review.inventoryItemId,
            productName: review.inventoryItem.name,
            rating: review.rating,
            isVerified: review.isVerified,
            createdAt: new Date().toISOString(),
        });

        logger.info("Review created", LogCategory.ECOMMERCE, {
            reviewId: review.id,
            ecommerceUserId,
            inventoryItemId,
            rating,
        });

        const response = new CustomResponse(
            201,
            "Review submitted successfully. It will be visible after approval.",
            review
        );
        res.status(response.statusCode).json(response);
    }
);

export const updateReview = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { id } = req.params;
        const { rating, title, comment, images, aspects } = req.body;

        const review = await prisma.review.findFirst({
            where: { id, ecommerceUserId },
        });

        if (!review) {
            throw new CustomError(404, "Review not found");
        }

        const updatedReview = await prisma.review.update({
            where: { id },
            data: {
                rating,
                title,
                comment,
                images,
                aspects,
                isApproved: false,
            },
        });

        // Publish review updated event
        const publisher = new ReviewUpdatedPublisher(kafkaWrapper.producer);

        await publisher.publish({
            reviewId: updatedReview.id,
            ecommerceUserId: updatedReview.ecommerceUserId,
            inventoryItemId: updatedReview.inventoryItemId,
            rating: updatedReview.rating,
            updatedAt: new Date().toISOString(),
        });

        logger.info("Review updated", LogCategory.ECOMMERCE, {
            reviewId: id,
            ecommerceUserId,
        });

        const response = new CustomResponse(
            200,
            "Review updated successfully",
            updatedReview
        );
        res.status(response.statusCode).json(response);
    }
);

export const deleteReview = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { id } = req.params;

        const review = await prisma.review.findFirst({
            where: { id, ecommerceUserId },
        });

        if (!review) {
            throw new CustomError(404, "Review not found");
        }

        await prisma.review.delete({
            where: { id },
        });

        // Publish review deleted event
        const publisher = new ReviewDeletedPublisher(kafkaWrapper.producer);

        await publisher.publish({
            reviewId: id,
            ecommerceUserId: review.ecommerceUserId,
            inventoryItemId: review.inventoryItemId,
            deletedAt: new Date().toISOString(),
        });

        logger.info("Review deleted", LogCategory.ECOMMERCE, {
            reviewId: id,
            ecommerceUserId,
        });

        const response = new CustomResponse(
            200,
            "Review deleted successfully",
            null
        );
        res.status(response.statusCode).json(response);
    }
);

export const getProductReviews = asyncHandler(async (req, res) => {});

export const getUserReviews = asyncHandler(async (req, res) => {});
