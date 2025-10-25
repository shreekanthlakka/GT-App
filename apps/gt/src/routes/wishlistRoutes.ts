// ========================================
// apps/ecommerce/src/routes/wishlistRoutes.ts
// ========================================
import express from "express";
import {
    getWishlist,
    addToWishlist,
    removeFromWishlist,
    bulkAddToWishlist,
    clearWishlist,
} from "../controllers/wishlistController";
import { authenticate } from "@repo/common-backend/middleware";

const router = express.Router();

// Wishlist operations
router.get("/", authenticate, getWishlist);
router.post("/items", authenticate, addToWishlist);
router.delete("/items/:itemId", authenticate, removeFromWishlist);
router.post("/bulk-add", authenticate, bulkAddToWishlist);
router.delete("/clear", authenticate, clearWishlist);

export default router;
