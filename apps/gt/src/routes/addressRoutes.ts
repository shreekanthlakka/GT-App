// ========================================
// apps/ecommerce/src/routes/addressRoutes.ts
// ========================================
import express from "express";
import {
    getAddresses,
    getAddressById,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress,
} from "../controllers/addressController";
import { authenticate } from "@repo/common-backend/middleware";

const router = express.Router();

// Address CRUD
router.get("/", authenticate, getAddresses);
router.post("/", authenticate, createAddress);
router.get("/:id", authenticate, getAddressById);
router.put("/:id", authenticate, updateAddress);
router.delete("/:id", authenticate, deleteAddress);

// Set default address
router.put("/:id/set-default", authenticate, setDefaultAddress);

export default router;
