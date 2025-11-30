// import { Subjects } from "@repo/common/subjects";

// // Document Upload Event
// export interface DocumentUploadedEvent {
//     subject: typeof Subjects.DocumentUploaded;
//     data: {
//         documentId: string;
//         fileName: string;
//         fileSize: number;
//         fileType: string;
//         uploadPath: string;
//         uploadedBy: string;
//         uploadedAt: string;
//     };
// }

// // OCR Job Lifecycle Events
// export interface OCRJobCreatedEvent {
//     subject: typeof Subjects.OCRJobCreated;
//     data: {
//         jobId: string;
//         imageUrl: string;
//         documentType: string;
//         priority: string;
//         createdBy: string;
//         createdAt: string;
//         userId: string;
//     };
// }

// export interface OCRJobStartedEvent {
//     subject: typeof Subjects.OCRJobStarted;
//     data: {
//         jobId: string;
//         startedAt: string;
//         imageUrl: string;
//         userId: string;
//     };
// }

// export interface OCRJobCompletedEvent {
//     subject: typeof Subjects.OCRJobCompleted;
//     data: {
//         jobId: string;
//         completedAt: string;
//         confidence: number;
//         status: string;
//         extractedText: string;
//         userId: string;
//     };
// }

// export interface OCRJobFailedEvent {
//     subject: typeof Subjects.OCRJobFailed;
//     data: {
//         jobId: string;
//         failedAt: string;
//         errorMessage: string;
//         userId: string;
//     };
// }

// export interface OCRDataExtractedEvent {
//     subject: typeof Subjects.OCRDataExtracted;
//     data: {
//         jobId: string;
//         documentType: string;
//         extractedData: any;
//         confidence: number;
//         requiresReview: boolean;
//         extractedAt: string;
//         userId: string;
//     };
// }

// packages/common-backend/src/events/interfaces/ocr-interfaces.ts
// COMPLETE OCR EVENT INTERFACES

import { BaseEvent } from "./base-interfaces";
import { Subjects } from "@repo/common/subjects";

// ========================================
// DOCUMENT UPLOAD & MANAGEMENT EVENTS
// ========================================

export interface DocumentUploadedEvent extends BaseEvent {
    subject: Subjects.DocumentUploaded;
    data: {
        documentId: string;
        fileName: string;
        fileSize: number;
        fileType: string;
        uploadPath: string;
        uploadedBy: string;
        uploadedAt: string;
    };
}

export interface DocumentQueuedEvent extends BaseEvent {
    subject: Subjects.DocumentQueued;
    data: {
        documentId: string;
        queuePosition: number;
        estimatedProcessingTime: number;
        queuedAt: string;
        userId: string;
    };
}

export interface DocumentProcessingStartedEvent extends BaseEvent {
    subject: Subjects.DocumentProcessingStarted;
    data: {
        documentId: string;
        processingStartedAt: string;
        processor: string;
        userId: string;
    };
}

export interface DocumentProcessedEvent extends BaseEvent {
    subject: Subjects.DocumentProcessed;
    data: {
        documentId: string;
        processedAt: string;
        processingTime: number;
        success: boolean;
        userId: string;
    };
}

export interface DocumentProcessingFailedEvent extends BaseEvent {
    subject: Subjects.DocumentProcessingFailed;
    data: {
        documentId: string;
        failedAt: string;
        errorMessage: string;
        errorCode?: string;
        retryable: boolean;
        retryCount?: number;
        userId: string;
    };
}

export interface DocumentValidatedEvent extends BaseEvent {
    subject: Subjects.DocumentValidated;
    data: {
        documentId: string;
        validatedAt: string;
        validatedBy: string;
        validationStatus: "PASSED" | "FAILED" | "PARTIAL";
        validationErrors?: string[];
        userId: string;
    };
}

export interface DocumentRejectedEvent extends BaseEvent {
    subject: Subjects.DocumentRejected;
    data: {
        documentId: string;
        rejectedAt: string;
        rejectedBy: string;
        rejectionReason: string;
        canRetry: boolean;
        userId: string;
    };
}

export interface DocumentArchivedEvent extends BaseEvent {
    subject: Subjects.DocumentArchived;
    data: {
        documentId: string;
        archivedAt: string;
        archivedBy: string;
        archiveLocation: string;
        retentionPeriod?: number;
        userId: string;
    };
}

export interface DocumentDeletedEvent extends BaseEvent {
    subject: Subjects.DocumentDeleted;
    data: {
        documentId: string;
        deletedAt: string;
        deletedBy: string;
        reason?: string;
        permanentDeletion: boolean;
        userId: string;
    };
}

// ========================================
// OCR JOB LIFECYCLE EVENTS
// ========================================

export interface OCRJobCreatedEvent extends BaseEvent {
    subject: Subjects.OCRJobCreated;
    data: {
        jobId: string;
        imageUrl: string;
        documentType: string;
        priority: string;
        createdBy: string;
        createdAt: string;
        userId: string;
    };
}

export interface OCRJobStartedEvent extends BaseEvent {
    subject: Subjects.OCRJobStarted;
    data: {
        jobId: string;
        startedAt: string;
        imageUrl: string;
        ocrEngine?: "TESSERACT" | "GOOGLE_VISION" | "AWS_TEXTRACT";
        userId: string;
        fileName?: string;
        fileSize?: number;
        documentType?: string;
    };
}

export interface OCRJobCompletedEvent extends BaseEvent {
    subject: Subjects.OCRJobCompleted;
    data: {
        jobId: string;
        completedAt: string;
        confidence: number;
        status: string;
        extractedText: string;
        processingTime: number;
        userId: string;
    };
}

export interface OCRJobFailedEvent extends BaseEvent {
    subject: Subjects.OCRJobFailed;
    data: {
        jobId: string;
        failedAt: string;
        errorMessage: string;
        errorType?:
            | "IMAGE_QUALITY"
            | "OCR_ENGINE_ERROR"
            | "TIMEOUT"
            | "UNKNOWN";
        retryable: boolean;
        retryCount?: number;
        userId: string;
    };
}

export interface OCRJobCancelledEvent extends BaseEvent {
    subject: Subjects.OCRJobCancelled;
    data: {
        jobId: string;
        cancelledAt: string;
        cancelledBy: string;
        reason: string;
        refundIssued?: boolean;
        userId: string;
    };
}

export interface OCRJobRetriedEvent extends BaseEvent {
    subject: Subjects.OCRJobRetried;
    data: {
        jobId: string;
        originalJobId: string;
        retriedAt: string;
        retryCount: number;
        retryReason: string;
        userId: string;
    };
}

// ========================================
// OCR RESULTS & DATA EXTRACTION EVENTS
// ========================================

export interface OCRDataExtractedEvent extends BaseEvent {
    subject: Subjects.OCRDataExtracted;
    data: {
        jobId: string;
        documentType: string;
        extractedData: {
            fields: Array<{
                field: string;
                value: any;
                confidence: number;
            }>;
            rawText?: string;
        };
        confidence: number;
        requiresReview: boolean;
        extractedAt: string;
        userId: string;
    };
}

export interface OCRDataValidatedEvent extends BaseEvent {
    subject: Subjects.OCRDataValidated;
    data: {
        jobId: string;
        validatedAt: string;
        validationResults: {
            isValid: boolean;
            validFields: string[];
            invalidFields: string[];
            errors: Array<{
                field: string;
                error: string;
            }>;
            warnings: Array<{
                field: string;
                warning: string;
            }>;
        };
        overallValidationScore: number;
        userId: string;
    };
}

export interface OCRDataCorrectedEvent extends BaseEvent {
    subject: Subjects.OCRDataCorrected;
    data: {
        jobId: string;
        correctedAt: string;
        correctedBy: string;
        corrections: Array<{
            field: string;
            oldValue: any;
            newValue: any;
            reason?: string;
        }>;
        correctionCount: number;
        userId: string;
    };
}

export interface OCRHighConfidenceResultEvent extends BaseEvent {
    subject: Subjects.OCRHighConfidenceResult;
    data: {
        jobId: string;
        confidence: number;
        highConfidenceFields: string[];
        autoApprovalEligible: boolean;
        detectedAt: string;
        userId: string;
    };
}

export interface OCRLowConfidenceResultEvent extends BaseEvent {
    subject: Subjects.OCRLowConfidenceResult;
    data: {
        jobId: string;
        confidence: number;
        lowConfidenceFields: Array<{
            field: string;
            confidence: number;
            value: any;
        }>;
        recommendedAction: "MANUAL_REVIEW" | "RETRY" | "REJECT";
        detectedAt: string;
        userId: string;
    };
}

export interface OCRManualReviewRequiredEvent extends BaseEvent {
    subject: Subjects.OCRManualReviewRequired;
    data: {
        jobId: string;
        reason: string;
        reviewPriority: "HIGH" | "MEDIUM" | "LOW";
        lowConfidenceFields: string[];
        invalidFields: string[];
        qualityIssues?: string[];
        duplicateDetected?: boolean;
        requiresReview: boolean;
        assignedTo?: string;
        dueBy?: string;
        userId: string;
    };
}

// ========================================
// AUTO-CREATION FROM OCR EVENTS
// ========================================

export interface InvoiceAutoCreatedFromOCREvent extends BaseEvent {
    subject: Subjects.InvoiceAutoCreatedFromOCR;
    data: {
        invoiceId: string;
        ocrJobId: string;
        invoiceNo: string;
        voucherId: string;
        partyId: string;
        partyName: string;
        amount: number;
        remainingAmount: number;
        date: string;
        dueDate?: string;
        status: "PENDING" | "PAID" | "PARTIALLY_PAID" | "OVERDUE";
        items?: any[];
        confidence: number;
        autoApproved: boolean;
        createdAt: string;
        userId: string;
    };
}

export interface SaleReceiptAutoCreatedFromOCREvent extends BaseEvent {
    subject: Subjects.SaleReceiptAutoCreatedFromOCR;
    data: {
        receiptId: string;
        ocrJobId: string;
        receiptNo: string;
        voucherId: string;
        customerId: string;
        customerName: string;
        amount: number;
        method:
            | "CASH"
            | "BANK_TRANSFER"
            | "CHEQUE"
            | "UPI"
            | "CARD"
            | "ONLINE"
            | "OTHER";
        date: string;
        reference?: string;
        confidence: number;
        autoApproved: boolean;
        createdAt: string;
        userId: string;
    };
}

export interface InvoicePaymentAutoCreatedFromOCREvent extends BaseEvent {
    subject: Subjects.InvoicePaymentAutoCreatedFromOCR;
    data: {
        paymentId: string;
        ocrJobId: string;
        voucherId: string;
        partyId: string;
        partyName: string;
        invoiceId?: string;
        invoiceNo?: string;
        amount: number;
        method:
            | "CASH"
            | "BANK_TRANSFER"
            | "CHEQUE"
            | "UPI"
            | "CARD"
            | "ONLINE"
            | "OTHER";
        date: string;
        reference?: string;
        status: "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED";
        confidence: number;
        autoApproved: boolean;
        createdAt: string;
        userId: string;
    };
}

export interface ExpenseAutoCreatedFromOCREvent extends BaseEvent {
    subject: Subjects.ExpenseAutoCreatedFromOCR;
    data: {
        expenseId: string;
        ocrJobId: string;
        expenseNo: string;
        category: string;
        description: string;
        amount: number;
        vendor?: string;
        date: string;
        paymentMethod?: string;
        confidence: number;
        autoApproved: boolean;
        createdAt: string;
        userId: string;
    };
}

export interface OCRDataReviewedEvent extends BaseEvent {
    subject: Subjects.OCRDataReviewed;
    data: {
        ocrId: string;
        jobId?: string;
        reviewedAt: string;
        reviewedBy: string;
        correctionsMade: boolean;
        notes?: string;
        extractedData?: any;
        correctedData?: any;
        userId: string;
    };
}

export interface OCRDataApprovedEvent extends BaseEvent {
    subject: Subjects.OCRDataApproved;
    data: {
        ocrId: string;
        jobId?: string;
        approvedAt: string;
        approvedBy: string;
        recordCreated: boolean;
        createdRecordId?: string;
        createdRecordType?: string;
        autoApproved: boolean;
        userId: string;
    };
}

export interface OCRDataRejectedEvent extends BaseEvent {
    subject: Subjects.OCRDataRejected;
    data: {
        ocrId: string;
        jobId?: string;
        rejectedAt: string;
        rejectedBy: string;
        reason: string;
        rejectionCategory?:
            | "DUPLICATE"
            | "POOR_QUALITY"
            | "INVALID_DATA"
            | "MANUAL"
            | "OTHER";
        userId: string;
    };
}

// ========================================
// EXPORT ALL OCR EVENT TYPES
// ========================================

export type OCREventTypes =
    // Document Management
    | DocumentUploadedEvent
    | DocumentQueuedEvent
    | DocumentProcessingStartedEvent
    | DocumentProcessedEvent
    | DocumentProcessingFailedEvent
    | DocumentValidatedEvent
    | DocumentRejectedEvent
    | DocumentArchivedEvent
    | DocumentDeletedEvent
    // OCR Job Lifecycle
    | OCRJobCreatedEvent
    | OCRJobStartedEvent
    | OCRJobCompletedEvent
    | OCRJobFailedEvent
    | OCRJobCancelledEvent
    | OCRJobRetriedEvent
    // OCR Results & Data
    | OCRDataExtractedEvent
    | OCRDataValidatedEvent
    | OCRDataCorrectedEvent
    | OCRHighConfidenceResultEvent
    | OCRLowConfidenceResultEvent
    | OCRManualReviewRequiredEvent
    // Auto-Creation
    | InvoiceAutoCreatedFromOCREvent
    | SaleReceiptAutoCreatedFromOCREvent
    | InvoicePaymentAutoCreatedFromOCREvent
    | ExpenseAutoCreatedFromOCREvent
    // Review & Approval
    | OCRDataReviewedEvent
    | OCRDataApprovedEvent
    | OCRDataRejectedEvent;
