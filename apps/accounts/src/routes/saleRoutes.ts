// apps/accounts/src/routes/salesRoutes.ts
import express from "express";
import {
    createSale,
    getSales,
    getSaleById,
    updateSale,
    deleteSale,
    markSaleAsPaid,
    getSalesSummary,
    getSalesAnalytics,
    getSalesPerformance,
} from "../controllers/salesController";
import { authenticate } from "@repo/common-backend/middleware";
import {
    validateCreateSale,
    validateUpdateSale,
    validateGetSales,
    validateMarkSaleAsPaid,
    validateSalesSummary,
} from "@repo/common-backend/validators";
import { rateLimiter } from "@repo/common-backend/utils";
import { searchInventoryForSale } from "../controllers/invoiceController";

const router = express.Router();

// Sale CRUD operations
router.get("/", authenticate, validateGetSales, getSales);
router.post("/", authenticate, validateCreateSale, createSale);
router.get("/summary", authenticate, validateSalesSummary, getSalesSummary);
router.get("/:id", authenticate, getSaleById);
router.put("/:id", authenticate, validateUpdateSale, updateSale);
router.delete("/:id", authenticate, deleteSale);

// Sale actions
router.post(
    "/:id/mark-paid",
    authenticate,
    rateLimiter(10, 15), // 10 requests per 15 minutes
    validateMarkSaleAsPaid,
    markSaleAsPaid
);

// Analytics endpoints
router.get("/analytics", authenticate, getSalesAnalytics);
router.get("/performance", authenticate, getSalesPerformance);
router.get("/search-inventory", authenticate, searchInventoryForSale);

export default router;
