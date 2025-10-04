import express from "express";
import { login, logout, register } from "../controllers/ecommAuthController";
import {
    validateEcommerceLogin,
    validateEcommerceRegister,
} from "@repo/common-backend/ecommValidators";
import { authenticate } from "@repo/common-backend/middleware";

const router = express.Router();

router.route("/login").post(validateEcommerceLogin, login);
router.route("/register").post(validateEcommerceRegister, register);
router.route("/logout").post(authenticate, logout);

export default router;
