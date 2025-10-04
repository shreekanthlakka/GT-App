// apps/accounts/src/routes/customerRoutes.ts
import express from "express";
import {
    createCustomer,
    getCustomers,
    getCustomerById,
    updateCustomer,
    deleteCustomer,
    getCustomerLedger,
    getCustomerStatement,
    getCustomerAnalytics,
    getCustomerLifetimeValue,
} from "../controllers/customerController";
import { authenticate } from "@repo/common-backend/middleware";
import {
    validateCreateCustomer,
    validateUpdateCustomer,
    validateGetCustomers,
    validateCustomerLedger,
} from "@repo/common-backend/validators";

const router = express.Router();

// Customer CRUD operations
router.get("/", authenticate, validateGetCustomers, getCustomers);
router.post("/", authenticate, validateCreateCustomer, createCustomer);
router.get("/:id", authenticate, getCustomerById);
router.put("/:id", authenticate, validateUpdateCustomer, updateCustomer);
router.delete("/:id", authenticate, deleteCustomer);

// Customer ledger and statements
router.get(
    "/:id/ledger",
    authenticate,
    validateCustomerLedger,
    getCustomerLedger
);
router.get("/:id/statement", authenticate, getCustomerStatement);

// Analytics endpoints
router.get("/analytics", authenticate, getCustomerAnalytics);
router.get("/:id/lifetime-value", authenticate, getCustomerLifetimeValue);

export default router;
