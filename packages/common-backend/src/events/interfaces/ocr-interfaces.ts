import { Subjects } from "@repo/common/subjects";

// Document Upload Event
export interface DocumentUploadedEvent {
    subject: typeof Subjects.DocumentUploaded;
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

// OCR Job Lifecycle Events
export interface OCRJobCreatedEvent {
    subject: typeof Subjects.OCRJobCreated;
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

export interface OCRJobStartedEvent {
    subject: typeof Subjects.OCRJobStarted;
    data: {
        jobId: string;
        startedAt: string;
        imageUrl: string;
        userId: string;
    };
}

export interface OCRJobCompletedEvent {
    subject: typeof Subjects.OCRJobCompleted;
    data: {
        jobId: string;
        completedAt: string;
        confidence: number;
        status: string;
        extractedText: string;
        userId: string;
    };
}

export interface OCRJobFailedEvent {
    subject: typeof Subjects.OCRJobFailed;
    data: {
        jobId: string;
        failedAt: string;
        errorMessage: string;
        userId: string;
    };
}

export interface OCRDataExtractedEvent {
    subject: typeof Subjects.OCRDataExtracted;
    data: {
        jobId: string;
        documentType: string;
        extractedData: any;
        confidence: number;
        requiresReview: boolean;
        extractedAt: string;
        userId: string;
    };
}
