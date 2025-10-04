// apps/accounts/src/middleware/inventoryMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { CustomError } from "@repo/common-backend/utils";
import { InventoryService } from "../services/inventoryService";

/**
 * Middleware to check stock before processing sale
 */
export const checkStockAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const userId = req.user?.userId;
        const { items } = req.body;

        if (!userId || !items || !Array.isArray(items)) {
            return next();
        }

        const itemsToCheck = items
            .filter((item: any) => item.inventoryItemId)
            .map((item: any) => ({
                inventoryItemId: item.inventoryItemId,
                quantity: item.quantity,
                itemName: item.itemName,
            }));

        if (itemsToCheck.length === 0) {
            return next();
        }

        const stockCheck = await InventoryService.checkStockAvailability(
            itemsToCheck,
            userId
        );

        if (!stockCheck.available) {
            throw new CustomError(
                400,
                `Insufficient stock:\n${stockCheck.insufficientItems.join("\n")}`
            );
        }

        next();
    } catch (error) {
        next(error);
    }
};
