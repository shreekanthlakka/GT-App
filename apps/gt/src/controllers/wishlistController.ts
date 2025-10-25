// ========================================
// wishlistController.ts
// ========================================
import { Request, Response } from "express";
import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";

export const getWishlist = asyncHandler(async (req: Request, res: Response) => {
    const ecommerceUserId = req.user?.userId;

    const wishlistItems = await prisma.wishlistItem.findMany({
        where: { ecommerceUserId },
        include: {
            inventoryItem: {
                select: {
                    id: true,
                    name: true,
                    description: true,
                    sellingPrice: true,
                    currentStock: true,
                    isActive: true,
                    images: true,
                    sku: true,
                    category: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const response = new CustomResponse(
        200,
        "Wishlist retrieved successfully",
        wishlistItems
    );
    res.status(response.statusCode).json(response);
});

export const addToWishlist = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { inventoryItemId } = req.body;

        const inventoryItem = await prisma.inventoryItem.findUnique({
            where: { id: inventoryItemId },
            select: { id: true, name: true, isActive: true },
        });

        if (!inventoryItem) {
            throw new CustomError(404, "Product not found");
        }

        const existingItem = await prisma.wishlistItem.findUnique({
            where: {
                ecommerceUserId_inventoryItemId: {
                    ecommerceUserId: ecommerceUserId!,
                    inventoryItemId,
                },
            },
        });

        if (existingItem) {
            throw new CustomError(400, "Item already in wishlist");
        }

        const wishlistItem = await prisma.wishlistItem.create({
            data: {
                ecommerceUserId: ecommerceUserId!,
                inventoryItemId,
            },
            include: {
                inventoryItem: {
                    select: { id: true, name: true, sellingPrice: true },
                },
            },
        });

        logger.info("Item added to wishlist", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            inventoryItemId,
        });

        const response = new CustomResponse(
            201,
            "Item added to wishlist successfully",
            wishlistItem
        );
        res.status(response.statusCode).json(response);
    }
);

export const removeFromWishlist = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { itemId } = req.params;

        const wishlistItem = await prisma.wishlistItem.findFirst({
            where: { id: itemId, ecommerceUserId },
        });

        if (!wishlistItem) {
            throw new CustomError(404, "Wishlist item not found");
        }

        await prisma.wishlistItem.delete({
            where: { id: itemId },
        });

        logger.info("Item removed from wishlist", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            wishlistItemId: itemId,
        });

        const response = new CustomResponse(
            200,
            "Item removed from wishlist successfully",
            null
        );
        res.status(response.statusCode).json(response);
    }
);

export const bulkAddToWishlist = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { inventoryItemIds } = req.body;

        const addedItems: any[] = [];

        for (const inventoryItemId of inventoryItemIds) {
            const existing = await prisma.wishlistItem.findUnique({
                where: {
                    ecommerceUserId_inventoryItemId: {
                        ecommerceUserId: ecommerceUserId!,
                        inventoryItemId,
                    },
                },
            });

            if (!existing) {
                const item = await prisma.wishlistItem.create({
                    data: {
                        ecommerceUserId: ecommerceUserId!,
                        inventoryItemId,
                    },
                });
                addedItems.push(item);
            }
        }

        logger.info("Items bulk added to wishlist", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            itemsAdded: addedItems.length,
        });

        const response = new CustomResponse(
            200,
            `${addedItems.length} items added to wishlist`,
            addedItems
        );
        res.status(response.statusCode).json(response);
    }
);

export const clearWishlist = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;

        await prisma.wishlistItem.deleteMany({
            where: { ecommerceUserId },
        });

        logger.info("Wishlist cleared", LogCategory.ECOMMERCE, {
            ecommerceUserId,
        });

        const response = new CustomResponse(
            200,
            "Wishlist cleared successfully",
            null
        );
        res.status(response.statusCode).json(response);
    }
);
