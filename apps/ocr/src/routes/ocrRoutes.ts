import { authenticate, upload } from "@repo/common-backend/middleware";
import express from "express";
import {
    approveOCRData,
    deleteOCRDocument,
    getAllOCRDocuments,
    getOCRAnalytics,
    getOCRStatus,
    rejectOCRData,
    retryOCRProcessing,
    reviewOCRData,
    uploadDocument,
} from "../controllers/ocrController";

const router = express.Router();

// ========================================
// OCR DOCUMENT ROUTES
// ========================================

/**
 * @route   POST /api/v1/ocr/upload
 * @desc    Upload document for OCR processing
 * @access  Private
 * @body    {
 *            document: File,
 *            documentType: "invoice" | "invoice_payment" | "sale_receipt"
 *          }
 * @returns {
 *            ocrId: string,
 *            imageUrl: string,
 *            status: "PROCESSING",
 *            message: string
 *          }
 */
router.post("/upload", authenticate, upload.single("document"), uploadDocument);

/**
 * @route   GET /api/ocr/:id
 * @desc    Get OCR processing status and extracted data
 * @access  Private
 * @returns {
 *            ocrData: {
 *              id, imageUrl, status, confidence,
 *              extractedData, qualityCheck, duplicateCheck,
 *              fieldConfidence, lowConfidenceFields, invalidFields
 *            }
 *          }
 */
router.get("/:id", authenticate, getOCRStatus);

/**
 * @route   GET /api/ocr
 * @desc    Get all OCR documents with filtering and pagination
 * @access  Private
 * @query   {
 *            page?: number,
 *            limit?: number,
 *            status?: OCRStatus,
 *            documentType?: string,
 *            startDate?: string (ISO),
 *            endDate?: string (ISO),
 *            sortBy?: "createdAt" | "updatedAt" | "confidence",
 *            sortOrder?: "asc" | "desc"
 *          }
 * @returns {
 *            documents: OCRData[],
 *            pagination: { total, page, limit, pages }
 *          }
 */
router.get("/", authenticate, getAllOCRDocuments);

/**
 * @route   PUT /api/ocr/:id/review
 * @desc    Review and correct OCR extracted data
 * @access  Private
 * @body    {
 *            correctedData: Record<string, any>,
 *            notes?: string,
 *            acceptDuplicate?: boolean
 *          }
 * @returns { ocrData: OCRData }
 */
router.put("/:id/review", authenticate, reviewOCRData);

/**
 * @route   POST /api/ocr/:id/approve
 * @desc    Approve OCR data and optionally create record
 * @access  Private
 * @body    {
 *            createRecord: boolean,
 *            documentType: "invoice" | "invoice_payment" | "sale_receipt"
 *          }
 * @returns {
 *            ocrData: OCRData,
 *            createdRecordId?: string,
 *            createdRecordType?: string
 *          }
 */
router.post("/:id/approve", authenticate, approveOCRData);

/**
 * @route   POST /api/ocr/:id/reject
 * @desc    Reject OCR data
 * @access  Private
 * @body    { reason: string }
 * @returns { ocrData: OCRData }
 */
router.post("/:id/reject", authenticate, rejectOCRData);

/**
 * @route   POST /api/ocr/:id/retry
 * @desc    Retry failed OCR processing
 * @access  Private
 * @body    { documentType: string }
 * @returns { ocrId: string, status: "PROCESSING" }
 */
router.post("/:id/retry", authenticate, retryOCRProcessing);

/**
 * @route   DELETE /api/ocr/:id
 * @desc    Delete OCR document (only if not linked to records)
 * @access  Private
 * @returns { message: "OCR document deleted successfully" }
 */
router.delete("/:id", authenticate, deleteOCRDocument);

/**
 * @route   GET /api/ocr/analytics/summary
 * @desc    Get OCR analytics and statistics
 * @access  Private
 * @query   {
 *            startDate?: string (ISO),
 *            endDate?: string (ISO)
 *          }
 * @returns {
 *            period: { startDate, endDate },
 *            summary: {
 *              totalDocuments,
 *              averageConfidence,
 *              averageProcessingTime,
 *              qualityIssuesDetected,
 *              duplicatesDetected,
 *              validationFailures,
 *              statusBreakdown
 *            }
 *          }
 */
router.get("/analytics/summary", authenticate, getOCRAnalytics);

export default router;
