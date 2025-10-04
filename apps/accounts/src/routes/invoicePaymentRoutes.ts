// apps/accounts/src/routes/invoicePaymentRoutes.ts
import express from "express";
import {
    createInvoicePayment,
    getInvoicePayments,
    getInvoicePaymentById,
    updateInvoicePayment,
    deleteInvoicePayment,
    getPaymentSummary,
    getPaymentAnalytics,
    getCashFlowAnalysis,
} from "../controllers/invoicePaymentController";
import { authenticate } from "@repo/common-backend/middleware";
import {
    validateCreateInvoicePayment,
    validateUpdateInvoicePayment,
    validateGetInvoicePayments,
    validatePaymentSummary,
} from "@repo/common-backend/validators";
import { rateLimiter } from "@repo/common-backend/utils";

const router = express.Router();

// Invoice Payment CRUD operations
router.get("/", authenticate, validateGetInvoicePayments, getInvoicePayments);
router.post(
    "/",
    authenticate,
    rateLimiter(20, 15), // 20 payments per 15 minutes
    validateCreateInvoicePayment,
    createInvoicePayment
);
router.get("/summary", authenticate, validatePaymentSummary, getPaymentSummary);
router.get("/:id", authenticate, getInvoicePaymentById);
router.put(
    "/:id",
    authenticate,
    validateUpdateInvoicePayment,
    updateInvoicePayment
);
router.delete("/:id", authenticate, deleteInvoicePayment);

// Analytics endpoints
router.get("/analytics", authenticate, getPaymentAnalytics);
router.get("/cash-flow", authenticate, getCashFlowAnalysis);

export default router;
