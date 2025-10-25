import express from "express";
import {
    createReview,
    updateReview,
    deleteReview,
    getProductReviews,
    getUserReviews,
} from "../controllers/reviewController";
import { authenticate } from "@repo/common-backend/middleware";

const router = express.Router();

// Review operations
router.post("/", authenticate, createReview);
router.put("/:id", authenticate, updateReview);
router.delete("/:id", authenticate, deleteReview);

// Query reviews
router.get("/product/:inventoryItemId", getProductReviews);
router.get("/my-reviews", authenticate, getUserReviews);

export default router;
