// // notification-service/src/routes/templateRoutes.ts
// import express from "express";
// import {
//     createTemplate,
//     getTemplates,
//     getTemplateById,
//     updateTemplate,
//     deleteTemplate,
//     testTemplate,
//     sendTestNotification,
//     duplicateTemplate,
//     getTemplateStats,
//     bulkUpdateTemplates,
//     exportTemplates,
// } from "../controllers/templateController";
// import { authenticate } from "@repo/common-backend/middleware";

// const router = express.Router();

// // Template CRUD operations
// router.get("/", authenticate, getTemplates); // GET /api/v1/templates
// router.post("/", authenticate, createTemplate); // POST /api/v1/templates
// router.get("/export", authenticate, exportTemplates); // GET /api/v1/templates/export
// router.post("/bulk", authenticate, bulkUpdateTemplates); // POST /api/v1/templates/bulk

// router.get("/:id", authenticate, getTemplateById); // GET /api/v1/templates/:id
// router.put("/:id", authenticate, updateTemplate); // PUT /api/v1/templates/:id
// router.delete("/:id", authenticate, deleteTemplate); // DELETE /api/v1/templates/:id

// // Template testing and preview
// router.post("/:id/test", authenticate, testTemplate); // POST /api/v1/templates/:id/test
// router.post(
//     "/:id/send-test",
//     authenticate,
//     rateLimiter(5, 15),
//     sendTestNotification
// ); // POST /api/v1/templates/:id/send-test

// // Template utilities
// router.post("/:id/duplicate", authenticate, duplicateTemplate); // POST /api/v1/templates/:id/duplicate
// router.get("/:id/stats", authenticate, getTemplateStats); // GET /api/v1/templates/:id/stats

// export default router;

// notification-service/src/routes/templateRoutes.ts
import express from "express";
import {
    createTemplate,
    getTemplates,
    getTemplateById,
    updateTemplate,
    deleteTemplate,
    testTemplate,
    duplicateTemplate,
    bulkUpdateTemplates,
    exportTemplates,
} from "../controllers/templateController";
import {
    validateCreateTemplate,
    validateUpdateTemplate,
    validateGetTemplates,
    validateTestTemplate,
    validateDuplicateTemplate,
    validateBulkUpdateTemplates,
    validateExportTemplates,
} from "@repo/common-backend/validators";
import { authenticate } from "@repo/common-backend/middleware";
import { rateLimiter } from "@repo/common-backend/utils";

const router = express.Router();

// Template CRUD operations
router.get("/", authenticate, validateGetTemplates, getTemplates);
router.post("/", authenticate, validateCreateTemplate, createTemplate);
router.get("/export", authenticate, validateExportTemplates, exportTemplates);
router.post(
    "/bulk",
    authenticate,
    validateBulkUpdateTemplates,
    bulkUpdateTemplates
);

router.get("/:id", authenticate, getTemplateById);
router.put("/:id", authenticate, validateUpdateTemplate, updateTemplate);
router.delete("/:id", authenticate, deleteTemplate);

// Template utilities
router.post(
    "/:id/test",
    authenticate,
    rateLimiter(5, 15),
    validateTestTemplate,
    testTemplate
);
router.post(
    "/:id/duplicate",
    authenticate,
    validateDuplicateTemplate,
    duplicateTemplate
);

export default router;
