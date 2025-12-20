import express from "express";
import {
    getUserById,
    getUsers,
    getUserSession,
    terminateUserSession,
    toggleUserStatus,
    updateUserRole,
} from "../controllers/userController";
import { authenticate, authorize } from "@repo/common-backend/middleware";
import {
    validatePagination,
    validateUserId,
} from "@repo/common-backend/validators";

const router = express.Router();

router
    .route("/")
    .get(
        authenticate,
        authorize(["OWNER", "MANAGER"]),
        validatePagination,
        getUsers
    );

router
    .route("/sessions/:sessionId")
    .delete(authenticate, authorize(["OWNER"]), terminateUserSession);

router
    .route("/:id")
    .get(
        authenticate,
        authorize(["OWNER", "MANAGER"]),
        validateUserId,
        getUserById
    );

router
    .route("/:id/role")
    .put(authenticate, authorize(["OWNER"]), validateUserId, updateUserRole);

router
    .route("/:id/status")
    .put(authenticate, authorize(["OWNER"]), validateUserId, toggleUserStatus);

router
    .route("/:id/sessions")
    .get(
        authenticate,
        authorize(["OWNER", "MANAGER"]),
        validateUserId,
        getUserSession
    );

export default router;
