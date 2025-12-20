import express from "express";
import {
    createParty,
    getParties,
    getPartyById,
    updateParty,
    deleteParty,
    getPartyLedger,
    getPartyStatement,
    getPartyAnalytics,
    getPartyPerformance,
    getPartyComparison,
    getPartyInvoices,
    getPartyOutstanding,
    getTopParties,
} from "../controllers/partyController";
import { authenticate } from "@repo/common-backend/middleware";
import {
    validateCreateParty,
    validateUpdateParty,
    validateGetParties,
    validatePartyLedger,
} from "@repo/common-backend/validators";

const router = express.Router();

// Party CRUD operations
router.get("/", authenticate, validateGetParties, getParties);
router.post("/", authenticate, validateCreateParty, createParty);
router.get("/analytics", authenticate, getPartyAnalytics);
router.get("/analytics/top", authenticate, getTopParties);
router.get("/comparison", authenticate, getPartyComparison);

router.get("/:id", authenticate, getPartyById);
router.put("/:id", authenticate, validateUpdateParty, updateParty);
router.delete("/:id", authenticate, deleteParty);
router.get("/:id/invoices", authenticate, getPartyInvoices);
router.get("/:id/outstanding", authenticate, getPartyOutstanding);

// Party ledger and statements
router.get("/:id/ledger", authenticate, validatePartyLedger, getPartyLedger);
router.get("/:id/statement", authenticate, getPartyStatement);

// Analytics endpoints
router.get("/:id/performance", authenticate, getPartyPerformance);

export default router;
