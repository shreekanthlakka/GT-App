// apps/ocr/src/services/ocrService.ts
// COMPLETE FINAL VERSION with proper type annotations

import { prisma, OCRStatus, DocumentType } from "@repo/db/prisma";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { Prisma } from "@prisma/client";
import {
    OCRJobStartedPublisher,
    OCRJobCompletedPublisher,
    OCRJobFailedPublisher,
    OCRDataExtractedPublisher,
    OCRManualReviewRequiredPublisher,
} from "./apps/ocr/src/events/publishers/ocrPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import Tesseract from "tesseract.js";
import vision from "@google-cloud/vision";
import {
    CustomError,
    generateInvoicePaymentVoucherId,
    generateInvoiceVoucherId,
    generateSaleReceiptVoucherId,
} from "@repo/common-backend/utils";
import Fuse from "fuse.js";
import { FileUploadService } from "./apps/ocr/src/services/fileUploadService";

// Initialize Google Cloud Vision client
const visionClient = new vision.ImageAnnotatorClient({
    keyFilename: process.env.GOOGLE_CLOUD_KEY_PATH,
});

// ========================================
// TYPE DEFINITIONS
// ========================================
interface DuplicateCheckResult {
    isDuplicate: boolean;
    duplicateOCRId?: string;
    duplicateDate?: Date;
    similarity?: number;
}

interface FieldConfidence {
    field: string;
    value: any;
    confidence: number;
    needsReview: boolean;
    validationPassed: boolean;
    validationErrors?: string[];
}

interface ParsedDataWithConfidence {
    fields: FieldConfidence[];
    overallConfidence: number;
    highConfidenceFields: string[];
    lowConfidenceFields: string[];
    invalidFields: string[];
}

interface FuzzyMatchResult {
    matched: boolean;
    matchedEntity: any;
    confidence: number;
    matchType: "exact" | "fuzzy" | "none";
    suggestions: Array<{ entity: any; score: number }>;
}

interface ImageQualityResult {
    isGoodQuality: boolean;
    score: number;
    issues: string[];
    warnings: string[];
    recommendations: string[];
}

type OCRDataResult = Prisma.oCRDataGetPayload<{
    select: {
        id: true;
        imageUrl: true;
        originalName: true;
        fileSize: true;
        extractedData: true;
        processedData: true;
        confidence: true;
        status: true;
        errorMessage: true;
        invoiceId: true;
        invoicePaymentId: true;
        saleReceiptId: true;
        userId: true;
        createdAt: true;
        updatedAt: true;
    };
}>;

export class OCRService {
    // ========================================
    // MAIN PROCESSING WITH ALL 5 FEATURES
    // ========================================
    static async processDocument(
        ocrId: string,
        imageUrl: string,
        documentType: DocumentType,
        userId: string
    ): Promise<OCRDataResult | void> {
        try {
            logger.info("Starting OCR processing", LogCategory.OCR, {
                ocrId,
                imageUrl,
                documentType,
            });
            // FEATURE 4: Image Quality Pre-check
            const qualityCheck = await this.checkImageQuality(imageUrl);
            if (!qualityCheck.isGoodQuality) {
                await prisma.oCRData.update({
                    where: { id: ocrId },
                    data: {
                        status: OCRStatus.MANUAL_REVIEW,
                        extractedData: {
                            qualityCheck,
                            message:
                                "Low image quality detected. Manual review required.",
                        },
                    },
                });

                // Publish Manual Review Required
                const reviewPublisher = new OCRManualReviewRequiredPublisher(
                    kafkaWrapper.producer
                );
                await reviewPublisher.publish({
                    jobId: ocrId,
                    reason: "Low image quality",
                    reviewPriority: "HIGH",
                    lowConfidenceFields: [],
                    invalidFields: [],
                    qualityIssues: qualityCheck.issues,
                    requiresReview: true,
                    userId,
                });

                logger.warn("Poor image quality detected", LogCategory.OCR, {
                    ocrId,
                    qualityScore: qualityCheck.score,
                    issues: qualityCheck.issues,
                });

                return;
            }

            // Extract text from image
            const extractedText = await this.extractTextFromImage(imageUrl);

            // FEATURE 2: Parse with per-field confidence
            const parsedDataWithConfidence =
                await this.parseWithFieldConfidence(
                    extractedText,
                    documentType,
                    userId
                );

            // Publish Data Extracted Event
            const dataExtractedPublisher = new OCRDataExtractedPublisher(
                kafkaWrapper.producer
            );
            await dataExtractedPublisher.publish({
                jobId: ocrId,
                documentType,
                extractedData: {
                    fields: parsedDataWithConfidence.fields,
                    rawText: extractedText,
                },
                confidence: parsedDataWithConfidence.overallConfidence,
                requiresReview:
                    parsedDataWithConfidence.lowConfidenceFields.length > 0,
                extractedAt: new Date().toISOString(),
                userId,
            });

            // FEATURE 5: Validate extracted data
            const validatedData = await this.validateExtractedData(
                parsedDataWithConfidence,
                documentType
            );

            // FEATURE 1: Check for duplicates
            const duplicateCheck = await this.checkForDuplicates(
                validatedData,
                documentType,
                userId
            );

            if (duplicateCheck.isDuplicate) {
                // Publish Manual Review Required for duplicate
                const reviewPublisher = new OCRManualReviewRequiredPublisher(
                    kafkaWrapper.producer
                );
                await reviewPublisher.publish({
                    jobId: ocrId,
                    reason: "Duplicate document detected",
                    reviewPriority: "MEDIUM",
                    lowConfidenceFields: validatedData.lowConfidenceFields,
                    invalidFields: validatedData.invalidFields,
                    duplicateDetected: true,
                    requiresReview: true,
                    userId,
                });

                await prisma.oCRData.update({
                    where: { id: ocrId },
                    data: {
                        status: OCRStatus.MANUAL_REVIEW,
                        extractedData: {
                            ...validatedData,
                            duplicateDetected: true,
                            duplicateOCRId: duplicateCheck.duplicateOCRId,
                            duplicateDate: duplicateCheck.duplicateDate,
                            message: "Possible duplicate document detected",
                        },
                    },
                });

                logger.warn("Duplicate document detected", LogCategory.OCR, {
                    ocrId,
                    duplicateOCRId: duplicateCheck.duplicateOCRId,
                });

                return;
            }

            // ========================================
            // FILE REORGANIZATION AFTER SUCCESSFUL PARSING
            // ========================================
            let finalImageUrl = imageUrl;
            const fields = validatedData.fields.reduce(
                (acc, field) => {
                    acc[field.field] = field.value;
                    return acc;
                },
                {} as Record<string, any>
            );

            // Move file to organized structure if we have entity name
            if (fields.partyName || fields.customerName) {
                try {
                    finalImageUrl =
                        await FileUploadService.moveToOrganizedStructure(
                            imageUrl,
                            documentType,
                            {
                                partyName: fields.partyName,
                                customerName: fields.customerName,
                                invoiceNo: fields.invoiceNo,
                                receiptNo: fields.receiptNo,
                                date: fields.date
                                    ? new Date(fields.date)
                                    : new Date(),
                            }
                        );

                    logger.info(
                        "File moved to organized structure",
                        LogCategory.OCR,
                        {
                            ocrId,
                            oldPath: imageUrl,
                            newPath: finalImageUrl,
                            partyName: fields.partyName,
                            customerName: fields.customerName,
                        }
                    );
                } catch (moveError: any) {
                    logger.warn(
                        "Failed to move file, keeping original path",
                        LogCategory.OCR,
                        {
                            ocrId,
                            error: moveError.message,
                        }
                    );
                    // Continue with original path if move fails
                }
            }

            // Determine if manual review needed
            const needsReview =
                validatedData.overallConfidence < 0.85 ||
                validatedData.lowConfidenceFields.length > 0 ||
                validatedData.invalidFields.length > 0 ||
                qualityCheck.warnings.length > 0;

            // Update OCR record with final image URL
            const updatedOCR = await prisma.oCRData.update({
                where: { id: ocrId },
                data: {
                    imageUrl: finalImageUrl,
                    extractedData: {
                        rawText: extractedText,
                        ...validatedData,
                        qualityCheck,
                        duplicateCheck,
                    },
                    processedData: this.convertToProcessedData(validatedData),
                    confidence: validatedData.overallConfidence,
                    status: needsReview
                        ? OCRStatus.MANUAL_REVIEW
                        : OCRStatus.COMPLETED,
                    updatedAt: new Date(),
                },
            });

            // Publish appropriate completion event
            if (needsReview) {
                // Publish Manual Review Required
                const reviewPublisher = new OCRManualReviewRequiredPublisher(
                    kafkaWrapper.producer
                );
                await reviewPublisher.publish({
                    jobId: ocrId,
                    reason: "Low confidence or validation errors",
                    reviewPriority:
                        validatedData.invalidFields.length > 0
                            ? "HIGH"
                            : "MEDIUM",
                    lowConfidenceFields: validatedData.lowConfidenceFields,
                    invalidFields: validatedData.invalidFields,
                    requiresReview: true,
                    userId,
                });
            } else {
                // Publish Job Completed
                const jobCompletedPublisher = new OCRJobCompletedPublisher(
                    kafkaWrapper.producer
                );
                await jobCompletedPublisher.publish({
                    jobId: ocrId,
                    completedAt: new Date().toISOString(),
                    confidence: validatedData.overallConfidence,
                    status: "COMPLETED",
                    extractedText: extractedText,
                    processingTime: 0,
                    userId,
                });
            }

            logger.info("OCR processing completed", LogCategory.OCR, {
                ocrId,
                overallConfidence: validatedData.overallConfidence,
                needsReview,
                lowConfidenceFields: validatedData.lowConfidenceFields,
                invalidFields: validatedData.invalidFields,
                finalImageUrl,
            });

            return updatedOCR;
        } catch (error: any) {
            logger.error("OCR processing failed", undefined, LogCategory.OCR, {
                ocrId,
                error: error.message,
            });

            await prisma.oCRData.update({
                where: { id: ocrId },
                data: {
                    status: OCRStatus.FAILED,
                    errorMessage: error.message,
                    updatedAt: new Date(),
                },
            });

            // Publish Job Failed Event
            const jobFailedPublisher = new OCRJobFailedPublisher(
                kafkaWrapper.producer
            );
            await jobFailedPublisher.publish({
                jobId: ocrId,
                failedAt: new Date().toISOString(),
                errorMessage: error.message,
                errorType: "OCR_ENGINE_ERROR",
                retryable: true,
                userId,
            });

            throw error;
        }
    }

    // ========================================
    // FEATURE 1: DUPLICATE DETECTION
    // ========================================
    private static async checkForDuplicates(
        parsedData: ParsedDataWithConfidence,
        documentType: string,
        userId: string
    ): Promise<DuplicateCheckResult> {
        try {
            const fields = parsedData.fields.reduce(
                (acc, field) => {
                    acc[field.field] = field.value;
                    return acc;
                },
                {} as Record<string, any>
            );

            if (documentType === "invoice" && fields.invoiceNo) {
                const existingInvoice = await prisma.invoice.findFirst({
                    where: {
                        userId,
                        invoiceNo: fields.invoiceNo,
                    },
                    select: { id: true, createdAt: true },
                });

                if (existingInvoice) {
                    const duplicateOCR = await prisma.oCRData.findFirst({
                        where: { invoiceId: existingInvoice.id },
                        select: { id: true, createdAt: true },
                    });

                    if (duplicateOCR) {
                        return {
                            isDuplicate: true,
                            duplicateOCRId: duplicateOCR.id,
                            duplicateDate: duplicateOCR.createdAt,
                            similarity: 1.0,
                        };
                    }
                }

                const similarOCRs = await prisma.oCRData.findMany({
                    where: {
                        userId,
                        status: {
                            in: [OCRStatus.COMPLETED, OCRStatus.MANUAL_REVIEW],
                        },
                    },
                    select: { id: true, createdAt: true, extractedData: true },
                    take: 10,
                });

                for (const ocr of similarOCRs) {
                    const ocrData = ocr.extractedData as any;
                    if (ocrData.fields && Array.isArray(ocrData.fields)) {
                        const invoiceField = ocrData.fields.find(
                            (f: any) =>
                                f.field === "invoiceNo" &&
                                f.value === fields.invoiceNo
                        );
                        if (invoiceField) {
                            return {
                                isDuplicate: true,
                                duplicateOCRId: ocr.id,
                                duplicateDate: ocr.createdAt,
                                similarity: 1.0,
                            };
                        }
                    }
                }
            }

            if (fields.amount && fields.date) {
                const dateObj = new Date(fields.date);
                const dayBefore = new Date(dateObj);
                dayBefore.setDate(dayBefore.getDate() - 1);
                const dayAfter = new Date(dateObj);
                dayAfter.setDate(dayAfter.getDate() + 1);

                const similarAmountOCRs = await prisma.oCRData.findMany({
                    where: {
                        userId,
                        status: {
                            in: [OCRStatus.COMPLETED, OCRStatus.MANUAL_REVIEW],
                        },
                        createdAt: {
                            gte: dayBefore,
                            lte: dayAfter,
                        },
                    },
                    select: { id: true, createdAt: true, extractedData: true },
                });

                for (const ocr of similarAmountOCRs) {
                    const ocrData = ocr.extractedData as any;
                    if (ocrData.fields && Array.isArray(ocrData.fields)) {
                        const amountField = ocrData.fields.find(
                            (f: any) => f.field === "amount"
                        );
                        if (
                            amountField &&
                            Math.abs(amountField.value - fields.amount) < 10
                        ) {
                            return {
                                isDuplicate: true,
                                duplicateOCRId: ocr.id,
                                duplicateDate: ocr.createdAt,
                                similarity: 0.9,
                            };
                        }
                    }
                }
            }

            return { isDuplicate: false };
        } catch (error: any) {
            logger.error("Duplicate check failed", undefined, LogCategory.OCR, {
                error: error.message,
            });
            return { isDuplicate: false };
        }
    }

    // ========================================
    // FEATURE 2: PER-FIELD CONFIDENCE SCORING
    // ========================================
    private static async parseWithFieldConfidence(
        text: string,
        documentType: string,
        userId: string
    ): Promise<ParsedDataWithConfidence> {
        const lines = text.split("\n").filter((line) => line.trim());
        const fields: FieldConfidence[] = [];

        if (documentType === "invoice") {
            const invoiceNoPattern =
                /(?:invoice|bill|inv)[\s#:]*([A-Z0-9\-\/]+)/i;
            const invoiceMatch = text.match(invoiceNoPattern);
            fields.push({
                field: "invoiceNo",
                value: invoiceMatch ? invoiceMatch[1].trim() : null,
                confidence: invoiceMatch ? 0.95 : 0,
                needsReview: !invoiceMatch,
                validationPassed: true,
            });

            const datePattern =
                /(?:date|dated)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
            const dateMatch = text.match(datePattern);
            const parsedDate = dateMatch ? this.parseDate(dateMatch[1]) : null;
            fields.push({
                field: "date",
                value: parsedDate,
                confidence: dateMatch ? 0.9 : 0,
                needsReview: !dateMatch,
                validationPassed: true,
            });

            const amountPattern =
                /(?:total|amount|grand total)[\s:]*(?:rs\.?|₹)?\s*([0-9,]+\.?\d{0,2})/i;
            const amountMatch = text.match(amountPattern);
            const amount = amountMatch
                ? parseFloat(amountMatch[1].replace(/,/g, ""))
                : null;
            fields.push({
                field: "amount",
                value: amount,
                confidence: amountMatch ? 0.92 : 0,
                needsReview: !amountMatch || amount === null || amount <= 0,
                validationPassed: amount !== null && amount > 0,
            });

            const gstPattern =
                /(?:gstin|gst)[\s:]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1})/i;
            const gstMatch = text.match(gstPattern);
            fields.push({
                field: "partyGST",
                value: gstMatch ? gstMatch[1] : null,
                confidence: gstMatch ? 0.98 : 0.3,
                needsReview: !gstMatch,
                validationPassed: true,
            });

            const partyName = lines.length > 0 ? lines[0].trim() : null;
            const partyMatch = await this.fuzzyMatchParty(partyName, userId);
            fields.push({
                field: "partyName",
                value: partyMatch.matched
                    ? partyMatch.matchedEntity.name
                    : partyName,
                confidence: partyMatch.confidence,
                needsReview:
                    !partyMatch.matched || partyMatch.matchType === "fuzzy",
                validationPassed: partyMatch.matched,
            });
        } else if (documentType === "sale_receipt") {
            const receiptNoPattern = /(?:receipt|rcpt)[\s#:]*([A-Z0-9\-\/]+)/i;
            const receiptMatch = text.match(receiptNoPattern);
            fields.push({
                field: "receiptNo",
                value: receiptMatch ? receiptMatch[1].trim() : null,
                confidence: receiptMatch ? 0.95 : 0,
                needsReview: !receiptMatch,
                validationPassed: true,
            });

            const datePattern =
                /(?:date)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
            const dateMatch = text.match(datePattern);
            const parsedDate = dateMatch ? this.parseDate(dateMatch[1]) : null;
            fields.push({
                field: "date",
                value: parsedDate,
                confidence: dateMatch ? 0.9 : 0,
                needsReview: !dateMatch,
                validationPassed: true,
            });

            const amountPattern =
                /(?:amount|received)[\s:]*(?:rs\.?|₹)?\s*([0-9,]+\.?\d{0,2})/i;
            const amountMatch = text.match(amountPattern);
            const amount = amountMatch
                ? parseFloat(amountMatch[1].replace(/,/g, ""))
                : null;
            fields.push({
                field: "amount",
                value: amount,
                confidence: amountMatch ? 0.92 : 0,
                needsReview: !amountMatch || amount === null || amount <= 0,
                validationPassed: amount !== null && amount > 0,
            });

            const customerName = lines.length > 0 ? lines[0].trim() : null;
            const customerMatch = await this.fuzzyMatchCustomer(
                customerName,
                userId
            );
            fields.push({
                field: "customerName",
                value: customerMatch.matched
                    ? customerMatch.matchedEntity.name
                    : customerName,
                confidence: customerMatch.confidence,
                needsReview:
                    !customerMatch.matched ||
                    customerMatch.matchType === "fuzzy",
                validationPassed: customerMatch.matched,
            });
        } else if (documentType === "invoice_payment") {
            const referencePattern =
                /(?:ref|reference|utr|transaction)[\s#:]*([A-Z0-9]+)/i;
            const referenceMatch = text.match(referencePattern);
            fields.push({
                field: "reference",
                value: referenceMatch ? referenceMatch[1].trim() : null,
                confidence: referenceMatch ? 0.9 : 0,
                needsReview: !referenceMatch,
                validationPassed: true,
            });

            const datePattern =
                /(?:date|paid on)[\s:]*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i;
            const dateMatch = text.match(datePattern);
            const parsedDate = dateMatch ? this.parseDate(dateMatch[1]) : null;
            fields.push({
                field: "date",
                value: parsedDate,
                confidence: dateMatch ? 0.9 : 0,
                needsReview: !dateMatch,
                validationPassed: true,
            });

            const amountPattern =
                /(?:amount|paid)[\s:]*(?:rs\.?|₹)?\s*([0-9,]+\.?\d{0,2})/i;
            const amountMatch = text.match(amountPattern);
            const amount = amountMatch
                ? parseFloat(amountMatch[1].replace(/,/g, ""))
                : null;
            fields.push({
                field: "amount",
                value: amount,
                confidence: amountMatch ? 0.92 : 0,
                needsReview: !amountMatch || amount === null || amount <= 0,
                validationPassed: amount !== null && amount > 0,
            });

            const methodPattern = /(?:mode|method|via)[\s:]*(\w+)/i;
            const methodMatch = text.match(methodPattern);
            let paymentMethod = "OTHER";
            if (methodMatch) {
                const method = methodMatch[1].toLowerCase();
                if (method.includes("upi")) paymentMethod = "UPI";
                else if (method.includes("bank"))
                    paymentMethod = "BANK_TRANSFER";
                else if (method.includes("cash")) paymentMethod = "CASH";
                else if (method.includes("cheque")) paymentMethod = "CHEQUE";
            }
            fields.push({
                field: "method",
                value: paymentMethod,
                confidence: methodMatch ? 0.85 : 0.5,
                needsReview: !methodMatch,
                validationPassed: true,
            });

            const partyName = lines.length > 0 ? lines[0].trim() : null;
            const partyMatch = await this.fuzzyMatchParty(partyName, userId);
            fields.push({
                field: "partyName",
                value: partyMatch.matched
                    ? partyMatch.matchedEntity.name
                    : partyName,
                confidence: partyMatch.confidence,
                needsReview:
                    !partyMatch.matched || partyMatch.matchType === "fuzzy",
                validationPassed: partyMatch.matched,
            });
        }

        const validFields = fields.filter((f) => f.value !== null);
        const overallConfidence =
            validFields.length > 0
                ? validFields.reduce((sum, f) => sum + f.confidence, 0) /
                  validFields.length
                : 0;

        const lowConfidenceFields = fields
            .filter((f) => f.confidence < 0.7)
            .map((f) => f.field);

        const highConfidenceFields = fields
            .filter((f) => f.confidence >= 0.9)
            .map((f) => f.field);

        const invalidFields = fields
            .filter((f) => !f.validationPassed)
            .map((f) => f.field);

        return {
            fields,
            overallConfidence,
            highConfidenceFields,
            lowConfidenceFields,
            invalidFields,
        };
    }

    // ========================================
    // FEATURE 3: FUZZY MATCHING
    // ========================================
    private static async fuzzyMatchParty(
        searchName: string | null,
        userId: string
    ): Promise<FuzzyMatchResult> {
        if (!searchName) {
            return {
                matched: false,
                matchedEntity: null,
                confidence: 0,
                matchType: "none",
                suggestions: [],
            };
        }

        try {
            const parties = await prisma.party.findMany({
                where: { userId, isActive: true },
                select: { id: true, name: true, gstNo: true },
            });

            const exactMatch = parties.find(
                (p) => p.name.toLowerCase() === searchName.toLowerCase()
            );

            if (exactMatch) {
                return {
                    matched: true,
                    matchedEntity: exactMatch,
                    confidence: 1.0,
                    matchType: "exact",
                    suggestions: [],
                };
            }

            const fuse = new Fuse(parties, {
                keys: ["name"],
                threshold: 0.4,
                includeScore: true,
            });

            const results = fuse.search(searchName);

            if (results.length > 0 && results[0].score! < 0.3) {
                return {
                    matched: true,
                    matchedEntity: results[0].item,
                    confidence: 1 - results[0].score!,
                    matchType: "fuzzy",
                    suggestions: results
                        .slice(1, 4)
                        .map((r) => ({ entity: r.item, score: 1 - r.score! })),
                };
            }

            return {
                matched: false,
                matchedEntity: null,
                confidence: results.length > 0 ? 1 - results[0].score! : 0,
                matchType: "none",
                suggestions: results
                    .slice(0, 3)
                    .map((r) => ({ entity: r.item, score: 1 - r.score! })),
            };
        } catch (error: any) {
            logger.error("Fuzzy matching failed", LogCategory.OCR, {
                error: error.message,
            });
            return {
                matched: false,
                matchedEntity: null,
                confidence: 0,
                matchType: "none",
                suggestions: [],
            };
        }
    }

    private static async fuzzyMatchCustomer(
        searchName: string | null,
        userId: string
    ): Promise<FuzzyMatchResult> {
        if (!searchName) {
            return {
                matched: false,
                matchedEntity: null,
                confidence: 0,
                matchType: "none",
                suggestions: [],
            };
        }

        try {
            const customers = await prisma.customer.findMany({
                where: { userId, isActive: true },
                select: { id: true, name: true, phone: true },
            });

            const exactMatch = customers.find(
                (c) => c.name.toLowerCase() === searchName.toLowerCase()
            );

            if (exactMatch) {
                return {
                    matched: true,
                    matchedEntity: exactMatch,
                    confidence: 1.0,
                    matchType: "exact",
                    suggestions: [],
                };
            }

            const fuse = new Fuse(customers, {
                keys: ["name"],
                threshold: 0.4,
                includeScore: true,
            });

            const results = fuse.search(searchName);

            if (results.length > 0 && results[0].score! < 0.3) {
                return {
                    matched: true,
                    matchedEntity: results[0].item,
                    confidence: 1 - results[0].score!,
                    matchType: "fuzzy",
                    suggestions: results
                        .slice(1, 4)
                        .map((r) => ({ entity: r.item, score: 1 - r.score! })),
                };
            }

            return {
                matched: false,
                matchedEntity: null,
                confidence: results.length > 0 ? 1 - results[0].score! : 0,
                matchType: "none",
                suggestions: results
                    .slice(0, 3)
                    .map((r) => ({ entity: r.item, score: 1 - r.score! })),
            };
        } catch (error: any) {
            logger.error("Customer fuzzy matching failed", LogCategory.OCR, {
                error: error.message,
            });
            return {
                matched: false,
                matchedEntity: null,
                confidence: 0,
                matchType: "none",
                suggestions: [],
            };
        }
    }

    // ========================================
    // FEATURE 4: IMAGE QUALITY PRE-CHECK
    // ========================================
    private static async checkImageQuality(
        imageUrl: string
    ): Promise<ImageQualityResult> {
        try {
            const sharp = require("sharp");
            let imageBuffer: Buffer;

            if (imageUrl.startsWith("http")) {
                const response = await fetch(imageUrl);
                imageBuffer = Buffer.from(await response.arrayBuffer());
            } else {
                const fs = require("fs");
                imageBuffer = fs.readFileSync(imageUrl);
            }

            const metadata = await sharp(imageBuffer).metadata();
            const stats = await sharp(imageBuffer).stats();

            const issues: string[] = [];
            const warnings: string[] = [];
            const recommendations: string[] = [];
            let score = 100;

            if (metadata.width && metadata.height) {
                const totalPixels = metadata.width * metadata.height;
                if (totalPixels < 500000) {
                    issues.push("Resolution too low");
                    recommendations.push(
                        "Use higher resolution image (min 1000x700)"
                    );
                    score -= 40;
                } else if (totalPixels < 1000000) {
                    warnings.push("Resolution is low, may affect accuracy");
                    score -= 15;
                }
            }

            const avgStdDev =
                stats.channels.reduce((sum, ch) => sum + ch.std, 0) /
                stats.channels.length;

            if (avgStdDev < 20) {
                issues.push("Image is too blurry");
                recommendations.push("Ensure camera is focused and stable");
                score -= 35;
            } else if (avgStdDev < 35) {
                warnings.push("Image may be slightly blurry");
                score -= 10;
            }

            const avgMean =
                stats.channels.reduce((sum, ch) => sum + ch.mean, 0) /
                stats.channels.length;

            if (avgMean < 50) {
                warnings.push("Image is too dark");
                recommendations.push(
                    "Increase lighting or adjust camera settings"
                );
                score -= 15;
            } else if (avgMean > 220) {
                warnings.push("Image is overexposed");
                recommendations.push(
                    "Reduce lighting or adjust camera settings"
                );
                score -= 15;
            }

            const fileSize = imageBuffer.length;
            if (
                fileSize < 50000 &&
                metadata.width! * metadata.height! > 500000
            ) {
                warnings.push("Image appears heavily compressed");
                score -= 10;
            }

            const isGoodQuality = score >= 60 && issues.length === 0;

            return {
                isGoodQuality,
                score,
                issues,
                warnings,
                recommendations,
            };
        } catch (error: any) {
            logger.error(
                "Image quality check failed",
                undefined,
                LogCategory.OCR,
                {
                    error: error.message,
                }
            );

            return {
                isGoodQuality: true,
                score: 75,
                issues: [],
                warnings: ["Could not perform quality check"],
                recommendations: [],
            };
        }
    }

    // ========================================
    // FEATURE 5: VALIDATION RULES
    // ========================================
    private static async validateExtractedData(
        parsedData: ParsedDataWithConfidence,
        documentType: string
    ): Promise<ParsedDataWithConfidence> {
        const validatedFields = await Promise.all(
            parsedData.fields.map(async (field) => {
                const validationErrors: string[] = [];
                let validationPassed = true;

                switch (field.field) {
                    case "partyGST":
                    case "gstNumber":
                        if (field.value) {
                            const gstValid = this.validateGSTNumber(
                                field.value
                            );
                            if (!gstValid) {
                                validationErrors.push("Invalid GST format");
                                validationPassed = false;
                            }
                        }
                        break;

                    case "amount":
                        if (field.value !== null) {
                            if (field.value <= 0) {
                                validationErrors.push(
                                    "Amount must be greater than 0"
                                );
                                validationPassed = false;
                            }
                            if (field.value > 100000000) {
                                validationErrors.push(
                                    "Amount seems unusually high (>10 crore)"
                                );
                                validationPassed = false;
                            }
                        }
                        break;

                    case "date":
                        if (field.value) {
                            const dateObj = new Date(field.value);
                            const now = new Date();
                            const threeYearsAgo = new Date();
                            threeYearsAgo.setFullYear(
                                threeYearsAgo.getFullYear() - 3
                            );

                            if (dateObj > now) {
                                validationErrors.push(
                                    "Date cannot be in the future"
                                );
                                validationPassed = false;
                            }
                            if (dateObj < threeYearsAgo) {
                                validationErrors.push(
                                    "Date is more than 3 years old"
                                );
                                field.needsReview = true;
                            }
                        }
                        break;

                    case "invoiceNo":
                    case "receiptNo":
                        if (field.value && field.value.length > 50) {
                            validationErrors.push("Number seems too long");
                            validationPassed = false;
                        }
                        break;

                    case "phone":
                        if (field.value) {
                            const phoneValid = /^[6-9]\d{9}$/.test(
                                field.value.replace(/\D/g, "")
                            );
                            if (!phoneValid) {
                                validationErrors.push(
                                    "Invalid phone number format"
                                );
                                validationPassed = false;
                            }
                        }
                        break;

                    case "email":
                        if (field.value) {
                            const emailValid =
                                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value);
                            if (!emailValid) {
                                validationErrors.push("Invalid email format");
                                validationPassed = false;
                            }
                        }
                        break;
                }

                return {
                    ...field,
                    validationPassed,
                    validationErrors,
                    needsReview: field.needsReview || !validationPassed,
                };
            })
        );

        const invalidFields = validatedFields
            .filter((f) => !f.validationPassed)
            .map((f) => f.field);

        const lowConfidenceFields = validatedFields
            .filter((f) => f.confidence < 0.7 || f.needsReview)
            .map((f) => f.field);

        return {
            ...parsedData,
            fields: validatedFields,
            invalidFields,
            lowConfidenceFields,
        };
    }

    private static validateGSTNumber(gst: string): boolean {
        const gstPattern =
            /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return gstPattern.test(gst);
    }

    // ========================================
    // HELPER METHODS
    // ========================================
    private static convertToProcessedData(
        parsedData: ParsedDataWithConfidence
    ): any {
        return parsedData.fields.reduce(
            (acc, field) => {
                acc[field.field] = field.value;
                return acc;
            },
            {} as Record<string, any>
        );
    }

    private static parseDate(dateStr: string): string | null {
        try {
            const formats = [
                /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,
                /(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})/,
            ];

            for (const format of formats) {
                const match = dateStr.match(format);
                if (match) {
                    let day = parseInt(match[1]);
                    let month = parseInt(match[2]);
                    let year = parseInt(match[3]);

                    if (year < 100) {
                        year += year < 50 ? 2000 : 1900;
                    }

                    const date = new Date(year, month - 1, day);
                    return date.toISOString();
                }
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    private static async extractTextFromImage(
        imageUrl: string
    ): Promise<string> {
        const useGoogleVision = process.env.USE_GOOGLE_VISION === "true";

        if (useGoogleVision) {
            return this.extractWithGoogleVision(imageUrl);
        } else {
            return this.extractWithTesseract(imageUrl);
        }
    }

    private static async extractWithGoogleVision(
        imageUrl: string
    ): Promise<string> {
        try {
            const [result] = await visionClient.textDetection(imageUrl);
            const detections = result.textAnnotations;
            return detections && detections.length > 0
                ? detections[0].description || ""
                : "";
        } catch (error: any) {
            logger.error(
                "Google Vision extraction failed",
                undefined,
                LogCategory.OCR,
                {
                    error: error.message,
                }
            );
            throw new Error("Failed to extract text using Google Vision");
        }
    }

    private static async extractWithTesseract(
        imageUrl: string
    ): Promise<string> {
        try {
            const result = await Tesseract.recognize(imageUrl, "eng", {
                logger: (m) => console.log(m),
            });
            return result.data.text;
        } catch (error: any) {
            logger.error(
                "Tesseract extraction failed",
                undefined,
                LogCategory.OCR,
                {
                    error: error.message,
                }
            );
            throw new Error("Failed to extract text using Tesseract");
        }
    }

    // ========================================
    // CREATE RECORDS FROM OCR DATA
    // ========================================
    static async createInvoiceFromOCR(
        processedData: any,
        userId: string,
        ocrId: string
    ): Promise<any> {
        const party = await prisma.party.findFirst({
            where: {
                userId,
                OR: [
                    { gstNo: processedData.partyGST },
                    {
                        name: {
                            contains: processedData.partyName,
                            mode: "insensitive",
                        },
                    },
                ],
            },
        });

        if (!party) {
            throw new CustomError(
                400,
                "Party not found. Please create party first."
            );
        }

        const voucherId = generateInvoiceVoucherId(party.name);

        const invoice = await prisma.invoice.create({
            data: {
                voucherId,
                invoiceNo: processedData.invoiceNo,
                date: new Date(processedData.date),
                amount: processedData.amount,
                remainingAmount: processedData.amount,
                partyId: party.id,
                userId,
                items: processedData.items || [],
                status: "PENDING",
            },
        });

        await prisma.oCRData.update({
            where: { id: ocrId },
            data: { invoiceId: invoice.id },
        });

        return invoice;
    }

    static async createInvoicePaymentFromOCR(
        processedData: any,
        userId: string,
        ocrId: string
    ): Promise<any> {
        const party = await prisma.party.findFirst({
            where: {
                userId,
                name: {
                    contains: processedData.partyName,
                    mode: "insensitive",
                },
            },
        });

        if (!party) {
            throw new CustomError(
                400,
                "Party not found. Please create party first."
            );
        }

        const voucherId = generateInvoicePaymentVoucherId(
            party.name,
            processedData.date
        );

        const payment = await prisma.invoicePayment.create({
            data: {
                voucherId,
                amount: processedData.amount,
                date: new Date(processedData.date),
                method: processedData.method || "OTHER",
                reference: processedData.reference,
                partyId: party.id,
                userId,
                status: "COMPLETED",
            },
        });

        await prisma.oCRData.update({
            where: { id: ocrId },
            data: { invoicePaymentId: payment.id },
        });

        return payment;
    }

    static async createSaleReceiptFromOCR(
        processedData: any,
        userId: string,
        ocrId: string
    ): Promise<any> {
        const customer = await prisma.customer.findFirst({
            where: {
                userId,
                name: {
                    contains: processedData.customerName,
                    mode: "insensitive",
                },
            },
        });

        if (!customer) {
            throw new CustomError(
                400,
                "Customer not found. Please create customer first."
            );
        }

        const voucherId = generateSaleReceiptVoucherId(
            customer.name,
            processedData.date
        );

        const receipt = await prisma.saleReceipt.create({
            data: {
                voucherId,
                receiptNo: processedData.receiptNo,
                date: new Date(processedData.date),
                amount: processedData.amount,
                method: processedData.method || "CASH",
                customerId: customer.id,
                userId,
            },
        });

        await prisma.oCRData.update({
            where: { id: ocrId },
            data: { saleReceiptId: receipt.id },
        });

        return receipt;
    }
}
