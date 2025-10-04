// apps/accounts/src/routes/invoiceRoutes.ts
import express from "express";
import {
    createInvoice,
    getInvoices,
    getInvoiceById,
    updateInvoice,
    deleteInvoice,
    markInvoiceAsPaid,
    getOverdueInvoices,
    getInvoiceAnalytics,
    getPaymentTimingAnalysis,
} from "../controllers/invoiceController";
import { authenticate } from "@repo/common-backend/middleware";
import {
    validateCreateInvoice,
    validateUpdateInvoice,
    validateGetInvoices,
    validateMarkInvoiceAsPaid,
} from "@repo/common-backend/validators";
import { rateLimiter } from "@repo/common-backend/utils";

const router = express.Router();

// Invoice CRUD operations
router.get("/", authenticate, validateGetInvoices, getInvoices);
router.post("/", authenticate, validateCreateInvoice, createInvoice);
router.get("/overdue", authenticate, getOverdueInvoices);
router.get("/:id", authenticate, getInvoiceById);
router.put("/:id", authenticate, validateUpdateInvoice, updateInvoice);
router.delete("/:id", authenticate, deleteInvoice);

// Invoice actions
router.post(
    "/:id/mark-paid",
    authenticate,
    rateLimiter(10, 15), // 10 requests per 15 minutes
    validateMarkInvoiceAsPaid,
    markInvoiceAsPaid
);

// Analytics endpoints
router.get("/analytics", authenticate, getInvoiceAnalytics);
router.get("/payment-timing", authenticate, getPaymentTimingAnalysis);

export default router;
