// apps/accounts/src/utils/inventoryHelpers.ts
import { prisma } from "@repo/db/prisma";
import { logger, LogCategory } from "@repo/common-backend/logger";

/**
 * Get inventory suggestions for sale item
 */
export async function getInventorySuggestions(
    searchTerm: string,
    userId: string
): Promise<any[]> {
    return await prisma.inventoryItem.findMany({
        where: {
            userId,
            isActive: true,
            OR: [
                { name: { contains: searchTerm, mode: "insensitive" } },
                { sku: { contains: searchTerm, mode: "insensitive" } },
                { barcode: { contains: searchTerm, mode: "insensitive" } },
            ],
        },
        select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            currentStock: true,
            sellingPrice: true,
            unit: true,
            color: true,
            design: true,
            fabric: true,
        },
        take: 10,
    });
}

/**
 * Extract inventory items from sale items
 */
export function extractInventoryItemsFromSale(
    saleItems: any[]
): Array<{ inventoryItemId: string; quantity: number; itemName: string }> {
    return saleItems
        .filter((item) => item.inventoryItemId)
        .map((item) => ({
            inventoryItemId: item.inventoryItemId,
            quantity: Number(item.quantity),
            itemName: item.itemName,
        }));
}

/**
 * Calculate total inventory value for user
 */
export async function calculateInventoryValue(userId: string): Promise<{
    totalValue: number;
    totalItems: number;
    totalQuantity: number;
    byCategory: Record<
        string,
        { value: number; quantity: number; count: number }
    >;
}> {
    const items = await prisma.inventoryItem.findMany({
        where: { userId, isActive: true },
        select: {
            currentStock: true,
            costPrice: true,
            sellingPrice: true,
            category: true,
        },
    });

    let totalValue = 0;
    let totalQuantity = 0;
    const byCategory: Record<
        string,
        { value: number; quantity: number; count: number }
    > = {};

    items.forEach((item: (typeof items)[0]) => {
        const price = Number(item.costPrice) || Number(item.sellingPrice);
        const quantity = Number(item.currentStock);
        const itemValue = price * quantity;

        totalValue += itemValue;
        totalQuantity += quantity;

        const category = item.category || "Uncategorized";
        if (!byCategory[category]) {
            byCategory[category] = { value: 0, quantity: 0, count: 0 };
        }
        byCategory[category].value += itemValue;
        byCategory[category].quantity += quantity;
        byCategory[category].count += 1;
    });

    return {
        totalValue,
        totalItems: items.length,
        totalQuantity,
        byCategory,
    };
}

/**
 * Get low stock items count
 */
export async function getLowStockCount(userId: string): Promise<{
    outOfStock: number;
    critical: number;
    low: number;
    total: number;
}> {
    const items = await prisma.inventoryItem.findMany({
        where: {
            userId,
            isActive: true,
            currentStock: { lte: prisma.inventoryItem.fields.minimumStock },
        },
        select: {
            currentStock: true,
            minimumStock: true,
        },
    });

    let outOfStock = 0;
    let critical = 0;
    let low = 0;

    items.forEach((item: (typeof items)[0]) => {
        const stock = Number(item.currentStock);
        const minStock = Number(item.minimumStock);

        if (stock === 0) {
            outOfStock++;
        } else if (stock <= minStock * 0.5) {
            critical++;
        } else {
            low++;
        }
    });

    return {
        outOfStock,
        critical,
        low,
        total: items.length,
    };
}

/**
 * Validate if item can be sold with quantity
 */
export async function validateItemForSale(
    inventoryItemId: string,
    quantity: number,
    userId: string
): Promise<{ valid: boolean; message?: string; available?: number }> {
    const item = await prisma.inventoryItem.findFirst({
        where: { id: inventoryItemId, userId, isActive: true },
        select: { currentStock: true, name: true },
    });

    if (!item) {
        return {
            valid: false,
            message: "Item not found or inactive",
        };
    }

    const available = Number(item.currentStock);

    if (available < quantity) {
        return {
            valid: false,
            message: `Insufficient stock for ${item.name}. Available: ${available}, Required: ${quantity}`,
            available,
        };
    }

    return {
        valid: true,
        available,
    };
}

/**
 * Get items that need reordering
 */
export async function getReorderNeededItems(userId: string): Promise<any[]> {
    return await prisma.inventoryItem.findMany({
        where: {
            userId,
            isActive: true,
            OR: [
                {
                    currentStock: {
                        lte: prisma.inventoryItem.fields.reorderLevel,
                    },
                },
                {
                    AND: [
                        { reorderLevel: null },
                        {
                            currentStock: {
                                lte: prisma.inventoryItem.fields.minimumStock,
                            },
                        },
                    ],
                },
            ],
        },
        select: {
            id: true,
            name: true,
            sku: true,
            currentStock: true,
            minimumStock: true,
            reorderLevel: true,
            supplier: true,
            leadTime: true,
            category: true,
        },
        orderBy: { currentStock: "asc" },
    });
}

/**
 * Format stock movement for display
 */
export function formatStockMovement(movement: any): any {
    return {
        ...movement,
        quantityDisplay: `${movement.type === "OUT" ? "-" : "+"}${movement.quantity}`,
        stockChange: Number(movement.newStock) - Number(movement.previousStock),
        valueDisplay: movement.totalValue
            ? `₹${Number(movement.totalValue).toFixed(2)}`
            : null,
    };
}
