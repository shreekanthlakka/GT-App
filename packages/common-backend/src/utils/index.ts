// packages/common-backend/src/utils/index.ts
import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";

import bcrypt from "bcryptjs";
import crypto from "crypto";

export * from "./crypto";
export * from "./business";

const asyncHandler = (
    func: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            await func(req, res, next);
        } catch (error: any) {
            if (error instanceof CustomError) {
                return res.status(error.statusCode).json({
                    status: error.statusCode,
                    message: error.message,
                    success: error.success,
                    error: error.error,
                });
            }

            // Handle Prisma errors
            if (error && typeof error === "object" && "code" in error) {
                const prismaError = error as {
                    code: string;
                    message?: string;
                    meta?: any;
                };

                switch (prismaError.code) {
                    case "P2002":
                        return res.status(409).json({
                            status: 409,
                            message: "Duplicate entry detected",
                            success: false,
                        });
                    case "P2025":
                        return res.status(404).json({
                            status: 404,
                            message: "Record not found",
                            success: false,
                        });
                    case "P2003":
                        return res.status(400).json({
                            status: 400,
                            message: "Foreign key constraint failed",
                            success: false,
                        });
                    case "P2014":
                        return res.status(400).json({
                            status: 400,
                            message: "Invalid ID provided",
                            success: false,
                        });
                    default:
                        return res.status(500).json({
                            status: 500,
                            message: "Database error occurred",
                            success: false,
                            ...(process.env.NODE_ENV === "development" && {
                                error:
                                    prismaError.message ||
                                    "Unknown database error",
                            }),
                        });
                }
            }

            // Handle validation errors
            if (
                error &&
                typeof error === "object" &&
                "name" in error &&
                error.name === "ValidationError"
            ) {
                const validationError = error as {
                    errors?: any[];
                    message?: string;
                };
                return res.status(400).json({
                    status: 400,
                    message: "Validation failed",
                    success: false,
                    errors: validationError.errors || [],
                });
            }

            // Handle standard JavaScript errors
            if (error instanceof Error) {
                return res.status(500).json({
                    status: 500,
                    message: error.message || "Internal Server Error",
                    success: false,
                    ...(process.env.NODE_ENV === "development" && {
                        stack: error.stack,
                        error: error.message,
                    }),
                });
            }

            // Fallback for unknown error types
            return res.status(500).json({
                status: 500,
                message: "Internal Server Error",
                success: false,
                ...(process.env.NODE_ENV === "development" && {
                    error: String(error),
                }),
            });
        }
    };
};

class CustomError extends Error {
    public statusCode: number;
    public error: any[];
    public success: boolean;

    constructor(
        statusCode = 500,
        message = "Something went wrong",
        error: any[] = []
    ) {
        super();
        this.statusCode = statusCode;
        this.message = message;
        this.error = error;
        this.success = false;
    }
}

class CustomResponse<T = any> {
    public statusCode: number;
    public message: string;
    public data: T;
    public success: boolean;

    constructor(statusCode = 200, message = "success", data = {} as T) {
        this.statusCode = statusCode;
        this.message = message;
        this.data = data;
        this.success = true;
    }
}

// Helper function to sanitize party/customer names for voucher IDs
const sanitizeName = (name: string): string => {
    return name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, ""); // Remove spaces and special characters
};

// Helper function to format date for voucher ID (DD/M/YY format)
const formatDateForVoucher = (date: Date = new Date()): string => {
    const day = date.getDate(); // No leading zero
    const month = date.getMonth() + 1; // No leading zero
    const year = date.getFullYear().toString().slice(-2); // Last 2 digits
    return `${day}/${month}/${year}`;
};

// Helper function to generate random 4-digit number
const generateSequenceNumber = (): number => {
    return Math.floor(Math.random() * 9000) + 1000; // 1000-9999
};

// ========================================
// SIMPLE VOUCHER ID GENERATORS
// ========================================

/**
 * Generate voucher ID in format: PREFIX-PARTYNAME-DD/M/YY-XXXX
 * Examples:
 *   - INVOICE-RAJLAXMISAREES-22/6/25-2020
 *   - RECEIPT-AMBICA-24/5/25-4455
 */
export const generateVoucherId = (
    prefix: string,
    entityName: string,
    date?: Date,
    sequenceNumber?: number
): string => {
    const sanitizedName = sanitizeName(entityName);
    const formattedDate = formatDateForVoucher(date);
    const seqNo = sequenceNumber || generateSequenceNumber();

    return `${prefix}-${sanitizedName}-${formattedDate}-${seqNo}`;
};

/**
 * Generate invoice voucher ID
 * Example: INVOICE-RAJLAXMISAREES-22/6/25-2020
 */
export const generateInvoiceVoucherId = (
    partyName: string,
    date?: Date,
    sequenceNumber?: number
): string => {
    return generateVoucherId("INVOICE", partyName, date, sequenceNumber);
};

/**
 * Generate sale voucher ID
 * Example: SALE-PRIYASHARMA-22/6/25-3456
 */
export const generateSaleVoucherId = (
    customerName: string,
    date?: Date,
    sequenceNumber?: number
): string => {
    return generateVoucherId("SALE", customerName, date, sequenceNumber);
};

/**
 * Generate payment voucher ID
 * Example: INVOICE_PAYMENT-AMBICA-24/5/25-4455
 */
export const generateInvoicePaymentVoucherId = (
    partyName: string,
    date?: Date,
    sequenceNumber?: number
): string => {
    return generateVoucherId(
        "INVOICE_PAYMENT",
        partyName,
        date,
        sequenceNumber
    );
};

/**
 * Generate receipt voucher ID
 * Example: RECEIPT-AMBICA-24/5/25-4455
 */
export const generateSaleReceiptVoucherId = (
    customerName: string,
    date?: Date,
    sequenceNumber?: number
): string => {
    return generateVoucherId(
        "SALE_RECEIPT",
        customerName,
        date,
        sequenceNumber
    );
};

/**
 * Generate order voucher ID
 * Example: ORDER-SUNITA-22/6/25-7890
 */
export const generateOrderVoucherId = (
    customerName: string,
    date?: Date,
    sequenceNumber?: number
): string => {
    return generateVoucherId("ORDER", customerName, date, sequenceNumber);
};

// ===========================================================================================
// PAGINATION UTILITIES
// ===========================================================================================

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

export const calculatePagination = (
    page: number,
    limit: number,
    total: number
) => {
    const totalPages = Math.ceil(total / limit);
    const skip = (page - 1) * limit;

    return {
        skip,
        take: limit,
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrev: page > 1,
        },
    };
};

export const buildSearchFilter = (
    search?: string,
    searchFields: string[] = []
): any => {
    if (!search || searchFields.length === 0) {
        return {};
    }

    return {
        OR: searchFields.map((field) => ({
            [field]: {
                contains: search,
                mode: "insensitive",
            },
        })),
    };
};

export const buildSortFilter = (
    sortBy?: string,
    sortOrder: "asc" | "desc" = "desc"
): any => {
    if (!sortBy) {
        return { createdAt: "desc" };
    }

    return { [sortBy]: sortOrder };
};

// ========================================
// DATE UTILITIES
// ========================================

export const getDateRange = (
    startDate?: string,
    endDate?: string
): { gte?: Date; lte?: Date } => {
    const filter: { gte?: Date; lte?: Date } = {};

    if (startDate) {
        filter.gte = new Date(startDate);
    }

    if (endDate) {
        const end = new Date(endDate);
        // Set to end of day
        end.setHours(23, 59, 59, 999);
        filter.lte = end;
    }

    return filter;
};

export const getStartOfDay = (date: Date = new Date()): Date => {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    return start;
};

export const getEndOfDay = (date: Date = new Date()): Date => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return end;
};

export const getStartOfMonth = (date: Date = new Date()): Date => {
    return new Date(date.getFullYear(), date.getMonth(), 1);
};

export const getEndOfMonth = (date: Date = new Date()): Date => {
    return new Date(
        date.getFullYear(),
        date.getMonth() + 1,
        0,
        23,
        59,
        59,
        999
    );
};

export const formatDateForDB = (dateString: string): Date => {
    return new Date(dateString);
};

export const isOverdue = (dueDate: Date): boolean => {
    return dueDate < new Date();
};

export const getDaysPastDue = (dueDate: Date): number => {
    const today = new Date();
    const diffTime = today.getTime() - dueDate.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// ========================================
// CRYPTO UTILITIES
// ========================================

export const hashPassword = async (password: string): Promise<string> => {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
};

export const comparePassword = async (
    password: string,
    hashedPassword: string
): Promise<boolean> => {
    return await bcrypt.compare(password, hashedPassword);
};

export const generateRandomToken = (length: number = 32): string => {
    return crypto.randomBytes(length).toString("hex");
};

export const generateOTP = (length: number = 6): string => {
    const digits = "0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
};

export const rateLimiter = (maxRequests: number, windowMinutes: number) => {
    return rateLimit({
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        message: {
            error: `Too many requests. Maximum ${maxRequests} requests per ${windowMinutes} minutes allowed.`,
        },
        standardHeaders: true,
        legacyHeaders: false,
    });
};

export function generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export { asyncHandler, CustomError, CustomResponse };
