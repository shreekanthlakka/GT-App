// apps/accounts/src/controllers/inventoryController.ts

import { Request, Response } from "express";
import { prisma } from "@repo/db/prisma";
import { asyncHandler } from "@repo/common-backend/utils";
import { CustomError, CustomResponse } from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { Decimal } from "@prisma/client/runtime/library";
import {
    InventoryItemCreatedPublisher,
    InventoryItemUpdatedPublisher,
    InventoryItemDeletedPublisher,
    StockAddedPublisher,
    StockReducedPublisher,
    StockAdjustedPublisher,
    StockLowPublisher,
    StockCriticalPublisher,
    StockOutPublisher,
    shouldTriggerStockAlert,
    calculateReorderQuantity,
    determineStockStatus,
    calculateVariancePercentage,
} from "../events/publishers/inventoryPublishers";

// ========================================
// CRUD OPERATIONS
// ========================================

/**
 * Get all inventory items with filtering, searching, and pagination
 * GET /api/inventory
 */
export const getAllInventoryItems = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const category = req.query.category as string;
        const fabric = req.query.fabric as string;
        const color = req.query.color as string;
        const lowStock = req.query.lowStock === "true";
        const outOfStock = req.query.outOfStock === "true";
        const isActive = req.query.isActive !== "false";
        const sortBy = (req.query.sortBy as string) || "createdAt";
        const sortOrder = (req.query.sortOrder as "asc" | "desc") || "desc";

        const skip = (page - 1) * limit;

        const where: any = {
            userId,
            isActive,
        };

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { sku: { contains: search, mode: "insensitive" } },
                { barcode: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
            ];
        }

        if (category) where.category = category;
        if (fabric) where.fabric = { contains: fabric, mode: "insensitive" };
        if (color) where.color = { contains: color, mode: "insensitive" };
        if (lowStock)
            where.currentStock = {
                lte: prisma.inventoryItem.fields.minimumStock,
            };
        if (outOfStock) where.currentStock = 0;

        const [items, total] = await Promise.all([
            prisma.inventoryItem.findMany({
                where,
                skip,
                take: limit,
                orderBy: { [sortBy]: sortOrder },
                include: {
                    _count: {
                        select: { stockMovements: true },
                    },
                },
            }),
            prisma.inventoryItem.count({ where }),
        ]);

        logger.info("Inventory items retrieved", LogCategory.BUSINESS, {
            userId,
            total,
            page,
        });

        const response = new CustomResponse(
            200,
            "Inventory items retrieved successfully",
            {
                items,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            }
        );

        res.status(response.statusCode).json(response);
    }
);

/**
 * Get single inventory item by ID
 * GET /api/inventory/:id
 */
export const getInventoryItemById = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { id } = req.params;

        const item = await prisma.inventoryItem.findFirst({
            where: { id, userId },
            include: {
                stockMovements: {
                    orderBy: { createdAt: "desc" },
                    take: 10,
                },
                _count: {
                    select: {
                        orderItems: true,
                        stockMovements: true,
                    },
                },
            },
        });

        if (!item) {
            throw new CustomError(404, "Inventory item not found");
        }

        const stockValue =
            item.currentStock * (item.costPrice?.toNumber() || 0);

        logger.info("Inventory item retrieved", LogCategory.BUSINESS, {
            userId,
            itemId: id,
        });

        const response = new CustomResponse(
            200,
            "Inventory item retrieved successfully",
            {
                item: {
                    ...item,
                    stockValue,
                },
            }
        );

        res.status(response.statusCode).json(response);
    }
);

/**
 * Create new inventory item
 * POST /api/inventory
 */
export const createInventoryItem = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const validatedData = req.body;

        logger.info("Inventory item creation attempt", LogCategory.BUSINESS, {
            userId,
            name: validatedData.name,
        });

        // Check for duplicate SKU/barcode
        if (validatedData.sku) {
            const existingSku = await prisma.inventoryItem.findUnique({
                where: { sku: validatedData.sku },
            });
            if (existingSku) {
                throw new CustomError(
                    409,
                    `SKU "${validatedData.sku}" already exists`
                );
            }
        }

        if (validatedData.barcode) {
            const existingBarcode = await prisma.inventoryItem.findUnique({
                where: { barcode: validatedData.barcode },
            });
            if (existingBarcode) {
                throw new CustomError(
                    409,
                    `Barcode "${validatedData.barcode}" already exists`
                );
            }
        }

        const item = await prisma.$transaction(async (tx) => {
            const newItem = await tx.inventoryItem.create({
                data: {
                    name: validatedData.name,
                    description: validatedData.description,
                    sku: validatedData.sku,
                    barcode: validatedData.barcode,
                    category: validatedData.category,
                    subCategory: validatedData.subCategory,
                    brand: validatedData.brand,
                    sellingPrice: new Decimal(validatedData.sellingPrice),
                    costPrice: validatedData.costPrice
                        ? new Decimal(validatedData.costPrice)
                        : null,
                    mrp: validatedData.mrp
                        ? new Decimal(validatedData.mrp)
                        : null,
                    currentStock: validatedData.currentStock || 0,
                    minimumStock: validatedData.minimumStock || 0,
                    maximumStock: validatedData.maximumStock,
                    reorderLevel: validatedData.reorderLevel,
                    unit: validatedData.unit || "PCS",
                    fabric: validatedData.fabric,
                    gsm: validatedData.gsm,
                    width: validatedData.width
                        ? new Decimal(validatedData.width)
                        : null,
                    color: validatedData.color,
                    design: validatedData.design,
                    pattern: validatedData.pattern,
                    weaveType: validatedData.weaveType,
                    images: validatedData.images || [],
                    attributes: validatedData.attributes || {},
                    hsnCode: validatedData.hsnCode,
                    taxRate: validatedData.taxRate
                        ? new Decimal(validatedData.taxRate)
                        : null,
                    location: validatedData.location,
                    supplier: validatedData.supplier,
                    leadTime: validatedData.leadTime,
                    userId,
                },
            });

            if (validatedData.currentStock > 0) {
                await tx.stockMovement.create({
                    data: {
                        inventoryItemId: newItem.id,
                        type: "IN",
                        quantity: validatedData.currentStock,
                        previousStock: 0,
                        newStock: validatedData.currentStock,
                        reason: "INITIAL_STOCK",
                        unitPrice: validatedData.costPrice
                            ? new Decimal(validatedData.costPrice)
                            : null,
                        totalValue:
                            validatedData.costPrice &&
                            validatedData.currentStock
                                ? new Decimal(
                                      validatedData.costPrice *
                                          validatedData.currentStock
                                  )
                                : null,
                        userId,
                    },
                });
            }

            return newItem;
        });

        // Audit log
        logger.audit(
            "CREATE",
            "InventoryItem",
            item.id,
            userId,
            null,
            {
                name: item.name,
                category: item.category,
                sku: item.sku,
            },
            {
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            }
        );

        // Publish event with complete data
        try {
            const publisher = new InventoryItemCreatedPublisher(
                kafkaWrapper.producer
            );
            await publisher.publish({
                id: item.id,
                name: item.name,
                description: item.description || undefined,
                sku: item.sku || undefined,
                barcode: item.barcode || undefined,
                category: item.category,
                subCategory: item.subCategory || undefined,
                brand: item.brand || undefined,
                sellingPrice: item.sellingPrice.toNumber(),
                costPrice: item.costPrice?.toNumber(),
                mrp: item.mrp?.toNumber(),
                marginPercentage: item.costPrice
                    ? ((item.sellingPrice.toNumber() -
                          item.costPrice.toNumber()) /
                          item.sellingPrice.toNumber()) *
                      100
                    : undefined,
                currentStock: item.currentStock,
                minimumStock: item.minimumStock,
                maximumStock: item.maximumStock || undefined,
                reorderLevel: item.reorderLevel || undefined,
                unit: item.unit,
                textileDetails: {
                    fabric: item.fabric || undefined,
                    gsm: item.gsm || undefined,
                    width: item.width?.toNumber(),
                    color: item.color || undefined,
                    design: item.design || undefined,
                    pattern: item.pattern || undefined,
                    weaveType: item.weaveType || undefined,
                },
                images: item.images as string[],
                attributes: item.attributes as Record<string, any>,
                hsnCode: item.hsnCode || undefined,
                taxRate: item.taxRate?.toNumber(),
                location: item.location || undefined,
                supplier: item.supplier || undefined,
                leadTime: item.leadTime || undefined,
                lastPurchaseDate: item.lastPurchaseDate?.toISOString(),
                lastPurchasePrice: item.lastPurchasePrice?.toNumber(),
                isActive: item.isActive,
                userId,
                createdBy: userId,
                createdAt: item.createdAt.toISOString(),
                initialStockEntry:
                    validatedData.currentStock > 0
                        ? {
                              quantity: validatedData.currentStock,
                              reason: "INITIAL_STOCK",
                              reference: undefined,
                              unitPrice: validatedData.costPrice,
                              totalValue: validatedData.costPrice
                                  ? validatedData.costPrice *
                                    validatedData.currentStock
                                  : undefined,
                          }
                        : undefined,
            });
        } catch (error) {
            logger.error(
                "Failed to publish inventory item created event",
                undefined,
                LogCategory.BUSINESS,
                { error, itemId: item.id }
            );
        }

        logger.info(
            "Inventory item created successfully",
            LogCategory.BUSINESS,
            {
                userId,
                itemId: item.id,
            }
        );

        const response = new CustomResponse(
            201,
            "Inventory item created successfully",
            { item }
        );
        res.status(response.statusCode).json(response);
    }
);

/**
 * Update inventory item
 * PUT /api/inventory/:id
 */
export const updateInventoryItem = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { id } = req.params;
        const validatedData = req.body;

        const existingItem = await prisma.inventoryItem.findFirst({
            where: { id, userId },
        });

        if (!existingItem) {
            throw new CustomError(404, "Inventory item not found");
        }

        if (validatedData.currentStock !== undefined) {
            delete validatedData.currentStock;
            logger.warn(
                "Attempted direct stock update via update endpoint",
                LogCategory.BUSINESS,
                { userId, itemId: id }
            );
        }

        if (validatedData.sku && validatedData.sku !== existingItem.sku) {
            const existingSku = await prisma.inventoryItem.findUnique({
                where: { sku: validatedData.sku },
            });
            if (existingSku) {
                throw new CustomError(
                    409,
                    `SKU "${validatedData.sku}" already exists`
                );
            }
        }

        if (
            validatedData.barcode &&
            validatedData.barcode !== existingItem.barcode
        ) {
            const existingBarcode = await prisma.inventoryItem.findUnique({
                where: { barcode: validatedData.barcode },
            });
            if (existingBarcode) {
                throw new CustomError(
                    409,
                    `Barcode "${validatedData.barcode}" already exists`
                );
            }
        }

        const changes: Record<string, { oldValue: any; newValue: any }> = {};
        Object.keys(validatedData).forEach((key) => {
            if (validatedData[key] !== (existingItem as any)[key]) {
                changes[key] = {
                    oldValue: (existingItem as any)[key],
                    newValue: validatedData[key],
                };
            }
        });

        const updatedItem = await prisma.inventoryItem.update({
            where: { id },
            data: {
                ...validatedData,
                sellingPrice: validatedData.sellingPrice
                    ? new Decimal(validatedData.sellingPrice)
                    : undefined,
                costPrice: validatedData.costPrice
                    ? new Decimal(validatedData.costPrice)
                    : undefined,
                mrp: validatedData.mrp
                    ? new Decimal(validatedData.mrp)
                    : undefined,
                width: validatedData.width
                    ? new Decimal(validatedData.width)
                    : undefined,
                taxRate: validatedData.taxRate
                    ? new Decimal(validatedData.taxRate)
                    : undefined,
            },
        });

        logger.audit(
            "UPDATE",
            "InventoryItem",
            id,
            userId,
            existingItem,
            updatedItem,
            {
                ipAddress: req.ip,
                userAgent: req.headers["user-agent"],
            }
        );

        try {
            const publisher = new InventoryItemUpdatedPublisher(
                kafkaWrapper.producer
            );
            await publisher.publish({
                id: updatedItem.id,
                updatedAt: updatedItem.updatedAt.toISOString(),
                changes,
                updatedBy: userId,
                priceChanged:
                    !!changes.sellingPrice ||
                    !!changes.costPrice ||
                    !!changes.mrp,
                stockLevelsChanged:
                    !!changes.minimumStock ||
                    !!changes.maximumStock ||
                    !!changes.reorderLevel,
                textileDetailsChanged: !!(
                    changes.fabric ||
                    changes.gsm ||
                    changes.width ||
                    changes.color
                ),
                statusChanged: !!changes.isActive,
                supplierChanged: !!changes.supplier,
            });
        } catch (error) {
            logger.error(
                "Failed to publish inventory item updated event",
                undefined,
                LogCategory.BUSINESS,
                { error, itemId: id }
            );
        }

        logger.info(
            "Inventory item updated successfully",
            LogCategory.BUSINESS,
            {
                userId,
                itemId: id,
                changes: Object.keys(changes),
            }
        );

        const response = new CustomResponse(
            200,
            "Inventory item updated successfully",
            { item: updatedItem }
        );
        res.status(response.statusCode).json(response);
    }
);

/**
 * Delete/Deactivate inventory item
 * DELETE /api/inventory/:id
 */
export const deleteInventoryItem = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { id } = req.params;
        const hardDelete = req.query.hard === "true";

        const item = await prisma.inventoryItem.findFirst({
            where: { id, userId },
            include: {
                _count: {
                    select: {
                        orderItems: true,
                        stockMovements: true,
                        wishlistItems: true,
                        reviews: true,
                    },
                },
            },
        });

        if (!item) {
            throw new CustomError(404, "Inventory item not found");
        }

        if (item._count.orderItems > 0 && hardDelete) {
            throw new CustomError(
                400,
                "Cannot delete item with existing orders. Deactivate instead."
            );
        }

        let result;
        if (hardDelete) {
            result = await prisma.inventoryItem.delete({ where: { id } });
        } else {
            result = await prisma.inventoryItem.update({
                where: { id },
                data: { isActive: false },
            });
        }

        logger.audit("DELETE", "InventoryItem", id, userId, item, null, {
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        });

        try {
            const publisher = new InventoryItemDeletedPublisher(
                kafkaWrapper.producer
            );
            await publisher.publish({
                id: item.id,
                name: item.name,
                sku: item.sku || undefined,
                category: item.category,
                currentStock: item.currentStock,
                sellingPrice: item.sellingPrice.toNumber(),
                deletedAt: new Date().toISOString(),
                deletedBy: userId,
                reason: hardDelete ? "HARD_DELETE" : "DEACTIVATED",
                hasActiveOrders: item._count.orderItems > 0,
                hasPendingStock: item.currentStock > 0,
                hasWishlistItems: item._count.wishlistItems > 0,
                hasReviews: item._count.reviews > 0,
                stockMovementCleanup: hardDelete,
                orderItemsAffected: item._count.orderItems,
                wishlistItemsAffected: item._count.wishlistItems,
                backupData: item,
                userId,
            });
        } catch (error) {
            logger.error(
                "Failed to publish inventory item deleted event",
                LogCategory.BUSINESS,
                { error, itemId: id }
            );
        }

        logger.info(
            "Inventory item deleted successfully",
            LogCategory.BUSINESS,
            { userId, itemId: id, hardDelete }
        );

        const response = new CustomResponse(
            200,
            hardDelete
                ? "Inventory item deleted permanently"
                : "Inventory item deactivated successfully",
            { item: result }
        );
        res.status(response.statusCode).json(response);
    }
);

// ========================================
// STOCK OPERATIONS
// ========================================

/**
 * Add stock to inventory item
 * POST /api/inventory/:id/add-stock
 */
export const addStock = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }

    const { id } = req.params;
    const {
        quantity,
        reason,
        reference,
        batchNumber,
        unitPrice,
        notes,
        adjustment,
    } = req.body;

    if (!quantity || quantity <= 0) {
        throw new CustomError(400, "Quantity must be greater than 0");
    }

    const result = await prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findFirst({
            where: { id, userId },
        });

        if (!item) {
            throw new CustomError(404, "Inventory item not found");
        }

        if (!item.isActive) {
            throw new CustomError(400, "Cannot add stock to inactive item");
        }

        const previousStock = item.currentStock;
        const newStock = previousStock + quantity;

        const updatedItem = await tx.inventoryItem.update({
            where: { id },
            data: {
                currentStock: newStock,
                lastPurchaseDate: new Date(),
                lastPurchasePrice: unitPrice
                    ? new Decimal(unitPrice)
                    : undefined,
            },
        });

        const stockMovement = await tx.stockMovement.create({
            data: {
                inventoryItemId: id || undefined,
                type: "ADJUSTMENT",
                quantity: adjustment,
                previousStock,
                newStock,
                reason,
                notes,
                userId,
            },
        });

        return {
            item: updatedItem,
            movement: stockMovement,
            previousStock,
            adjustment,
        };
    });

    logger.audit(
        "STOCK_ADJUST",
        "StockMovement",
        result.movement.id,
        userId,
        { currentStock: result.previousStock },
        { currentStock: result.item.currentStock },
        { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
    );

    try {
        const publisher = new StockAdjustedPublisher(kafkaWrapper.producer);
        const stockStatus = determineStockStatus(
            result.item.currentStock,
            result.item.minimumStock,
            result.item.maximumStock || undefined
        );
        const variance = result.adjustment;
        const variancePercentage = calculateVariancePercentage(
            result.previousStock,
            result.item.currentStock
        );

        await publisher.publish({
            id: result.movement.id,
            inventoryItemId: id,
            inventoryItemName: result.item.name,
            sku: result.item.sku || undefined,
            previousStock: result.previousStock,
            adjustedStock: result.item.currentStock,
            adjustmentQuantity: result.adjustment,
            adjustmentType: result.adjustment > 0 ? "INCREASE" : "DECREASE",
            reason: reason as any,
            description: notes,
            unitCost: result.item.costPrice?.toNumber(),
            totalValueImpact: result.item.costPrice
                ? result.item.costPrice.toNumber() * Math.abs(result.adjustment)
                : 0,
            requiresApproval: Math.abs(result.adjustment) > 100,
            variance,
            variancePercentage,
            createdBy: userId,
            createdAt: result.movement.createdAt.toISOString(),
            userId,
            stockStatus,
            alertsTriggered: [],
        });
    } catch (error) {
        logger.error(
            "Failed to publish stock adjusted event",
            undefined,
            LogCategory.BUSINESS,
            { error, itemId: id }
        );
    }

    logger.info("Stock adjusted successfully", LogCategory.BUSINESS, {
        userId,
        itemId: id,
        adjustment: result.adjustment,
    });

    const response = new CustomResponse(200, "Stock adjusted successfully", {
        item: result.item,
        movement: result.movement,
        adjustment: result.adjustment,
    });
    res.status(response.statusCode).json(response);
});

// ========================================
// ANALYTICS & SEARCH
// ========================================

/**
 * Get low stock items
 * GET /api/inventory/analytics/low-stock
 */
export const getLowStockItems = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const category = req.query.category as string;
        const level = req.query.level as "low" | "critical" | "all";

        const where: any = {
            userId,
            isActive: true,
        };

        if (category) {
            where.category = category;
        }

        if (level === "critical") {
            where.currentStock = { lte: 5 };
        } else if (level === "low") {
            where.OR = [
                {
                    currentStock: {
                        lte: prisma.inventoryItem.fields.minimumStock,
                    },
                },
                {
                    currentStock: {
                        lte: prisma.inventoryItem.fields.reorderLevel,
                    },
                },
            ];
        } else {
            where.OR = [
                { currentStock: { lte: 5 } },
                {
                    currentStock: {
                        lte: prisma.inventoryItem.fields.minimumStock,
                    },
                },
                {
                    currentStock: {
                        lte: prisma.inventoryItem.fields.reorderLevel,
                    },
                },
            ];
        }

        const items = await prisma.inventoryItem.findMany({
            where,
            orderBy: [{ currentStock: "asc" }, { name: "asc" }],
            select: {
                id: true,
                name: true,
                sku: true,
                category: true,
                currentStock: true,
                minimumStock: true,
                reorderLevel: true,
                maximumStock: true,
                supplier: true,
                leadTime: true,
                costPrice: true,
                sellingPrice: true,
            },
        });

        const itemsWithSuggestions = items.map((item) => {
            const alertLevel =
                item.currentStock === 0
                    ? "OUT_OF_STOCK"
                    : item.currentStock <= 5
                      ? "CRITICAL"
                      : "LOW";
            const recommendedOrderQty = calculateReorderQuantity(
                item.currentStock,
                item.minimumStock,
                item.maximumStock || undefined
            );
            const estimatedCost = item.costPrice
                ? item.costPrice.toNumber() * recommendedOrderQty
                : 0;

            return {
                ...item,
                alertLevel,
                recommendedOrderQty,
                estimatedCost,
                daysUntilOutOfStock:
                    item.currentStock > 0
                        ? Math.ceil(item.currentStock / 2)
                        : 0,
            };
        });

        logger.info("Low stock items retrieved", LogCategory.BUSINESS, {
            userId,
            count: items.length,
            level,
        });

        const response = new CustomResponse(
            200,
            "Low stock items retrieved successfully",
            {
                items: itemsWithSuggestions,
                summary: {
                    total: items.length,
                    critical: itemsWithSuggestions.filter(
                        (i) => i.alertLevel === "CRITICAL"
                    ).length,
                    outOfStock: itemsWithSuggestions.filter(
                        (i) => i.alertLevel === "OUT_OF_STOCK"
                    ).length,
                },
            }
        );

        res.status(response.statusCode).json(response);
    }
);

/**
 * Get stock movement history
 * GET /api/inventory/movements/history
 */
export const getStockMovementHistory = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const itemId = req.query.itemId as string;
        const type = req.query.type as string;
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;

        const skip = (page - 1) * limit;

        const where: any = { userId };

        if (itemId) where.inventoryItemId = itemId;
        if (type) where.type = type;
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

        const [movements, total] = await Promise.all([
            prisma.stockMovement.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    inventoryItem: {
                        select: {
                            id: true,
                            name: true,
                            sku: true,
                            category: true,
                            unit: true,
                        },
                    },
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.stockMovement.count({ where }),
        ]);

        logger.info("Stock movement history retrieved", LogCategory.BUSINESS, {
            userId,
            total,
        });

        const response = new CustomResponse(
            200,
            "Stock movement history retrieved successfully",
            {
                movements,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                    hasNext: page * limit < total,
                    hasPrev: page > 1,
                },
            }
        );

        res.status(response.statusCode).json(response);
    }
);

/**
 * Get inventory analytics
 * GET /api/inventory/analytics/summary
 */
export const getInventoryAnalytics = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const items = await prisma.inventoryItem.findMany({
            where: { userId, isActive: true },
            select: {
                id: true,
                name: true,
                category: true,
                currentStock: true,
                minimumStock: true,
                costPrice: true,
                sellingPrice: true,
            },
        });

        const totalItems = items.length;
        const totalStockValue = items.reduce(
            (sum, item) =>
                sum + item.currentStock * (item.costPrice?.toNumber() || 0),
            0
        );
        const totalPotentialRevenue = items.reduce(
            (sum, item) =>
                sum + item.currentStock * item.sellingPrice.toNumber(),
            0
        );
        const lowStockCount = items.filter(
            (item) => item.currentStock <= item.minimumStock
        ).length;
        const outOfStockCount = items.filter(
            (item) => item.currentStock === 0
        ).length;

        const categoryBreakdown = items.reduce(
            (acc, item) => {
                if (!acc[item.category]) {
                    acc[item.category] = {
                        count: 0,
                        totalStock: 0,
                        totalValue: 0,
                    };
                }
                acc[item.category].count++;
                acc[item.category].totalStock += item.currentStock;
                acc[item.category].totalValue +=
                    item.currentStock * (item.costPrice?.toNumber() || 0);
                return acc;
            },
            {} as Record<
                string,
                { count: number; totalStock: number; totalValue: number }
            >
        );

        const topItemsByValue = items
            .map((item) => ({
                id: item.id,
                name: item.name,
                category: item.category,
                stock: item.currentStock,
                value: item.currentStock * (item.costPrice?.toNumber() || 0),
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 10);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentMovements = await prisma.stockMovement.findMany({
            where: {
                userId,
                createdAt: { gte: thirtyDaysAgo },
            },
            select: {
                type: true,
                quantity: true,
            },
        });

        const movementSummary = recentMovements.reduce(
            (acc, movement) => {
                if (movement.type === "IN") {
                    acc.stockAdded += Math.abs(movement.quantity);
                } else if (movement.type === "OUT") {
                    acc.stockReduced += Math.abs(movement.quantity);
                } else if (movement.type === "ADJUSTMENT") {
                    if (movement.quantity > 0) {
                        acc.adjustmentsUp += movement.quantity;
                    } else {
                        acc.adjustmentsDown += Math.abs(movement.quantity);
                    }
                }
                return acc;
            },
            {
                stockAdded: 0,
                stockReduced: 0,
                adjustmentsUp: 0,
                adjustmentsDown: 0,
            }
        );

        logger.info("Inventory analytics retrieved", LogCategory.BUSINESS, {
            userId,
            totalItems,
        });

        const response = new CustomResponse(
            200,
            "Inventory analytics retrieved successfully",
            {
                summary: {
                    totalItems,
                    totalStockValue: Math.round(totalStockValue * 100) / 100,
                    totalPotentialRevenue:
                        Math.round(totalPotentialRevenue * 100) / 100,
                    potentialProfit:
                        Math.round(
                            (totalPotentialRevenue - totalStockValue) * 100
                        ) / 100,
                    lowStockCount,
                    outOfStockCount,
                    healthPercentage: Math.round(
                        ((totalItems - lowStockCount - outOfStockCount) /
                            totalItems) *
                            100
                    ),
                },
                categoryBreakdown: Object.entries(categoryBreakdown).map(
                    ([category, data]) => ({
                        category,
                        ...data,
                        averageValue:
                            Math.round((data.totalValue / data.count) * 100) /
                            100,
                    })
                ),
                topItemsByValue,
                last30Days: movementSummary,
            }
        );

        res.status(response.statusCode).json(response);
    }
);

/**
 * ======================================================================================
 * Search inventory for POS
 * GET /api/inventory/search/pos
 * ======================================================================================
 */
export const searchInventory = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const query = req.query.q as string;
        const limit = parseInt(req.query.limit as string) || 10;

        if (!query || query.length < 2) {
            throw new CustomError(
                400,
                "Search query must be at least 2 characters"
            );
        }

        const items = await prisma.inventoryItem.findMany({
            where: {
                userId,
                isActive: true,
                currentStock: { gt: 0 },
                OR: [
                    { name: { contains: query, mode: "insensitive" } },
                    { sku: { contains: query, mode: "insensitive" } },
                    { barcode: { contains: query, mode: "insensitive" } },
                    { category: { contains: query, mode: "insensitive" } },
                ],
            },
            take: limit,
            select: {
                id: true,
                name: true,
                sku: true,
                barcode: true,
                category: true,
                currentStock: true,
                sellingPrice: true,
                mrp: true,
                unit: true,
                taxRate: true,
                hsnCode: true,
                fabric: true,
                color: true,
                design: true,
                gsm: true,
                width: true,
            },
            orderBy: [{ name: "asc" }],
        });

        logger.info("POS inventory search performed", LogCategory.BUSINESS, {
            userId,
            query,
            resultsCount: items.length,
        });

        const response = new CustomResponse(
            200,
            "Search results retrieved successfully",
            { items }
        );
        res.status(response.statusCode).json(response);
    }
);

/**
 * ===============================================================================
 * Get inventory item by SKU or Barcode
 * GET /api/inventory/search/lookup
 * ===============================================================================
 */
export const getInventoryBySkuOrBarcode = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }

    const { sku, barcode } = req.query;

    if (!sku && !barcode) {
        throw new CustomError(400, "Either SKU or Barcode is required");
    }

    const where: any = { userId, isActive: true };

    if (sku) {
        where.sku = sku as string;
    } else if (barcode) {
        where.barcode = barcode as string;
    }

    const item = await prisma.inventoryItem.findFirst({
        where,
        include: {
            stockMovements: {
                orderBy: { createdAt: "desc" },
                take: 5,
            },
        },
    });

    if (!item) {
        throw new CustomError(
            404,
            `Item not found with ${sku ? "SKU" : "Barcode"}: ${sku || barcode}`
        );
    }

    logger.info("Inventory item lookup successful", LogCategory.BUSINESS, {
        userId,
        itemId: item.id,
    });

    const response = new CustomResponse(
        200,
        "Inventory item found successfully",
        { item }
    );
    res.status(response.statusCode).json(response);
});

// create({
//       data: {
//         inventoryItemId: id,
//         type: "IN",
//         quantity,
//         previousStock,
//         newStock,
//         reason: reason || "PURCHASE",
//         reference,
//         batchNumber,
//         unitPrice: unitPrice ? new Decimal(unitPrice) : null,
//         totalValue: unitPrice ? new Decimal(unitPrice * quantity) : null,
//         userId,
//       },
//     });

//     return { item: updatedItem, movement: stockMovement, previousStock };
//   });

//   logger.audit("STOCK_ADD", "StockMovement", result.movement.id, userId,
//     { currentStock: result.previousStock },
//     { currentStock: result.item.currentStock },
//     { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
//   );

//   try {
//     const publisher = new StockAddedPublisher(kafkaWrapper.producer);
//     const stockStatus = determineStockStatus(
//       result.item.currentStock,
//       result.item.minimumStock,
//       result.item.maximumStock || undefined
//     );

//     await publisher.publish({
//       id: result.movement.id,
//       inventoryItemId: id,
//       inventoryItemName: result.item.name,
//       sku: result.item.sku || undefined,
//       quantity,
//       previousStock: result.previousStock,
//       newStock: result.item.currentStock,
//       unit: result.item.unit,
//       unitPrice,
//       totalValue: unitPrice ? unitPrice * quantity : undefined,
//       reason: reason || "PURCHASE",
//       reference,
//       batchNumber,
//       condition: "NEW",
//       receivedDate: new Date().toISOString(),
//       createdBy: userId,
//       createdAt: result.movement.createdAt.toISOString(),
//       userId,
//       stockStatus,
//     });
//   } catch (error) {
//     logger.error("Failed to publish stock added event", LogCategory.BUSINESS, { error, itemId: id });
//   }

//   const response = new CustomResponse(200, "Stock added successfully", {
//     item: result.item,
//     movement: result.movement,
//   });
//   res.status(response.statusCode).json(response);
// });

/**
 * Reduce stock from inventory item
 * POST /api/inventory/:id/reduce-stock
 */
export const reduceStock = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }

    const { id } = req.params;
    const { quantity, reason, reference } = req.body;

    if (!quantity || quantity <= 0) {
        throw new CustomError(400, "Quantity must be greater than 0");
    }

    if (!reason) {
        throw new CustomError(400, "Reason is required for stock reduction");
    }

    const result = await prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findFirst({
            where: { id, userId },
        });

        if (!item) {
            throw new CustomError(404, "Inventory item not found");
        }

        if (item.currentStock < quantity) {
            throw new CustomError(
                400,
                `Insufficient stock. Available: ${item.currentStock}, Requested: ${quantity}`
            );
        }

        const previousStock = item.currentStock;
        const newStock = previousStock - quantity;

        const updatedItem = await tx.inventoryItem.update({
            where: { id },
            data: { currentStock: newStock },
        });

        const stockMovement = await tx.stockMovement.create({
            data: {
                inventoryItemId: id,
                type: "OUT",
                quantity: -quantity,
                previousStock,
                newStock,
                reason,
                reference,
                userId,
            },
        });

        return { item: updatedItem, movement: stockMovement, previousStock };
    });

    const { shouldAlert, alertLevel } = shouldTriggerStockAlert(
        result.item.currentStock,
        result.item.minimumStock,
        result.item.reorderLevel || undefined
    );

    if (shouldAlert) {
        try {
            if (result.item.currentStock === 0) {
                const outPublisher = new StockOutPublisher(
                    kafkaWrapper.producer
                );
                await outPublisher.publish({
                    inventoryItemId: id,
                    inventoryItemName: result.item.name,
                    sku: result.item.sku || undefined,
                    category: result.item.category,
                    stockOutDate: new Date().toISOString(),
                    lastStockQuantity: quantity,
                    unit: result.item.unit,
                    impact: {
                        pendingOrders: 0,
                        backorders: 0,
                        wishlistItems: 0,
                        averageDailySales: 0,
                        estimatedLostSales: 0,
                        customerInquiries: 0,
                    },
                    actionsTaken: {
                        ecommerceHidden: false,
                        customersNotified: false,
                        ordersUpdated: false,
                        backorderEnabled: false,
                        alternativesOffered: false,
                    },
                    userId,
                    frequentStockOut: false,
                    seasonalPattern: false,
                });
            } else if (alertLevel === "CRITICAL") {
                const criticalPublisher = new StockCriticalPublisher(
                    kafkaWrapper.producer
                );
                await criticalPublisher.publish({
                    inventoryItemId: id,
                    inventoryItemName: result.item.name,
                    sku: result.item.sku || undefined,
                    category: result.item.category,
                    currentStock: result.item.currentStock,
                    minimumStock: result.item.minimumStock,
                    unit: result.item.unit,
                    stockOutImminent: true,
                    estimatedStockOutDate: new Date(
                        Date.now() + 2 * 24 * 60 * 60 * 1000
                    ).toISOString(),
                    averageDailySales: 2,
                    pendingOrdersAffected: 0,
                    backorderRequired: false,
                    immediateActionRequired: true,
                    supplier: result.item.supplier || undefined,
                    supplierContactRequired: true,
                    expeditedOrderRecommended: true,
                    substituteItemsAvailable: false,
                    alertTriggeredAt: new Date().toISOString(),
                    userId,
                    managementNotified: false,
                    customerCommunicationRequired: false,
                    ecommerceStatusChange: false,
                });
            } else {
                const lowPublisher = new StockLowPublisher(
                    kafkaWrapper.producer
                );
                await lowPublisher.publish({
                    inventoryItemId: id,
                    inventoryItemName: result.item.name,
                    sku: result.item.sku || undefined,
                    category: result.item.category,
                    currentStock: result.item.currentStock,
                    minimumStock: result.item.minimumStock,
                    reorderLevel:
                        result.item.reorderLevel || result.item.minimumStock,
                    unit: result.item.unit,
                    shortageQuantity:
                        result.item.minimumStock - result.item.currentStock,
                    supplier: result.item.supplier || undefined,
                    leadTime: result.item.leadTime || undefined,
                    lastPurchasePrice:
                        result.item.lastPurchasePrice?.toNumber(),
                    alertLevel: "LOW",
                    alertTriggeredAt: new Date().toISOString(),
                    recommendedOrderQuantity: calculateReorderQuantity(
                        result.item.currentStock,
                        result.item.minimumStock,
                        result.item.maximumStock || undefined
                    ),
                    userId,
                    customerImpact: "LOW",
                });
            }
        } catch (error) {
            logger.error(
                "Failed to publish stock alert event",
                undefined,
                LogCategory.BUSINESS,
                { error, itemId: id }
            );
        }
    }

    try {
        const publisher = new StockReducedPublisher(kafkaWrapper.producer);
        const stockStatus = determineStockStatus(
            result.item.currentStock,
            result.item.minimumStock,
            result.item.maximumStock || undefined
        );

        await publisher.publish({
            id: result.movement.id,
            inventoryItemId: id,
            inventoryItemName: result.item.name,
            sku: result.item.sku || undefined,
            quantity,
            previousStock: result.previousStock,
            newStock: result.item.currentStock,
            unit: result.item.unit,
            reason: reason as any,
            reference,
            createdBy: userId,
            createdAt: result.movement.createdAt.toISOString(),
            userId,
            stockStatus,
            reorderRequired: shouldAlert,
        });
    } catch (error) {
        logger.error(
            "Failed to publish stock reduced event",
            undefined,
            LogCategory.BUSINESS,
            { error, itemId: id }
        );
    }

    logger.audit(
        "STOCK_REDUCE",
        "StockMovement",
        result.movement.id,
        userId,
        { currentStock: result.previousStock },
        { currentStock: result.item.currentStock },
        { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
    );

    const response = new CustomResponse(200, "Stock reduced successfully", {
        item: result.item,
        movement: result.movement,
        alert: shouldAlert ? { level: alertLevel } : null,
    });
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 * Adjust stock (manual correction)
 * POST /api/inventory/:id/adjust-stock
 * ==========================================================================================
 */
export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }

    const { id } = req.params;
    const { newStock, reason, notes } = req.body;

    if (newStock === undefined || newStock < 0) {
        throw new CustomError(400, "Valid new stock quantity is required");
    }

    if (!reason) {
        throw new CustomError(400, "Reason is required for stock adjustment");
    }

    logger.info("Stock adjustment attempt", LogCategory.BUSINESS, {
        userId,
        itemId: id,
        newStock,
        reason,
    });

    const result = await prisma.$transaction(async (tx) => {
        const item = await tx.inventoryItem.findFirst({
            where: { id, userId },
        });

        if (!item) {
            throw new CustomError(404, "Inventory item not found");
        }

        const previousStock = item.currentStock;
        const adjustment = newStock - previousStock;

        if (adjustment === 0) {
            throw new CustomError(
                400,
                "No adjustment needed. Stock is already at this level."
            );
        }

        const updatedItem = await tx.inventoryItem.update({
            where: { id },
            data: { currentStock: newStock },
        });

        const stockMovement = await tx.stockMovement.create({
            data: {
                inventoryItemId: id,
                type: "ADJUSTMENT",
                quantity: adjustment,
                previousStock,
                newStock,
                reason,
                notes,
                userId,
            },
        });

        return {
            item: updatedItem,
            movement: stockMovement,
            previousStock,
            adjustment,
        };
    });

    logger.audit(
        "STOCK_ADJUST",
        "StockMovement",
        result.movement.id,
        userId,
        { currentStock: result.previousStock },
        { currentStock: result.item.currentStock },
        { ipAddress: req.ip, userAgent: req.headers["user-agent"] }
    );

    try {
        const publisher = new StockAdjustedPublisher(kafkaWrapper.producer);
        const stockStatus = determineStockStatus(
            result.item.currentStock,
            result.item.minimumStock,
            result.item.maximumStock || undefined
        );
        const variance = result.adjustment;
        const variancePercentage = calculateVariancePercentage(
            result.previousStock,
            result.item.currentStock
        );

        await publisher.publish({
            id: result.movement.id,
            inventoryItemId: id,
            inventoryItemName: result.item.name,
            sku: result.item.sku || undefined,
            previousStock: result.previousStock,
            adjustedStock: result.item.currentStock,
            adjustmentQuantity: result.adjustment,
            adjustmentType: result.adjustment > 0 ? "INCREASE" : "DECREASE",
            reason: reason as any,
            description: notes,
            unitCost: result.item.costPrice?.toNumber(),
            totalValueImpact: result.item.costPrice
                ? result.item.costPrice.toNumber() * Math.abs(result.adjustment)
                : 0,
            requiresApproval: Math.abs(result.adjustment) > 100,
            variance,
            variancePercentage,
            createdBy: userId,
            createdAt: result.movement.createdAt.toISOString(),
            userId,
            stockStatus,
            alertsTriggered: [],
        });
    } catch (error) {
        logger.error(
            "Failed to publish stock adjusted event",
            undefined,
            LogCategory.BUSINESS,
            { error, itemId: id }
        );
    }

    logger.info("Stock adjusted successfully", LogCategory.BUSINESS, {
        userId,
        itemId: id,
        adjustment: result.adjustment,
    });

    const response = new CustomResponse(200, "Stock adjusted successfully", {
        item: result.item,
        movement: result.movement,
        adjustment: result.adjustment,
    });
    res.status(response.statusCode).json(response);
});
