// // notification-service/src/routes/notificationRoutes.ts
// import express from "express";
// import {
//     getNotifications,
//     getNotificationById,
//     markAsRead,
//     resendNotification,
//     getNotificationStats,
// } from "../controllers/notificationController";
// import { authenticate } from "@repo/common-backend/middleware";
// import { validateNotificationPreferences } from "@repo/common-backend/ecommValidators";

// const router = express.Router();

// router.get("/", authenticate, getNotifications);
// router.get("/stats", authenticate, getNotificationStats);
// router.get("/:id", authenticate, getNotificationById);
// router.post("/:id/mark-read", authenticate, markAsRead);
// router.post("/:id/resend", authenticate, resendNotification);

// export default router;

// notification-service/src/routes/notificationRoutes.ts
import express from "express";
import {
    getNotifications,
    getNotificationById,
    updateNotification,
    deleteNotification,
    markAsRead,
    resendNotification,
    bulkUpdateNotifications,
    searchNotifications,
    getNotificationStats,
} from "../controllers/notificationController";
import {
    validateGetNotifications,
    validateUpdateNotification,
    validateBulkUpdateNotifications,
    validateSearchNotifications,
    validateNotificationStats,
} from "@repo/common-backend/validators";
import { authenticate } from "@repo/common-backend/middleware";

const router = express.Router();

// Notification CRUD operations
router.get("/", authenticate, validateGetNotifications, getNotifications);
router.get(
    "/search",
    authenticate,
    validateSearchNotifications,
    searchNotifications
);
router.get(
    "/stats",
    authenticate,
    validateNotificationStats,
    getNotificationStats
);
router.get("/:id", authenticate, getNotificationById);
router.put(
    "/:id",
    authenticate,
    validateUpdateNotification,
    updateNotification
);
router.delete("/:id", authenticate, deleteNotification);

// Notification actions
router.post("/:id/mark-read", authenticate, markAsRead);
router.post("/:id/resend", authenticate, resendNotification);
router.patch(
    "/bulk",
    authenticate,
    validateBulkUpdateNotifications,
    bulkUpdateNotifications
);

export default router;
