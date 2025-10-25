// ========================================
// apps/ecommerce/src/routes/cartRoutes.ts
// ========================================
import express from "express";
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    bulkUpdateCart,
} from "../controllers/cartController";
import { authenticate } from "@repo/common-backend/middleware";

const router = express.Router();

// Cart operations
router.get("/", authenticate, getCart);
router.post("/items", authenticate, addToCart);
router.put("/items/:itemId", authenticate, updateCartItem);
router.delete("/items/:itemId", authenticate, removeFromCart);
router.delete("/clear", authenticate, clearCart);
router.post("/bulk-update", authenticate, bulkUpdateCart);

export default router;
