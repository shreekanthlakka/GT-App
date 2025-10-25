// ========================================
// apps/ecommerce/src/services/wishlistService.ts (FIXED)
// ========================================
import { prisma } from "@repo/db/prisma";
import { CustomError } from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { CartItem, WishlistItem, InventoryItem } from "@repo/db/prisma";

export class WishlistService {
    /**
     * Move item from wishlist to cart
     */
    static async moveToCart(
        ecommerceUserId: string,
        wishlistItemId: string
    ): Promise<CartItem> {
        const wishlistItem = await prisma.wishlistItem.findFirst({
            where: { id: wishlistItemId, ecommerceUserId },
            include: {
                inventoryItem: {
                    select: {
                        id: true,
                        name: true,
                        sellingPrice: true,
                        currentStock: true,
                        isActive: true,
                    },
                },
            },
        });

        if (!wishlistItem) {
            throw new CustomError(404, "Wishlist item not found");
        }

        if (!wishlistItem.inventoryItem.isActive) {
            throw new CustomError(400, "Product is no longer available");
        }

        if (wishlistItem.inventoryItem.currentStock < 1) {
            throw new CustomError(400, "Product is out of stock");
        }

        const cartItem = await prisma.cartItem.upsert({
            where: {
                ecommerceUserId_inventoryItemId: {
                    ecommerceUserId,
                    inventoryItemId: wishlistItem.inventoryItemId,
                },
            },
            create: {
                ecommerceUserId,
                inventoryItemId: wishlistItem.inventoryItemId,
                quantity: 1,
                price: wishlistItem.inventoryItem.sellingPrice,
            },
            update: { quantity: { increment: 1 } },
        });

        await prisma.wishlistItem.delete({ where: { id: wishlistItemId } });

        logger.info("Item moved from wishlist to cart", LogCategory.ECOMMERCE, {
            ecommerceUserId,
            inventoryItemId: wishlistItem.inventoryItemId,
        });

        return cartItem;
    }

    /**
     * Get wishlist summary
     */
    static async getWishlistSummary(ecommerceUserId: string): Promise<{
        totalItems: number;
        inStock: number;
        outOfStock: number;
    }> {
        const [totalItems, inStock, outOfStock] = await Promise.all([
            prisma.wishlistItem.count({ where: { ecommerceUserId } }),
            prisma.wishlistItem.count({
                where: {
                    ecommerceUserId,
                    inventoryItem: { currentStock: { gt: 0 }, isActive: true },
                },
            }),
            prisma.wishlistItem.count({
                where: {
                    ecommerceUserId,
                    inventoryItem: {
                        OR: [{ currentStock: 0 }, { isActive: false }],
                    },
                },
            }),
        ]);

        return { totalItems, inStock, outOfStock };
    }

    /**
     * Check product availability in wishlist
     */
    static async checkWishlistAvailability(ecommerceUserId: string): Promise<{
        available: Array<
            WishlistItem & {
                inventoryItem: {
                    id: string;
                    name: string;
                    currentStock: number;
                    isActive: boolean;
                    sellingPrice: any;
                };
            }
        >;
        unavailable: Array<
            WishlistItem & {
                inventoryItem: {
                    id: string;
                    name: string;
                    currentStock: number;
                    isActive: boolean;
                    sellingPrice: any;
                };
            }
        >;
    }> {
        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { ecommerceUserId },
            include: {
                inventoryItem: {
                    select: {
                        id: true,
                        name: true,
                        currentStock: true,
                        isActive: true,
                        sellingPrice: true,
                    },
                },
            },
        });

        const available = wishlistItems.filter(
            (item) =>
                item.inventoryItem.isActive &&
                item.inventoryItem.currentStock > 0
        );

        const unavailable = wishlistItems.filter(
            (item) =>
                !item.inventoryItem.isActive ||
                item.inventoryItem.currentStock === 0
        );

        return { available, unavailable };
    }

    /**
     * Move all available items to cart
     */
    static async moveAllToCart(ecommerceUserId: string): Promise<CartItem[]> {
        const { available } =
            await this.checkWishlistAvailability(ecommerceUserId);

        const movedItems: CartItem[] = [];

        for (const item of available) {
            try {
                const cartItem = await this.moveToCart(
                    ecommerceUserId,
                    item.id
                );
                movedItems.push(cartItem);
            } catch (error: any) {
                logger.error(
                    "Failed to move item to cart",
                    error,
                    LogCategory.ECOMMERCE,
                    { wishlistItemId: item.id }
                );
            }
        }

        return movedItems;
    }

    /**
     * Clear unavailable items from wishlist
     */
    static async clearUnavailableItems(
        ecommerceUserId: string
    ): Promise<number> {
        const { unavailable } =
            await this.checkWishlistAvailability(ecommerceUserId);

        await prisma.wishlistItem.deleteMany({
            where: {
                id: { in: unavailable.map((item) => item.id) },
            },
        });

        return unavailable.length;
    }

    /**
     * Get price drop items
     */
    static async getPriceDropItems(ecommerceUserId: string): Promise<
        Array<
            WishlistItem & {
                inventoryItem: {
                    id: string;
                    name: string;
                    sellingPrice: any;
                    isActive: boolean;
                };
            }
        >
    > {
        const wishlistItems = await prisma.wishlistItem.findMany({
            where: { ecommerceUserId },
            include: {
                inventoryItem: {
                    select: {
                        id: true,
                        name: true,
                        sellingPrice: true,
                        isActive: true,
                    },
                },
            },
        });

        return wishlistItems;
    }
}
