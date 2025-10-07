// apps/accounts/src/routes/inventoryRoutes.ts

import { Router } from "express";
import { authenticate } from "@repo/common-backend/middleware";
import * as inventoryController from "../controllers/inventoryController";
import * as validators from "@repo/common-backend/validators";

const router = Router();

// CRUD
router.get(
    "/",
    authenticate,
    validators.validateInventoryItemQuery,
    inventoryController.getAllInventoryItems
);
router.post(
    "/",
    authenticate,
    validators.validateCreateInventoryItem,
    inventoryController.createInventoryItem
);
router.get(
    "/:id",
    authenticate,
    validators.validateIdParam,
    inventoryController.getInventoryItemById
);
router.put(
    "/:id",
    authenticate,
    validators.validateIdParam,
    validators.validateUpdateInventoryItem,
    inventoryController.updateInventoryItem
);
router.delete(
    "/:id",
    authenticate,
    validators.validateIdParam,
    inventoryController.deleteInventoryItem
);

// Stock Operations
router.post(
    "/:id/add-stock",
    authenticate,
    validators.validateIdParam,
    validators.validateAddStock,
    inventoryController.addStock
);
router.post(
    "/:id/reduce-stock",
    authenticate,
    validators.validateIdParam,
    validators.validateReduceStock,
    inventoryController.reduceStock
);
router.post(
    "/:id/adjust-stock",
    authenticate,
    validators.validateIdParam,
    validators.validateAdjustStock,
    inventoryController.adjustStock
);

// Analytics
router.get(
    "/analytics/summary",
    authenticate,
    inventoryController.getInventoryAnalytics
);
router.get(
    "/analytics/low-stock",
    authenticate,
    validators.validateLowStockQuery,
    inventoryController.getLowStockItems
);

// Movements
router.get(
    "/movements/history",
    authenticate,
    validators.validateStockMovementHistory,
    inventoryController.getStockMovementHistory
);

// Search
router.get(
    "/search/pos",
    authenticate,
    validators.validatePOSSearch,
    inventoryController.searchInventory
);
router.get(
    "/search/lookup",
    authenticate,
    validators.validateLookup,
    inventoryController.getInventoryBySkuOrBarcode
);

export default router;
