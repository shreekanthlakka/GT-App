// notification-service/src/routes/dashboardRoutes.ts
import express from "express";
import {
    getDashboardStats,
    getChannelPerformance,
    getCostAnalytics,
    getFailureAnalysis,
    getDeliveryTrends,
    getRecentActivity,
    getTopTemplates,
} from "../controllers/dashboardController";
import {
    validateDashboardStats,
    validateChannelPerformance,
    validateCostAnalytics,
    validateFailureAnalysis,
    validateDeliveryTrends,
    validateRecentActivity,
    validateTopTemplates,
} from "@repo/common-backend/validators";
import { authenticate } from "@repo/common-backend/middleware";

const router = express.Router();

router.get("/stats", authenticate, validateDashboardStats, getDashboardStats);
router.get(
    "/channel-performance",
    authenticate,
    validateChannelPerformance,
    getChannelPerformance
);
router.get(
    "/cost-analytics",
    authenticate,
    validateCostAnalytics,
    getCostAnalytics
);
router.get(
    "/failure-analysis",
    authenticate,
    validateFailureAnalysis,
    getFailureAnalysis
);
router.get(
    "/delivery-trends",
    authenticate,
    validateDeliveryTrends,
    getDeliveryTrends
);
router.get(
    "/recent-activity",
    authenticate,
    validateRecentActivity,
    getRecentActivity
);
router.get(
    "/top-templates",
    authenticate,
    validateTopTemplates,
    getTopTemplates
);

export default router;
