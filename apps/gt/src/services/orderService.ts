// ========================================
// apps/ecommerce/src/services/orderService.ts (FIXED)
// ========================================
import { prisma } from "@repo/db/prisma";
import { CustomError } from "@repo/common-backend/utils";

export class OrderService {
    /**
     * Generate unique order number
     */
    static async generateOrderNumber(): Promise<string> {
        const today = new Date();
        const year = today.getFullYear().toString().slice(-2);
        const month = (today.getMonth() + 1).toString().padStart(2, "0");
        const day = today.getDate().toString().padStart(2, "0");

        const count = await prisma.order.count({
            where: {
                createdAt: {
                    gte: new Date(today.setHours(0, 0, 0, 0)),
                },
            },
        });

        const sequence = (count + 1).toString().padStart(4, "0");
        return `ORD${year}${month}${day}${sequence}`;
    }

    /**
     * Calculate order amounts
     */
    static calculateOrderAmounts(
        items: Array<{ price: number; quantity: number }>,
        shippingAmount: number,
        discountAmount: number
    ): {
        subtotal: number;
        taxAmount: number;
        totalAmount: number;
    } {
        const subtotal = items.reduce((sum, item) => {
            return sum + item.price * item.quantity;
        }, 0);

        const taxAmount = subtotal * 0.18;
        const totalAmount =
            subtotal + taxAmount + shippingAmount - discountAmount;

        return {
            subtotal,
            taxAmount,
            totalAmount: Math.max(0, totalAmount),
        };
    }

    /**
     * Reserve inventory for order
     */
    static async reserveInventory(
        items: Array<{ inventoryItemId: string; quantity: number }>
    ): Promise<void> {
        for (const item of items) {
            const inventoryItem = await prisma.inventoryItem.findUnique({
                where: { id: item.inventoryItemId },
            });

            if (!inventoryItem) {
                throw new CustomError(
                    404,
                    `Product not found: ${item.inventoryItemId}`
                );
            }

            if (!inventoryItem.isActive) {
                throw new CustomError(
                    400,
                    `${inventoryItem.name} is not available`
                );
            }

            if (inventoryItem.currentStock < item.quantity) {
                throw new CustomError(
                    400,
                    `Insufficient stock for ${inventoryItem.name}. Available: ${inventoryItem.currentStock}`
                );
            }

            await prisma.inventoryItem.update({
                where: { id: item.inventoryItemId },
                data: { currentStock: { decrement: item.quantity } },
            });
        }
    }

    /**
     * Calculate estimated delivery date
     */
    static calculateEstimatedDelivery(): Date {
        const today = new Date();
        const deliveryDays = 5;
        today.setDate(today.getDate() + deliveryDays);
        return today;
    }

    /**
     * Check if order can be cancelled
     */
    static canCancelOrder(status: string): boolean {
        const cancellableStatuses = ["PENDING", "CONFIRMED"];
        return cancellableStatuses.includes(status);
    }

    /**
     * Check if order can be returned
     */
    static canReturnOrder(status: string, deliveredAt?: Date): boolean {
        if (status !== "DELIVERED") return false;
        if (!deliveredAt) return false;

        const daysSinceDelivery = Math.floor(
            (Date.now() - new Date(deliveredAt).getTime()) /
                (1000 * 60 * 60 * 24)
        );

        return daysSinceDelivery <= 7;
    }

    /**
     * Get order analytics
     */
    static async getOrderAnalytics(ecommerceUserId: string): Promise<{
        totalOrders: number;
        totalSpent: number;
        recentOrders: Array<{
            id: string;
            orderNumber: string;
            status: string;
            totalAmount: any;
            createdAt: Date;
        }>;
    }> {
        const [totalOrders, totalSpent, recentOrders] = await Promise.all([
            prisma.order.count({ where: { ecommerceUserId } }),
            prisma.order.aggregate({
                where: { ecommerceUserId, status: { not: "CANCELLED" } },
                _sum: { totalAmount: true },
            }),
            prisma.order.findMany({
                where: { ecommerceUserId },
                take: 5,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    orderNo: true,
                    status: true,
                    totalAmount: true,
                    createdAt: true,
                },
            }),
        ]);

        return {
            totalOrders,
            totalSpent: Number(totalSpent._sum.totalAmount || 0),
            recentOrders,
        };
    }
}
