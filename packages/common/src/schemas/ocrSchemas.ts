// packages/common/src/schemas/ocr.schemas.ts

import { z } from "zod";
export const OCRStatusSchema = z.enum([
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "MANUAL_REVIEW",
    "CANCELLED",
]);

export const UploadDocumentSchema = z.object({
    originalName: z.string().min(1, "Original filename is required"),
    fileSize: z.number().min(1, "File size must be greater than 0"),
    mimeType: z.string().min(1, "MIME type is required"),
});

export const ProcessOCRSchema = z.object({
    imageUrl: z.string().url("Invalid image URL"),
    documentType: z.enum(["INVOICE", "RECEIPT", "PAYMENT", "OTHER"]).optional(),
    autoProcess: z.boolean().default(true),
});

export const ValidateOCRSchema = z.object({
    extractedData: z.record(
        z.string(),
        z.union([z.string(), z.number(), z.boolean()])
    ),
    confidence: z.number().min(0).max(1),
    manualCorrections: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
});

export const OCRQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: OCRStatusSchema.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

// ========================================
// 📄 OCR SCHEMAS
// ========================================

// export const OCRStatusSchema = z.enum([
//     "PROCESSING",
//     "COMPLETED",
//     "FAILED",
//     "MANUAL_REVIEW",
//     "CANCELLED",
// ]);

export const CreateOCRJobSchema = z.object({
    imageUrl: z.string().url("Invalid image URL"),
    originalName: z.string().optional(),
    fileSize: z.number().min(0).optional(),
    // Relations - optional, can be linked later
    invoiceId: z.string().cuid().optional(),
    paymentId: z.string().cuid().optional(),
    receiptId: z.string().cuid().optional(),
});

export type UploadDocumentType = z.infer<typeof UploadDocumentSchema>;
export type ProcessOCRType = z.infer<typeof ProcessOCRSchema>;
export type ValidateOCRType = z.infer<typeof ValidateOCRSchema>;
export type OCRQueryType = z.infer<typeof OCRQuerySchema>;
export type CreateOCRJobType = z.infer<typeof CreateOCRJobSchema>;
