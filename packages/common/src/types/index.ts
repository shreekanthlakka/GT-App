// packages/common/src/types/index.ts
export interface PaginationParams {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

export interface PaginationResult<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
}

export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    error?: any;
    statusCode: number;
}

export interface DateRange {
    startDate?: Date;
    endDate?: Date;
}

export interface SearchFilter {
    search?: string;
    searchFields: string[];
}

export interface SortFilter {
    sortBy?: string;
    sortOrder?: "asc" | "desc";
}

// Business specific types
export interface TextileProductAttributes {
    fabric?: string;
    gsm?: number;
    width?: number;
    color?: string;
    design?: string;
    pattern?: string;
}

export interface CustomerPreferences {
    preferredFabrics?: string[];
    preferredColors?: string[];
    sizePreferences?: Record<string, any>;
    occasionPreferences?: string[];
}

export interface PartyBankDetails {
    bankName?: string;
    accountNo?: string;
    ifsc?: string;
    branch?: string;
}

export interface PaymentGatewayResponse {
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    transactionId?: string;
    status: string;
    failureReason?: string;
}

export interface OCRExtractedData {
    invoiceNumber?: string;
    date?: string;
    amount?: number;
    partyName?: string;
    gstNumber?: string;
    items?: Array<{
        name: string;
        quantity: number;
        price: number;
        total: number;
    }>;
    confidence: number;
    rawText: string;
}

export interface NotificationTemplate {
    name: string;
    title: string;
    message: string;
    variables: string[];
    channels: string[];
}

export interface AuditLogData {
    action: string;
    entityType: string;
    entityId: string;
    oldData?: any;
    newData?: any;
    userId?: string;
    ipAddress?: string;
    userAgent?: string;
}

// packages/common/src/utils/constants.ts
export const TEXTILE_CATEGORIES = [
    "Sarees",
    "Suits",
    "Lehengas",
    "Blouses",
    "Fabrics",
    "Accessories",
    "Readymade",
] as const;

export const FABRIC_TYPES = [
    "Cotton",
    "Silk",
    "Polyester",
    "Georgette",
    "Chiffon",
    "Crepe",
    "Viscose",
    "Linen",
    "Wool",
    "Lycra",
    "Net",
    "Satin",
] as const;

export const PAYMENT_METHODS = [
    "CASH",
    "BANK_TRANSFER",
    "CHEQUE",
    "UPI",
    "CARD",
    "ONLINE",
    "OTHER",
] as const;

export const NOTIFICATION_CHANNELS = [
    "WHATSAPP",
    "SMS",
    "EMAIL",
    "PUSH",
    "IN_APP",
] as const;

export const USER_ROLES = [
    "OWNER",
    "MANAGER",
    "STAFF",
    "VIEWER",
    "ACCOUNTANT",
] as const;

export const INVOICE_STATUSES = [
    "PENDING",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
    "CANCELLED",
] as const;

export const SALE_STATUSES = [
    "PENDING",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
    "CANCELLED",
    "RETURNED",
] as const;

export const PAYMENT_STATUSES = [
    "PENDING",
    "COMPLETED",
    "FAILED",
    "CANCELLED",
    "REFUNDED",
] as const;

export const OCR_STATUSES = [
    "PROCESSING",
    "COMPLETED",
    "FAILED",
    "MANUAL_REVIEW",
    "CANCELLED",
] as const;

// Error codes
export const ERROR_CODES = {
    VALIDATION_ERROR: "VALIDATION_ERROR",
    AUTHENTICATION_ERROR: "AUTHENTICATION_ERROR",
    AUTHORIZATION_ERROR: "AUTHORIZATION_ERROR",
    NOT_FOUND: "NOT_FOUND",
    DUPLICATE_ENTRY: "DUPLICATE_ENTRY",
    INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
    PAYMENT_FAILED: "PAYMENT_FAILED",
    OCR_PROCESSING_FAILED: "OCR_PROCESSING_FAILED",
    NOTIFICATION_FAILED: "NOTIFICATION_FAILED",
    EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
    DATABASE_ERROR: "DATABASE_ERROR",
    INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
} as const;

// Default pagination values
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;
export const DEFAULT_SORT_ORDER = "desc";

// File upload constraints
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
    "image/jpeg",
    "image/png",
    "image/jpg",
    "application/pdf",
] as const;

// Business rules
export const OVERDUE_THRESHOLD_DAYS = 30;
export const LOW_STOCK_THRESHOLD = 10;
export const CRITICAL_STOCK_THRESHOLD = 5;
