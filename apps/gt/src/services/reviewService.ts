// ========================================
// apps/ecommerce/src/services/reviewService.ts (FIXED)
// ========================================
import { prisma } from "@repo/db/prisma";
import { CustomError } from "@repo/common-backend/utils";
import { Review } from "@repo/db/prisma";

export class ReviewService {
    /**
     * Get product review statistics
     */
    static async getProductReviewStats(inventoryItemId: string): Promise<{
        totalReviews: number;
        averageRating: number;
        ratingDistribution: {
            5: number;
            4: number;
            3: number;
            2: number;
            1: number;
        };
    }> {
        const [totalReviews, averageRating, ratingDistribution] =
            await Promise.all([
                prisma.review.count({
                    where: { inventoryItemId, isApproved: true },
                }),
                prisma.review.aggregate({
                    where: { inventoryItemId, isApproved: true },
                    _avg: { rating: true },
                }),
                prisma.review.groupBy({
                    by: ["rating"],
                    where: { inventoryItemId, isApproved: true },
                    _count: true,
                }),
            ]);

        const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        ratingDistribution.forEach((item) => {
            distribution[item.rating as keyof typeof distribution] =
                item._count;
        });

        return {
            totalReviews,
            averageRating: averageRating._avg.rating || 0,
            ratingDistribution: distribution,
        };
    }

    /**
     * Check if user can review product
     */
    static async canUserReviewProduct(
        ecommerceUserId: string,
        inventoryItemId: string
    ): Promise<{ canReview: boolean; reason?: string }> {
        const existingReview = await prisma.review.findFirst({
            where: { ecommerceUserId, inventoryItemId },
        });

        if (existingReview) {
            return { canReview: false, reason: "Already reviewed" };
        }

        const purchasedOrder = await prisma.order.findFirst({
            where: {
                ecommerceUserId,
                status: "DELIVERED",
                items: { some: { inventoryItemId } },
            },
        });

        if (!purchasedOrder) {
            return { canReview: false, reason: "Must purchase first" };
        }

        return { canReview: true };
    }

    /**
     * Get helpful reviews
     */
    static async getHelpfulReviews(
        inventoryItemId: string,
        limit: number = 5
    ): Promise<
        Array<
            Review & {
                ecommerceUser: { name: string; avatar: string | null };
            }
        >
    > {
        return await prisma.review.findMany({
            where: { inventoryItemId, isApproved: true },
            include: {
                ecommerceUser: { select: { name: true, avatar: true } },
            },
            orderBy: [
                { helpfulCount: "desc" },
                { rating: "desc" },
                { createdAt: "desc" },
            ],
            take: limit,
        });
    }

    /**
     * Get user's review history
     */
    static async getUserReviewHistory(ecommerceUserId: string): Promise<
        Array<
            Review & {
                inventoryItem: {
                    id: string;
                    name: string;
                    images: any;
                };
            }
        >
    > {
        return await prisma.review.findMany({
            where: { ecommerceUserId },
            include: {
                inventoryItem: {
                    select: {
                        id: true,
                        name: true,
                        images: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    /**
     * Calculate review sentiment
     */
    static calculateReviewSentiment(
        rating: number,
        comment?: string
    ): "POSITIVE" | "NEUTRAL" | "NEGATIVE" {
        let sentiment: "POSITIVE" | "NEUTRAL" | "NEGATIVE";

        if (rating >= 4) {
            sentiment = "POSITIVE";
        } else if (rating === 3) {
            sentiment = "NEUTRAL";
        } else {
            sentiment = "NEGATIVE";
        }

        return sentiment;
    }

    /**
     * Get verified purchase reviews
     */
    static async getVerifiedReviews(inventoryItemId: string): Promise<
        Array<
            Review & {
                ecommerceUser: { name: string; avatar: string | null };
            }
        >
    > {
        return await prisma.review.findMany({
            where: {
                inventoryItemId,
                isApproved: true,
                ecommerceUser: {
                    orders: {
                        some: {
                            status: "DELIVERED",
                            items: {
                                some: { inventoryItemId },
                            },
                        },
                    },
                },
            },
            include: {
                ecommerceUser: {
                    select: { name: true, avatar: true },
                },
            },
        });
    }
}
