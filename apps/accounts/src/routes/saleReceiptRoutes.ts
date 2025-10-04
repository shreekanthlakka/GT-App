// apps/accounts/src/routes/saleReceiptRoutes.ts
import express from "express";
import {
    createSaleReceipt,
    getSaleReceipts,
    getSaleReceiptById,
    updateSaleReceipt,
    deleteSaleReceipt,
    getReceiptSummary,
} from "../controllers/saleReceiptController";
import { authenticate } from "@repo/common-backend/middleware";
import {
    validateCreateSaleReceipt,
    validateUpdateSaleReceipt,
} from "@repo/common-backend/validators";
import { rateLimiter } from "@repo/common-backend/utils";

const router = express.Router();

// Sale Receipt CRUD operations
router.get("/", authenticate, getSaleReceipts);
router.post(
    "/",
    authenticate,
    rateLimiter(20, 15), // 20 receipts per 15 minutes
    validateCreateSaleReceipt,
    createSaleReceipt
);
router.get("/summary", authenticate, getReceiptSummary);
router.get("/:id", authenticate, getSaleReceiptById);
router.put("/:id", authenticate, validateUpdateSaleReceipt, updateSaleReceipt);
router.delete("/:id", authenticate, deleteSaleReceipt);

export default router;
