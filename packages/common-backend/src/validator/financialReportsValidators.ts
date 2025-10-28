// packages/common-backend/src/validators/financialReportsValidators.ts

import { Request, Response, NextFunction } from "express";
import { CustomError } from "../utils/index";

/**
 * Validate date range query parameters
 */
export const validateDateRange = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { startDate, endDate } = req.query;

    if (!startDate) {
        throw new CustomError(400, "Start date is required");
    }

    if (!endDate) {
        throw new CustomError(400, "End date is required");
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);

    if (isNaN(start.getTime())) {
        throw new CustomError(400, "Invalid start date format");
    }

    if (isNaN(end.getTime())) {
        throw new CustomError(400, "Invalid end date format");
    }

    if (start > end) {
        throw new CustomError(
            400,
            "Start date must be before or equal to end date"
        );
    }

    // Check if date range is reasonable (max 5 years)
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365);

    if (diffYears > 5) {
        throw new CustomError(400, "Date range cannot exceed 5 years");
    }

    next();
};

/**
 * Validate asOfDate query parameter
 */
export const validateAsOfDate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { asOfDate } = req.query;

    if (!asOfDate) {
        throw new CustomError(400, "As of date is required");
    }

    const date = new Date(asOfDate as string);

    if (isNaN(date.getTime())) {
        throw new CustomError(400, "Invalid date format");
    }

    // Date should not be in the future
    if (date > new Date()) {
        throw new CustomError(400, "Date cannot be in the future");
    }

    next();
};

/**
 * Validate GSTIN number
 */
export const validateGSTINNumber = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { gstinNumber } = req.query;

    if (!gstinNumber) {
        throw new CustomError(400, "GSTIN number is required");
    }

    const gstinPattern =
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/;

    if (!gstinPattern.test(gstinNumber as string)) {
        throw new CustomError(
            400,
            "Invalid GSTIN format. Format: 22AAAAA0000A1Z5"
        );
    }

    next();
};

/**
 * Validate financial year ID parameter
 */
export const validateFinancialYearId = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { financialYearId } = req.params;

    if (!financialYearId) {
        throw new CustomError(400, "Financial year ID is required");
    }

    if (typeof financialYearId !== "string" || financialYearId.trim() === "") {
        throw new CustomError(400, "Invalid financial year ID");
    }

    next();
};

/**
 * Validate bank reconciliation request body
 */
export const validateBankReconciliationRequest = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { startDate, endDate, bankStatementTransactions } = req.body;

    if (!startDate || !endDate) {
        throw new CustomError(400, "Start date and end date are required");
    }

    if (!bankStatementTransactions) {
        throw new CustomError(400, "Bank statement transactions are required");
    }

    if (!Array.isArray(bankStatementTransactions)) {
        throw new CustomError(
            400,
            "Bank statement transactions must be an array"
        );
    }

    if (bankStatementTransactions.length === 0) {
        throw new CustomError(
            400,
            "Bank statement transactions cannot be empty"
        );
    }

    // Validate each transaction
    for (let i = 0; i < bankStatementTransactions.length; i++) {
        const txn = bankStatementTransactions[i];

        if (!txn.date) {
            throw new CustomError(
                400,
                `Transaction at index ${i} is missing date`
            );
        }

        if (typeof txn.debit !== "number" && typeof txn.credit !== "number") {
            throw new CustomError(
                400,
                `Transaction at index ${i} must have debit or credit amount`
            );
        }

        if (typeof txn.balance !== "number") {
            throw new CustomError(
                400,
                `Transaction at index ${i} is missing balance`
            );
        }

        if (!txn.description) {
            throw new CustomError(
                400,
                `Transaction at index ${i} is missing description`
            );
        }
    }

    next();
};

/**
 * Validate export format query parameter
 */
export const validateExportFormat = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { format } = req.query;

    if (format && !["json", "pdf", "excel"].includes(format as string)) {
        throw new CustomError(
            400,
            "Invalid format. Must be 'json', 'pdf', or 'excel'"
        );
    }

    next();
};

/**
 * Validate customer ID parameter
 */
export const validateCustomerId = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { customerId } = req.params;

    if (!customerId) {
        throw new CustomError(400, "Customer ID is required");
    }

    if (typeof customerId !== "string" || customerId.trim() === "") {
        throw new CustomError(400, "Invalid customer ID");
    }

    next();
};

/**
 * Validate party ID parameter
 */
export const validatePartyId = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { partyId } = req.params;

    if (!partyId) {
        throw new CustomError(400, "Party ID is required");
    }

    if (typeof partyId !== "string" || partyId.trim() === "") {
        throw new CustomError(400, "Invalid party ID");
    }

    next();
};

/**
 * Validate create financial year request
 */
export const validateCreateFinancialYear = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { startDate, endDate } = req.body;

    if (!startDate) {
        throw new CustomError(400, "Start date is required");
    }

    if (!endDate) {
        throw new CustomError(400, "End date is required");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime())) {
        throw new CustomError(400, "Invalid start date format");
    }

    if (isNaN(end.getTime())) {
        throw new CustomError(400, "Invalid end date format");
    }

    if (start >= end) {
        throw new CustomError(400, "End date must be after start date");
    }

    // Financial year should typically be 12 months
    const diffTime = end.getTime() - start.getTime();
    const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30);

    if (diffMonths < 11 || diffMonths > 13) {
        throw new CustomError(
            400,
            "Financial year must be approximately 12 months"
        );
    }

    // For Indian FY, should start on April 1st
    if (start.getMonth() !== 3 || start.getDate() !== 1) {
        throw new CustomError(
            400,
            "Financial year must start on April 1st (Indian FY)"
        );
    }

    // Should end on March 31st
    if (end.getMonth() !== 2 || end.getDate() !== 31) {
        throw new CustomError(
            400,
            "Financial year must end on March 31st (Indian FY)"
        );
    }

    next();
};

/**
 * Validate TDS section
 */
export const validateTDSSection = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const { section } = req.query;

    if (!section) {
        return next(); // Optional parameter
    }

    const validSections = [
        "194A", // Interest other than on securities
        "194C", // Payment to contractors
        "194D", // Insurance commission
        "194H", // Commission or brokerage
        "194I", // Rent
        "194J", // Professional or technical services
        "194LA", // Payment for acquisition of immovable property
    ];

    if (!validSections.includes(section as string)) {
        throw new CustomError(
            400,
            `Invalid TDS section. Valid sections: ${validSections.join(", ")}`
        );
    }

    next();
};
