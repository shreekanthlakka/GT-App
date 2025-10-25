// ========================================
// apps/ecommerce/src/services/cartService.ts (FIXED)
// ========================================
import { prisma } from "@repo/db/prisma";
import { CustomError } from "@repo/common-backend/utils";
import { CartItem } from "@repo/db/prisma";

export class CartService {
    /**
     * Calculate cart totals
     */
    static async calculateCartTotals(ecommerceUserId: string): Promise<{
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
        totalItems: number;
        itemCount: number;
    }> {
        const cartItems = await prisma.cartItem.findMany({
            where: { ecommerceUserId },
            include: { inventoryItem: true },
        });

        const subtotal = cartItems.reduce((sum, item) => {
            return sum + Number(item.price) * item.quantity;
        }, 0);

        const taxAmount = subtotal * 0.18;
        const totalAmount = subtotal + taxAmount;
        const totalItems = cartItems.reduce(
            (sum, item) => sum + item.quantity,
            0
        );

        return {
            subtotal,
            taxAmount,
            totalAmount,
            totalItems,
            itemCount: cartItems.length,
        };
    }

    /**
     * Validate cart for checkout
     */
    static async validateCartForCheckout(ecommerceUserId: string): Promise<{
        valid: boolean;
        cartItems: Array<
            CartItem & {
                inventoryItem: {
                    id: string;
                    name: string;
                    sellingPrice: any;
                    currentStock: number;
                    isActive: boolean;
                };
            }
        >;
    }> {
        const cartItems = await prisma.cartItem.findMany({
            where: { ecommerceUserId },
            include: { inventoryItem: true },
        });

        if (cartItems.length === 0) {
            throw new CustomError(400, "Cart is empty");
        }

        const errors: string[] = [];

        for (const item of cartItems) {
            if (!item.inventoryItem.isActive) {
                errors.push(
                    `${item.inventoryItem.name} is no longer available`
                );
            }

            if (item.inventoryItem.currentStock < item.quantity) {
                errors.push(
                    `${item.inventoryItem.name} has insufficient stock. Available: ${item.inventoryItem.currentStock}`
                );
            }

            if (item.inventoryItem.sellingPrice !== item.price) {
                errors.push(`${item.inventoryItem.name} price has changed`);
            }
        }

        if (errors.length > 0) {
            throw new CustomError(400, errors.join(", "));
        }

        return { valid: true, cartItems };
    }

    /**
     * Clear cart after order
     */
    static async clearCartAfterOrder(ecommerceUserId: string): Promise<void> {
        await prisma.cartItem.deleteMany({
            where: { ecommerceUserId },
        });
    }
}
