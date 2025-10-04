import express from "express";
import {
    changePassword,
    getProfile,
    login,
    logout,
    register,
    updateProfile,
} from "../controllers/authController";
import { authenticate } from "@repo/common-backend/middleware";
import {
    validateLogin,
    validateRegister,
    validateUpdateProfile,
} from "@repo/common-backend/validators";

const router = express.Router();

router.route("/login").post(validateLogin, login);
router.route("/register").post(validateRegister, register);
router.route("/logout").post(authenticate, logout);
router.route("/getProfile").get(authenticate, getProfile);
router
    .route("/updateProfile")
    .post(authenticate, validateUpdateProfile, updateProfile);
router.route("/changePassword").post(authenticate, changePassword);

export default router;
