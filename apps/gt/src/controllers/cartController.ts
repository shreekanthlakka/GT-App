// ========================================
// cartController.ts
// ========================================
import { Request, Response } from "express";
import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { CartService } from "../services/cartService";
import {
    CartItemAddedPublisher,
    CartItemRemovedPublisher,
    CartUpdatedPublisher,
} from "../events/publishers/cartPublisher";
import { kafkaWrapper } from "@repo/common-backend/kafka";

export const getCart = asyncHandler(async (req: Request, res: Response) => {
    const ecommerceUserId = req.user?.userId;

    const cartItems = await prisma.cartItem.findMany({
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

    const totals = await CartService.calculateCartTotals(ecommerceUserId!);

    const response = new CustomResponse(200, "Cart retrieved successfully", {
        items: cartItems,
        summary: totals,
    });
    res.status(response.statusCode).json(response);
});

export const addToCart = asyncHandler(async (req: Request, res: Response) => {
    const ecommerceUserId = req.user?.userId;
    const { inventoryItemId, quantity } = req.body;

    const inventoryItem = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        select: {
            id: true,
            name: true,
            sellingPrice: true,
            currentStock: true,
            isActive: true,
        },
    });

    if (!inventoryItem) {
        throw new CustomError(404, "Product not found");
    }

    if (!inventoryItem.isActive) {
        throw new CustomError(400, "Product is not available");
    }

    if (inventoryItem.currentStock < quantity) {
        throw new CustomError(
            400,
            `Insufficient stock. Available: ${inventoryItem.currentStock}`
        );
    }

    const existingCartItem = await prisma.cartItem.findUnique({
        where: {
            ecommerceUserId_inventoryItemId: {
                ecommerceUserId: ecommerceUserId!,
                inventoryItemId,
            },
        },
    });

    let cartItem;

    if (existingCartItem) {
        cartItem = await prisma.cartItem.update({
            where: { id: existingCartItem.id },
            data: {
                quantity: existingCartItem.quantity + quantity,
                price: inventoryItem.sellingPrice,
            },
            include: {
                inventoryItem: {
                    select: { id: true, name: true, sellingPrice: true },
                },
            },
        });
    } else {
        cartItem = await prisma.cartItem.create({
            data: {
                ecommerceUserId: ecommerceUserId!,
                inventoryItemId,
                quantity,
                price: inventoryItem.sellingPrice,
            },
            include: {
                inventoryItem: {
                    select: { id: true, name: true, sellingPrice: true },
                },
            },
        });
    }

    const publisher = new CartItemAddedPublisher(kafkaWrapper.producer);
    await publisher.publish({
        ecommerceUserId: ecommerceUserId!,
        cartItemId: cartItem.id,
        inventoryItemId: cartItem.inventoryItemId,
        productName: cartItem.inventoryItem.name,
        quantity: cartItem.quantity,
        price: Number(cartItem.price),
        addedAt: new Date().toISOString(),
    });

    logger.info("Item added to cart", LogCategory.ECOMMERCE, {
        ecommerceUserId,
        inventoryItemId,
        quantity,
    });

    const response = new CustomResponse(
        200,
        "Item added to cart successfully",
        cartItem
    );
    res.status(response.statusCode).json(response);
});

export const updateCartItem = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { itemId } = req.params;
        const { quantity } = req.body;

        const cartItem = await prisma.cartItem.findFirst({
            where: { id: itemId, ecommerceUserId },
            include: {
                inventoryItem: {
                    select: { name: true, currentStock: true, isActive: true },
                },
            },
        });

        if (!cartItem) {
            throw new CustomError(404, "Cart item not found");
        }

        if (!cartItem.inventoryItem.isActive) {
            throw new CustomError(400, "Product is no longer available");
        }

        if (cartItem.inventoryItem.currentStock < quantity) {
            throw new CustomError(
                400,
                `Insufficient stock. Available: ${cartItem.inventoryItem.currentStock}`
            );
        }

        const updatedCartItem = await prisma.cartItem.update({
            where: { id: itemId },
            data: { quantity },
            include: {
                inventoryItem: {
                    select: { id: true, name: true, sellingPrice: true },
                },
            },
        });

        const publisher = new CartUpdatedPublisher(kafkaWrapper.producer);
        await publisher.publish({
            ecommerceUserId: ecommerceUserId!,
            cartItemId: updatedCartItem.id,
            inventoryItemId: updatedCartItem.inventoryItemId,
            productName: updatedCartItem.inventoryItem.name,
            previousQuantity: cartItem.quantity,
            newQuantity: quantity,
            updatedAt: new Date().toISOString(),
        });

        logger.info("Cart item updated", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            cartItemId: itemId,
            quantity,
        });

        const response = new CustomResponse(
            200,
            "Cart item updated successfully",
            updatedCartItem
        );
        res.status(response.statusCode).json(response);
    }
);

export const removeFromCart = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { itemId } = req.params;

        const cartItem = await prisma.cartItem.findFirst({
            where: { id: itemId, ecommerceUserId },
            include: {
                inventoryItem: {
                    select: { name: true },
                },
            },
        });

        if (!cartItem) {
            throw new CustomError(404, "Cart item not found");
        }

        await prisma.cartItem.delete({ where: { id: itemId } });

        const publisher = new CartItemRemovedPublisher(kafkaWrapper.producer);
        await publisher.publish({
            ecommerceUserId: ecommerceUserId!,
            cartItemId: itemId,
            inventoryItemId: cartItem.inventoryItemId,
            productName: cartItem.inventoryItem.name,
            removedAt: new Date().toISOString(),
        });

        logger.info("Item removed from cart", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            cartItemId: itemId,
        });

        const response = new CustomResponse(
            200,
            "Item removed from cart successfully",
            null
        );
        res.status(response.statusCode).json(response);
    }
);

export const clearCart = asyncHandler(async (req: Request, res: Response) => {
    const ecommerceUserId = req.user?.userId;

    await prisma.cartItem.deleteMany({
        where: { ecommerceUserId },
    });

    logger.info("Cart cleared", LogCategory.ECOMMERCE, { ecommerceUserId });

    const response = new CustomResponse(200, "Cart cleared successfully", null);
    res.status(response.statusCode).json(response);
});

export const bulkUpdateCart = asyncHandler(
    async (req: Request, res: Response) => {
        const ecommerceUserId = req.user?.userId;
        const { items } = req.body;

        for (const item of items) {
            const cartItem = await prisma.cartItem.findFirst({
                where: {
                    ecommerceUserId,
                    inventoryItemId: item.inventoryItemId,
                },
            });

            if (cartItem) {
                await prisma.cartItem.update({
                    where: { id: cartItem.id },
                    data: { quantity: item.quantity },
                });
            }
        }

        logger.info("Cart bulk updated", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            itemsUpdated: items.length,
        });

        const response = new CustomResponse(
            200,
            "Cart updated successfully",
            null
        );
        res.status(response.statusCode).json(response);
    }
);
