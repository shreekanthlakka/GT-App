// ========================================
// apps/ecommerce/src/routes/profileRoutes.ts
// ========================================
import express from "express";
import {
    getProfile,
    updateProfile,
    updatePreferences,
    deleteAccount,
} from "../controllers/profileController";
import { authenticate } from "@repo/common-backend/middleware";

const router = express.Router();

// Profile routes
router.get("/", authenticate, getProfile);
router.put("/", authenticate, updateProfile);
router.put("/preferences", authenticate, updatePreferences);
router.delete("/", authenticate, deleteAccount);

export default router;
