// ========================================
// apps/ecommerce/src/routes/orderRoutes.ts
// ========================================
import express from "express";
import {
    getOrders,
    getOrderById,
    createOrder,
    cancelOrder,
    returnOrder,
    trackOrder,
} from "../controllers/orderController";
import { authenticate } from "@repo/common-backend/middleware";

const router = express.Router();

// Order operations
router.get("/", authenticate, getOrders);
router.post("/", authenticate, createOrder);
router.get("/:id", authenticate, getOrderById);
router.put("/:id/cancel", authenticate, cancelOrder);
router.post("/:id/return", authenticate, returnOrder);
router.get("/:id/track", authenticate, trackOrder);

export default router;
