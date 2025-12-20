// apps/ocr/src/controllers/ocrController.ts - ENHANCED VERSION
import { prisma } from "@repo/db/prisma";
import { OCRStatus } from "@repo/db";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import {
    OCRJobStartedPublisher,
    OCRDataReviewedPublisher,
    OCRDataApprovedPublisher,
    OCRDataRejectedPublisher,
} from "../events/publishers/ocrPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { OCRService } from "../services/ocrService";
import { FileUploadService } from "../services/fileUploadService";

export const uploadDocument = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }

    if (!req.file) {
        throw new CustomError(400, "No file uploaded");
    }

    const { documentType } = req.body;

    if (
        !["invoice", "invoice_payment", "sale_receipt"].includes(documentType)
    ) {
        throw new CustomError(400, "Invalid document type");
    }

    logger.info("Starting OCR processing", LogCategory.OCR, {
        userId,
        fileName: req.file.originalname,
        documentType,
        fileSize: req.file.size,
    });

    try {
        // Upload file to storage
        const fileUrl = await FileUploadService.uploadFile(
            req.file,
            userId,
            documentType
        );

        // Create OCR record
        const ocrData = await prisma.oCRData.create({
            data: {
                imageUrl: fileUrl,
                originalName: req.file.originalname,
                fileSize: req.file.size,
                status: OCRStatus.PROCESSING,
                extractedData: {},
                userId,
                documentType,
            },
        });

        // Publish OCR processing started event
        const ocrStartedPublisher = new OCRJobStartedPublisher(
            kafkaWrapper.producer
        );
        await ocrStartedPublisher.publish({
            jobId: ocrData.id,
            userId,
            imageUrl: fileUrl,
            documentType,
            fileName: req.file.originalname,
            fileSize: req.file.size,
            startedAt: new Date().toISOString(),
            ocrEngine:
                process.env.USE_GOOGLE_VISION === "true"
                    ? "GOOGLE_VISION"
                    : "TESSERACT",
        });

        // Process OCR asynchronously with all enhanced features
        OCRService.processDocument(ocrData.id, fileUrl, documentType, userId)
            .then(async (result) => {
                logger.info("OCR processing completed", LogCategory.OCR, {
                    ocrId: ocrData.id,
                    confidence: result?.confidence,
                });
            })
            .catch(async (error) => {
                logger.error(
                    "OCR processing failed",
                    undefined,
                    LogCategory.OCR,
                    {
                        ocrId: ocrData.id,
                        error: error.message,
                    }
                );
            });

        const response = new CustomResponse(
            202,
            "Document uploaded successfully. Processing started with quality checks.",
            {
                ocrId: ocrData.id,
                imageUrl: fileUrl,
                status: ocrData.status,
                message:
                    "Document will be checked for quality, duplicates, and validated",
            }
        );
        res.status(response.statusCode).json(response);
    } catch (error: any) {
        logger.error("Document upload failed", undefined, LogCategory.OCR, {
            userId,
            error: error.message,
        });
        throw new CustomError(500, "Failed to upload document");
    }
});

export const getOCRStatus = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const ocrData = await prisma.oCRData.findFirst({
        where: {
            id,
            userId,
        },
    });

    if (!ocrData) {
        throw new CustomError(404, "OCR data not found");
    }

    // Parse extracted data to show enhanced information
    const extractedData = ocrData.extractedData as any;

    // Build enhanced response with quality and validation info
    const enhancedData = {
        ...ocrData,
        qualityCheck: extractedData.qualityCheck || null,
        duplicateCheck: extractedData.duplicateCheck || null,
        fieldConfidence: extractedData.fields || [],
        lowConfidenceFields: extractedData.lowConfidenceFields || [],
        invalidFields: extractedData.invalidFields || [],
        suggestions:
            extractedData.fields
                ?.filter((f: any) => f.needsReview)
                .map((f: any) => ({
                    field: f.field,
                    value: f.value,
                    confidence: f.confidence,
                    validationErrors: f.validationErrors,
                })) || [],
    };

    const response = new CustomResponse(200, "OCR status retrieved", {
        ocrData: enhancedData,
    });
    res.status(response.statusCode).json(response);
});

export const getAllOCRDocuments = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const {
        page = 1,
        limit = 20,
        status,
        documentType,
        startDate,
        endDate,
        sortBy = "createdAt",
        sortOrder = "desc",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    const whereClause: any = { userId };

    if (status) {
        whereClause.status = status as OCRStatus;
    }

    if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate)
            whereClause.createdAt.gte = new Date(startDate as string);
        if (endDate) whereClause.createdAt.lte = new Date(endDate as string);
    }

    const [ocrDocuments, total] = await Promise.all([
        prisma.oCRData.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: {
                [sortBy as string]: sortOrder as "asc" | "desc",
            },
            include: {
                invoice: {
                    select: {
                        id: true,
                        invoiceNo: true,
                        amount: true,
                        status: true,
                    },
                },
                invoicePayment: {
                    select: {
                        id: true,
                        voucherId: true,
                        amount: true,
                        status: true,
                    },
                },
                saleReceipt: {
                    select: {
                        id: true,
                        receiptNo: true,
                        amount: true,
                    },
                },
            },
        }),
        prisma.oCRData.count({ where: whereClause }),
    ]);

    // Add summary for each document
    const documentsWithSummary = ocrDocuments.map(
        (doc: (typeof ocrDocuments)[0]) => {
            const extractedData = doc.extractedData as any;
            return {
                ...doc,
                summary: {
                    hasQualityIssues:
                        extractedData.qualityCheck?.issues?.length > 0,
                    isDuplicate: extractedData.duplicateCheck?.isDuplicate,
                    hasValidationErrors:
                        extractedData.invalidFields?.length > 0,
                    needsReview:
                        doc.status === OCRStatus.MANUAL_REVIEW ||
                        extractedData.lowConfidenceFields?.length > 0,
                },
            };
        }
    );

    const response = new CustomResponse(
        200,
        "OCR documents retrieved successfully",
        {
            documents: documentsWithSummary,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        }
    );
    res.status(response.statusCode).json(response);
});

export const reviewOCRData = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { correctedData, notes, acceptDuplicate = false } = req.body;

    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }
    if (!id) return;

    const ocrData = await prisma.oCRData.findFirst({
        where: { id, userId },
    });

    if (!ocrData) {
        throw new CustomError(404, "OCR data not found");
    }

    if (
        ocrData.status !== OCRStatus.COMPLETED &&
        ocrData.status !== OCRStatus.MANUAL_REVIEW
    ) {
        throw new CustomError(400, "OCR data is not ready for review");
    }

    // Merge corrections with existing data
    const existingData = ocrData.extractedData as any;
    const updatedData = {
        ...existingData,
        ...correctedData,
        reviewedAt: new Date().toISOString(),
        reviewedBy: userId,
        acceptedDuplicate: acceptDuplicate,
    };

    const updatedOCRData = await prisma.oCRData.update({
        where: { id },
        data: {
            processedData: correctedData,
            extractedData: updatedData,
            status: OCRStatus.MANUAL_REVIEW,
            updatedAt: new Date(),
        },
    });

    // Audit log
    logger.audit("REVIEW", "OCRData", id, userId, ocrData, updatedOCRData, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        notes,
    });

    // Publish OCR data reviewed event
    const ocrReviewedPublisher = new OCRDataReviewedPublisher(
        kafkaWrapper.producer
    );
    await ocrReviewedPublisher.publish({
        ocrId: id,
        userId,
        reviewedBy: userId,
        reviewedAt: new Date().toISOString(),
        correctionsMade:
            JSON.stringify(correctedData) !==
            JSON.stringify(ocrData.extractedData),
        notes,
    });

    logger.info("OCR data reviewed", LogCategory.OCR, {
        ocrId: id,
        reviewedBy: userId,
        correctionsMade:
            JSON.stringify(correctedData) !==
            JSON.stringify(ocrData.extractedData),
    });

    const response = new CustomResponse(200, "OCR data reviewed successfully", {
        ocrData: updatedOCRData,
    });
    res.status(response.statusCode).json(response);
});

export const approveOCRData = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { createRecord, documentType } = req.body;

    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }
    if (!id) return;

    const ocrData = await prisma.oCRData.findFirst({
        where: { id, userId },
    });

    if (!ocrData) {
        throw new CustomError(404, "OCR data not found");
    }

    if (
        ocrData.status !== OCRStatus.COMPLETED &&
        ocrData.status !== OCRStatus.MANUAL_REVIEW
    ) {
        throw new CustomError(
            400,
            "OCR data cannot be approved in current state"
        );
    }

    // Check for duplicate if not already accepted
    const extractedData = ocrData.extractedData as any;
    if (
        extractedData.duplicateCheck?.isDuplicate &&
        !extractedData.acceptedDuplicate
    ) {
        throw new CustomError(
            409,
            "Duplicate document detected. Please review and explicitly accept duplicate."
        );
    }

    let createdRecordId: string | undefined;
    let createdRecordType: string | undefined;

    if (createRecord && ocrData.processedData) {
        const processedData = ocrData.processedData as any;

        if (documentType === "invoice") {
            const invoice = await OCRService.createInvoiceFromOCR(
                processedData,
                userId,
                id
            );
            createdRecordId = invoice.id;
            createdRecordType = "invoice";
        } else if (documentType === "invoice_payment") {
            const payment = await OCRService.createInvoicePaymentFromOCR(
                processedData,
                userId,
                id
            );
            createdRecordId = payment.id;
            createdRecordType = "invoice_payment";
        } else if (documentType === "sale_receipt") {
            const receipt = await OCRService.createSaleReceiptFromOCR(
                processedData,
                userId,
                id
            );
            createdRecordId = receipt.id;
            createdRecordType = "sale_receipt";
        }
    }

    const updatedOCRData = await prisma.oCRData.update({
        where: { id },
        data: {
            status: OCRStatus.COMPLETED,
            updatedAt: new Date(),
        },
    });

    const ocrApprovedPublisher = new OCRDataApprovedPublisher(
        kafkaWrapper.producer
    );
    await ocrApprovedPublisher.publish({
        ocrId: id,
        userId,
        approvedBy: userId,
        approvedAt: new Date().toISOString(),
        recordCreated: createRecord,
        createdRecordId,
        createdRecordType,
        autoApproved: false,
        jobId: ocrData.id,
    });

    logger.info("OCR data approved", LogCategory.OCR, {
        ocrId: id,
        approvedBy: userId,
        recordCreated: createRecord,
        createdRecordType,
    });

    const response = new CustomResponse(200, "OCR data approved successfully", {
        ocrData: updatedOCRData,
        createdRecordId,
        createdRecordType,
    });
    res.status(response.statusCode).json(response);
});

export const rejectOCRData = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }

    const ocrData = await prisma.oCRData.findFirst({
        where: { id, userId },
    });

    if (!ocrData) {
        throw new CustomError(404, "OCR data not found");
    }

    const updatedOCRData = await prisma.oCRData.update({
        where: { id },
        data: {
            status: OCRStatus.FAILED,
            errorMessage: reason,
            updatedAt: new Date(),
        },
    });

    const ocrRejectedPublisher = new OCRDataRejectedPublisher(
        kafkaWrapper.producer
    );
    await ocrRejectedPublisher.publish({
        ocrId: id,
        userId,
        rejectedBy: userId,
        rejectedAt: new Date().toISOString(),
        reason,
    });

    logger.info("OCR data rejected", LogCategory.OCR, {
        ocrId: id,
        rejectedBy: userId,
        reason,
    });

    const response = new CustomResponse(200, "OCR data rejected", {
        ocrData: updatedOCRData,
    });
    res.status(response.statusCode).json(response);
});

export const retryOCRProcessing = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }

    const ocrData = await prisma.oCRData.findFirst({
        where: { id, userId },
    });

    if (!ocrData) {
        throw new CustomError(404, "OCR data not found");
    }

    if (ocrData.status !== OCRStatus.FAILED) {
        throw new CustomError(400, "Can only retry failed OCR processing");
    }

    await prisma.oCRData.update({
        where: { id },
        data: {
            status: OCRStatus.PROCESSING,
            errorMessage: null,
            updatedAt: new Date(),
        },
    });

    OCRService.processDocument(
        ocrData.id,
        ocrData.imageUrl,
        req.body.documentType || "invoice",
        userId
    )
        .then(() => {
            logger.info("OCR retry completed", LogCategory.OCR, {
                ocrId: id,
            });
        })
        .catch((error) => {
            logger.error("OCR retry failed", undefined, LogCategory.OCR, {
                ocrId: id,
                error: error.message,
            });
        });

    const response = new CustomResponse(202, "OCR processing retry started", {
        ocrId: id,
    });
    res.status(response.statusCode).json(response);
});

export const deleteOCRDocument = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }

    const ocrData = await prisma.oCRData.findFirst({
        where: { id, userId },
        include: {
            invoice: true,
            invoicePayment: true,
            saleReceipt: true,
        },
    });

    if (!ocrData) {
        throw new CustomError(404, "OCR data not found");
    }

    if (ocrData.invoice || ocrData.invoicePayment || ocrData.saleReceipt) {
        throw new CustomError(
            400,
            "Cannot delete OCR data linked to existing records"
        );
    }

    await FileUploadService.deleteFile(ocrData.imageUrl);

    await prisma.oCRData.delete({
        where: { id },
    });

    logger.info("OCR document deleted", LogCategory.OCR, {
        ocrId: id,
        deletedBy: userId,
    });

    const response = new CustomResponse(
        200,
        "OCR document deleted successfully"
    );
    res.status(response.statusCode).json(response);
});

export const getOCRAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { startDate, endDate } = req.query;

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const whereClause: any = {
        userId,
        createdAt: { gte: start, lte: end },
    };

    const [
        totalDocuments,
        statusBreakdown,
        avgConfidence,
        processingTimes,
        qualityIssues,
        duplicatesDetected,
        validationFailures,
    ] = await Promise.all([
        prisma.oCRData.count({ where: whereClause }),
        prisma.oCRData.groupBy({
            by: ["status"],
            where: whereClause,
            _count: true,
        }),
        prisma.oCRData.aggregate({
            where: { ...whereClause, status: OCRStatus.COMPLETED },
            _avg: { confidence: true },
        }),
        prisma.oCRData.findMany({
            where: { ...whereClause, status: OCRStatus.COMPLETED },
            select: {
                createdAt: true,
                updatedAt: true,
            },
        }),
        prisma.oCRData.count({
            where: {
                ...whereClause,
                extractedData: {
                    path: ["qualityCheck", "isGoodQuality"],
                    equals: false,
                },
            },
        }),
        prisma.oCRData.count({
            where: {
                ...whereClause,
                extractedData: {
                    path: ["duplicateCheck", "isDuplicate"],
                    equals: true,
                },
            },
        }),
        prisma.oCRData.count({
            where: {
                ...whereClause,
                extractedData: {
                    path: ["invalidFields"],
                    not: [],
                },
            },
        }),
    ]);

    const avgProcessingTime =
        processingTimes.length > 0
            ? processingTimes.reduce(
                  (
                      sum: number,
                      doc: {
                          createdAt: Date;
                          updatedAt: Date;
                      }
                  ) => {
                      return (
                          sum +
                          (doc.updatedAt.getTime() - doc.createdAt.getTime()) /
                              1000
                      );
                  },
                  0
              ) / processingTimes.length
            : 0;

    const response = new CustomResponse(
        200,
        "OCR analytics retrieved successfully",
        {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            summary: {
                totalDocuments,
                averageConfidence: avgConfidence._avg.confidence || 0,
                averageProcessingTime: Math.round(avgProcessingTime),
                qualityIssuesDetected: qualityIssues,
                duplicatesDetected,
                validationFailures,
                statusBreakdown: statusBreakdown.reduce(
                    (
                        acc: Record<string, number>,
                        item: {
                            status: string;
                            _count: number;
                        }
                    ) => {
                        acc[item.status] = item._count;
                        return acc;
                    },
                    {} as Record<string, number>
                ),
            },
        }
    );
    res.status(response.statusCode).json(response);
});
