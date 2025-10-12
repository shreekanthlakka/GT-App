// apps/ocr/src/events/publishers/ocrPublishers.ts
// UPDATED to use your existing subjects and topic names

import {
    DocumentUploadedEvent,
    OCRJobCreatedEvent,
    OCRJobStartedEvent,
    OCRJobCompletedEvent,
    OCRJobFailedEvent,
    OCRDataExtractedEvent,
    OCRDataValidatedEvent,
    OCRManualReviewRequiredEvent,
    InvoiceAutoCreatedFromOCREvent,
    SaleReceiptAutoCreatedFromOCREvent,
    InvoicePaymentAutoCreatedFromOCREvent,
} from "@repo/common-backend/interfaces";
import { Subjects } from "@repo/common/subjects";
import { KafkaPublisher } from "@repo/common-backend/kafka";
import { TopicNames } from "@repo/common/topics";

// ========================================
// DOCUMENT UPLOAD PUBLISHER
// Uses: OCR_DOCUMENT_EVENTS topic
// ========================================
export class DocumentUploadedPublisher extends KafkaPublisher<DocumentUploadedEvent> {
    subject = Subjects.DocumentUploaded as const;
    topic = TopicNames.OCR_DOCUMENT_EVENTS;

    protected generateMessageKey(data: DocumentUploadedEvent["data"]): string {
        return `document-${data.documentId}-uploaded-${data.uploadedBy}`;
    }
}

// ========================================
// OCR JOB CREATED PUBLISHER
// Uses: OCR_PROCESSING_EVENTS topic
// ========================================
export class OCRJobCreatedPublisher extends KafkaPublisher<OCRJobCreatedEvent> {
    subject = Subjects.OCRJobCreated as const;
    topic = TopicNames.OCR_PROCESSING_EVENTS;

    protected generateMessageKey(data: OCRJobCreatedEvent["data"]): string {
        return `ocr-job-${data.jobId}-created-${data.userId}`;
    }
}

// ========================================
// OCR JOB STARTED PUBLISHER
// Uses: OCR_PROCESSING_EVENTS topic
// ========================================
export class OCRJobStartedPublisher extends KafkaPublisher<OCRJobStartedEvent> {
    subject = Subjects.OCRJobStarted as const;
    topic = TopicNames.OCR_PROCESSING_EVENTS;

    protected generateMessageKey(data: OCRJobStartedEvent["data"]): string {
        return `ocr-job-${data.jobId}-started-${data.userId}`;
    }
}

// ========================================
// OCR JOB COMPLETED PUBLISHER
// Uses: OCR_PROCESSING_EVENTS topic
// ========================================
export class OCRJobCompletedPublisher extends KafkaPublisher<OCRJobCompletedEvent> {
    subject = Subjects.OCRJobCompleted as const;
    topic = TopicNames.OCR_PROCESSING_EVENTS;

    protected generateMessageKey(data: OCRJobCompletedEvent["data"]): string {
        return `ocr-job-${data.jobId}-completed-${data.userId}`;
    }
}

// ========================================
// OCR JOB FAILED PUBLISHER
// Uses: OCR_PROCESSING_EVENTS topic
// ========================================
export class OCRJobFailedPublisher extends KafkaPublisher<OCRJobFailedEvent> {
    subject = Subjects.OCRJobFailed as const;
    topic = TopicNames.OCR_PROCESSING_EVENTS;

    protected generateMessageKey(data: OCRJobFailedEvent["data"]): string {
        return `ocr-job-${data.jobId}-failed-${data.userId}`;
    }
}

// ========================================
// OCR DATA EXTRACTED PUBLISHER
// Uses: OCR_PROCESSING_EVENTS topic
// ========================================
export class OCRDataExtractedPublisher extends KafkaPublisher<OCRDataExtractedEvent> {
    subject = Subjects.OCRDataExtracted as const;
    topic = TopicNames.OCR_PROCESSING_EVENTS;

    protected generateMessageKey(data: OCRDataExtractedEvent["data"]): string {
        return `ocr-data-${data.jobId}-extracted-${data.userId}`;
    }
}

// ========================================
// OCR DATA VALIDATED PUBLISHER
// Uses: OCR_PROCESSING_EVENTS topic
// ========================================
export class OCRDataValidatedPublisher extends KafkaPublisher<OCRDataValidatedEvent> {
    subject = Subjects.OCRDataValidated as const;
    topic = TopicNames.OCR_PROCESSING_EVENTS;

    protected generateMessageKey(data: OCRDataValidatedEvent["data"]): string {
        return `ocr-data-${data.jobId}-validated-${data.userId}`;
    }
}

// ========================================
// OCR MANUAL REVIEW REQUIRED PUBLISHER
// Uses: OCR_PROCESSING_EVENTS topic
// ========================================
export class OCRManualReviewRequiredPublisher extends KafkaPublisher<OCRManualReviewRequiredEvent> {
    subject = Subjects.OCRManualReviewRequired as const;
    topic = TopicNames.OCR_PROCESSING_EVENTS;

    protected generateMessageKey(
        data: OCRManualReviewRequiredEvent["data"]
    ): string {
        return `ocr-review-${data.jobId}-required-${data.userId}`;
    }
}

// ========================================
// INVOICE AUTO-CREATED FROM OCR PUBLISHER
// Uses: ACCOUNTS_INVOICE_EVENTS topic
// ========================================
export class InvoiceAutoCreatedFromOCRPublisher extends KafkaPublisher<InvoiceAutoCreatedFromOCREvent> {
    subject = Subjects.InvoiceAutoCreatedFromOCR as const;
    topic = TopicNames.ACCOUNTS_INVOICE_EVENTS;

    protected generateMessageKey(
        data: InvoiceAutoCreatedFromOCREvent["data"]
    ): string {
        return `invoice-${data.invoiceId}-auto-created-ocr-${data.ocrJobId}`;
    }
}

// ========================================
// SALE RECEIPT AUTO-CREATED FROM OCR PUBLISHER
// Uses: ACCOUNTS_SALE_RECEIPT_EVENTS topic
// ========================================
export class SaleReceiptAutoCreatedFromOCRPublisher extends KafkaPublisher<SaleReceiptAutoCreatedFromOCREvent> {
    subject = Subjects.SaleReceiptAutoCreatedFromOCR as const;
    topic = TopicNames.ACCOUNTS_SALE_RECEIPT_EVENTS;

    protected generateMessageKey(
        data: SaleReceiptAutoCreatedFromOCREvent["data"]
    ): string {
        return `receipt-${data.receiptId}-auto-created-ocr-${data.ocrJobId}`;
    }
}

// ========================================
// INVOICE PAYMENT AUTO-CREATED FROM OCR PUBLISHER
// Uses: ACCOUNTS_INVOICE_PAYMENT_EVENTS topic
// ========================================
export class InvoicePaymentAutoCreatedFromOCRPublisher extends KafkaPublisher<InvoicePaymentAutoCreatedFromOCREvent> {
    subject = Subjects.InvoicePaymentAutoCreatedFromOCR as const;
    topic = TopicNames.ACCOUNTS_INVOICE_PAYMENT_EVENTS;

    protected generateMessageKey(
        data: InvoicePaymentAutoCreatedFromOCREvent["data"]
    ): string {
        return `payment-${data.paymentId}-auto-created-ocr-${data.ocrJobId}`;
    }
}
