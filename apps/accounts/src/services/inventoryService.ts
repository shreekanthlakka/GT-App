import { prisma } from "@repo/db/prisma";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { CustomError } from "@repo/common-backend/utils";
import {
    StockMovementCreatedPublisher,
    LowStockAlertPublisher,
} from "../events/publishers/inventoryPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { Prisma } from "@repo/db";

export class InventoryService {
    /**
     * Reduce stock for a sale item
     */
    static async reduceStockForSale(
        inventoryItemId: string,
        quantity: number,
        saleId: string,
        userId: string
    ): Promise<void> {
        const item = await prisma.inventoryItem.findFirst({
            where: { id: inventoryItemId, userId, isActive: true },
        });

        if (!item) {
            throw new CustomError(404, "Inventory item not found");
        }

        if (Number(item.currentStock) < quantity) {
            throw new CustomError(
                400,
                `Insufficient stock for ${item.name}. Available: ${item.currentStock}, Required: ${quantity}`
            );
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Update stock
            const updatedItem = await tx.inventoryItem.update({
                where: { id: inventoryItemId },
                data: {
                    currentStock: { decrement: quantity },
                    updatedAt: new Date(),
                },
            });

            // Create stock movement
            await tx.stockMovement.create({
                data: {
                    inventoryItemId,
                    type: "OUT",
                    quantity,
                    previousStock: Number(item.currentStock),
                    newStock: Number(item.currentStock) - quantity,
                    reason: "Sale",
                    reference: saleId,
                    userId,
                },
            });

            // Check for low stock
            const newStock = Number(updatedItem.currentStock);
            if (newStock <= Number(item.minimumStock)) {
                const lowStockPublisher = new LowStockAlertPublisher(
                    kafkaWrapper.producer
                );
                await lowStockPublisher.publish({
                    inventoryItemId: item.id,
                    itemName: item.name,
                    sku: item.sku,
                    currentStock: newStock,
                    minimumStock: Number(item.minimumStock),
                    reorderLevel: item.reorderLevel
                        ? Number(item.reorderLevel)
                        : Number(item.minimumStock),
                    category: item.category,
                    alertLevel: newStock === 0 ? "OUT_OF_STOCK" : "LOW_STOCK",
                    userId,
                    detectedAt: new Date().toISOString(),
                });
            }
        });

        logger.info("Stock reduced for sale", LogCategory.INVENTORY, {
            itemId: inventoryItemId,
            itemName: item.name,
            quantity,
            saleId,
            newStock: Number(item.currentStock) - quantity,
        });
    }

    /**
     * Restore stock for cancelled/returned sale
     */
    static async restoreStockForSale(
        inventoryItemId: string,
        quantity: number,
        saleId: string,
        reason: "CANCELLED" | "RETURNED",
        userId: string
    ): Promise<void> {
        const item = await prisma.inventoryItem.findFirst({
            where: { id: inventoryItemId, userId, isActive: true },
        });

        if (!item) {
            throw new CustomError(404, "Inventory item not found");
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Update stock
            await tx.inventoryItem.update({
                where: { id: inventoryItemId },
                data: {
                    currentStock: { increment: quantity },
                    updatedAt: new Date(),
                },
            });

            // Create stock movement
            await tx.stockMovement.create({
                data: {
                    inventoryItemId,
                    type: reason === "RETURNED" ? "RETURN" : "IN",
                    quantity,
                    previousStock: Number(item.currentStock),
                    newStock: Number(item.currentStock) + quantity,
                    reason: `Sale ${reason.toLowerCase()}`,
                    reference: saleId,
                    userId,
                },
            });
        });

        logger.info("Stock restored for sale", LogCategory.INVENTORY, {
            itemId: inventoryItemId,
            itemName: item.name,
            quantity,
            saleId,
            reason,
            newStock: Number(item.currentStock) + quantity,
        });
    }

    /**
     * Check if sufficient stock available for sale
     */
    static async checkStockAvailability(
        items: Array<{
            inventoryItemId?: string;
            quantity: number;
            itemName: string;
        }>,
        userId: string
    ): Promise<{ available: boolean; insufficientItems: string[] }> {
        const insufficientItems: string[] = [];

        for (const item of items) {
            if (!item.inventoryItemId) continue;

            const inventoryItem = await prisma.inventoryItem.findFirst({
                where: { id: item.inventoryItemId, userId, isActive: true },
                select: { currentStock: true, name: true },
            });

            if (!inventoryItem) {
                insufficientItems.push(`${item.itemName} (not found)`);
                continue;
            }

            if (Number(inventoryItem.currentStock) < item.quantity) {
                insufficientItems.push(
                    `${item.itemName} (available: ${inventoryItem.currentStock}, required: ${item.quantity})`
                );
            }
        }

        return {
            available: insufficientItems.length === 0,
            insufficientItems,
        };
    }

    /**
     * Add stock from purchase invoice
     */
    static async addStockFromInvoice(
        inventoryItemId: string,
        quantity: number,
        unitPrice: number,
        invoiceId: string,
        userId: string
    ): Promise<void> {
        const item = await prisma.inventoryItem.findFirst({
            where: { id: inventoryItemId, userId, isActive: true },
        });

        if (!item) {
            throw new CustomError(404, "Inventory item not found");
        }

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Update stock and purchase details
            await tx.inventoryItem.update({
                where: { id: inventoryItemId },
                data: {
                    currentStock: { increment: quantity },
                    lastPurchaseDate: new Date(),
                    lastPurchasePrice: unitPrice,
                    updatedAt: new Date(),
                },
            });

            // Create stock movement
            await tx.stockMovement.create({
                data: {
                    inventoryItemId,
                    type: "IN",
                    quantity,
                    previousStock: Number(item.currentStock),
                    newStock: Number(item.currentStock) + quantity,
                    reason: "Purchase from supplier",
                    reference: invoiceId,
                    unitPrice,
                    totalValue: unitPrice * quantity,
                    userId,
                },
            });
        });

        logger.info("Stock added from invoice", LogCategory.INVENTORY, {
            itemId: inventoryItemId,
            itemName: item.name,
            quantity,
            unitPrice,
            invoiceId,
            newStock: Number(item.currentStock) + quantity,
        });
    }

    /**
     * Reserve stock for order (soft reservation)
     */
    static async reserveStockForOrder(
        inventoryItemId: string,
        quantity: number,
        orderId: string,
        userId: string
    ): Promise<void> {
        // Implementation depends on whether you want hard or soft reservations
        // For now, we'll just reduce stock immediately
        await this.reduceStockForSale(
            inventoryItemId,
            quantity,
            orderId,
            userId
        );
    }

    /**
     * Get inventory item by SKU or barcode
     */
    static async findBySkuOrBarcode(
        identifier: string,
        userId: string
    ): Promise<any> {
        return await prisma.inventoryItem.findFirst({
            where: {
                userId,
                isActive: true,
                OR: [{ sku: identifier }, { barcode: identifier }],
            },
        });
    }
}
