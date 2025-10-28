// apps/accounts/src/controllers/financialReportsController.ts

import { Request, Response } from "express";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { EnhancedLedgerService } from "../services/enhancedLedgerService";
import { ExportService } from "../services/exportService";
import { LedgerService } from "../services/ledgerService";
// ========================================
// TRIAL BALANCE
// ========================================

/**
 * Get Trial Balance
 * GET /api/financial-reports/trial-balance
 */
export const getTrialBalance = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { startDate, endDate, format } = req.query;

        if (!startDate || !endDate) {
            throw new CustomError(400, "Start date and end date are required");
        }

        const report = await EnhancedLedgerService.getTrialBalance(
            userId,
            new Date(startDate as string),
            new Date(endDate as string)
        );

        // Export if format is specified
        if (format === "pdf") {
            const pdfBuffer =
                await ExportService.exportTrialBalanceToPDF(report);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="trial-balance-${report.period.financialYear}.pdf"`
            );
            res.send(pdfBuffer);
            return;
        }

        if (format === "excel") {
            const excelBuffer =
                await ExportService.exportTrialBalanceToExcel(report);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="trial-balance-${report.period.financialYear}.xlsx"`
            );
            res.send(excelBuffer);
            return;
        }

        const response = new CustomResponse(
            200,
            "Trial balance generated successfully",
            { report }
        );
        res.status(response.statusCode).json(response);
    }
);

// ========================================
// BALANCE SHEET
// ========================================

/**
 * Get Balance Sheet
 * GET /api/financial-reports/balance-sheet
 */
export const getBalanceSheet = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { asOfDate, format } = req.query;

        if (!asOfDate) {
            throw new CustomError(400, "As of date is required");
        }

        const report = await EnhancedLedgerService.getBalanceSheet(
            userId,
            new Date(asOfDate as string)
        );

        // Export if format is specified
        if (format === "pdf") {
            const pdfBuffer =
                await ExportService.exportBalanceSheetToPDF(report);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="balance-sheet-${report.period.financialYear}.pdf"`
            );
            res.send(pdfBuffer);
            return;
        }

        if (format === "excel") {
            const excelBuffer =
                await ExportService.exportBalanceSheetToExcel(report);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="balance-sheet-${report.period.financialYear}.xlsx"`
            );
            res.send(excelBuffer);
            return;
        }

        const response = new CustomResponse(
            200,
            "Balance sheet generated successfully",
            { report }
        );
        res.status(response.statusCode).json(response);
    }
);

// ========================================
// PROFIT & LOSS
// ========================================

/**
 * Get Profit & Loss Statement
 * GET /api/financial-reports/profit-loss
 */
export const getProfitLoss = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { startDate, endDate, format } = req.query;

        if (!startDate || !endDate) {
            throw new CustomError(400, "Start date and end date are required");
        }

        const report = await EnhancedLedgerService.getProfitLoss(
            userId,
            new Date(startDate as string),
            new Date(endDate as string)
        );

        // Export if format is specified
        if (format === "pdf") {
            const pdfBuffer = await ExportService.exportProfitLossToPDF(report);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="profit-loss-${report.period.financialYear}.pdf"`
            );
            res.send(pdfBuffer);
            return;
        }

        if (format === "excel") {
            const excelBuffer =
                await ExportService.exportProfitLossToExcel(report);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="profit-loss-${report.period.financialYear}.xlsx"`
            );
            res.send(excelBuffer);
            return;
        }

        const response = new CustomResponse(
            200,
            "Profit & Loss statement generated successfully",
            { report }
        );
        res.status(response.statusCode).json(response);
    }
);

// ========================================
// GST REPORT
// ========================================

/**
 * Get GST Report
 * GET /api/financial-reports/gst-report
 */
export const getGSTReport = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { startDate, endDate, gstinNumber, format } = req.query;

        if (!startDate || !endDate) {
            throw new CustomError(400, "Start date and end date are required");
        }

        if (!gstinNumber) {
            throw new CustomError(400, "GSTIN number is required");
        }

        const report = await EnhancedLedgerService.getGSTReport(
            userId,
            new Date(startDate as string),
            new Date(endDate as string),
            gstinNumber as string
        );

        // Export if format is specified
        if (format === "pdf") {
            const pdfBuffer = await ExportService.exportGSTReportToPDF(report);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="gst-report-${report.period.quarter}-${report.period.financialYear}.pdf"`
            );
            res.send(pdfBuffer);
            return;
        }

        if (format === "excel") {
            const excelBuffer =
                await ExportService.exportGSTReportToExcel(report);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="gst-report-${report.period.quarter}-${report.period.financialYear}.xlsx"`
            );
            res.send(excelBuffer);
            return;
        }

        const response = new CustomResponse(
            200,
            "GST report generated successfully",
            { report }
        );
        res.status(response.statusCode).json(response);
    }
);

// ========================================
// TDS REPORT
// ========================================

/**
 * Get TDS Report
 * GET /api/financial-reports/tds-report
 */
export const getTDSReport = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { startDate, endDate, format } = req.query;

        if (!startDate || !endDate) {
            throw new CustomError(400, "Start date and end date are required");
        }

        const report = await EnhancedLedgerService.getTDSReport(
            userId,
            new Date(startDate as string),
            new Date(endDate as string)
        );

        // Export if format is specified
        if (format === "pdf") {
            const pdfBuffer = await ExportService.exportTDSReportToPDF(report);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="tds-report-${report.period.quarter}-${report.period.financialYear}.pdf"`
            );
            res.send(pdfBuffer);
            return;
        }

        if (format === "excel") {
            const excelBuffer =
                await ExportService.exportTDSReportToExcel(report);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="tds-report-${report.period.quarter}-${report.period.financialYear}.xlsx"`
            );
            res.send(excelBuffer);
            return;
        }

        const response = new CustomResponse(
            200,
            "TDS report generated successfully",
            { report }
        );
        res.status(response.statusCode).json(response);
    }
);

// ========================================
// BANK RECONCILIATION
// ========================================

/**
 * Perform Bank Reconciliation
 * POST /api/financial-reports/bank-reconciliation
 */
export const performBankReconciliation = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { startDate, endDate, bankStatementTransactions, format } =
            req.body;

        if (!startDate || !endDate) {
            throw new CustomError(400, "Start date and end date are required");
        }

        if (
            !bankStatementTransactions ||
            !Array.isArray(bankStatementTransactions)
        ) {
            throw new CustomError(
                400,
                "Bank statement transactions are required"
            );
        }

        // Convert date strings to Date objects
        const transactions = bankStatementTransactions.map((t: any) => ({
            ...t,
            date: new Date(t.date),
        }));

        const report = await EnhancedLedgerService.reconcileBank(
            userId,
            new Date(startDate),
            new Date(endDate),
            transactions
        );

        // Export if format is specified
        if (format === "pdf") {
            const pdfBuffer =
                await ExportService.exportBankReconciliationToPDF(report);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="bank-reconciliation-${startDate}-${endDate}.pdf"`
            );
            res.send(pdfBuffer);
            return;
        }

        if (format === "excel") {
            const excelBuffer =
                await ExportService.exportBankReconciliationToExcel(report);
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="bank-reconciliation-${startDate}-${endDate}.xlsx"`
            );
            res.send(excelBuffer);
            return;
        }

        const response = new CustomResponse(
            200,
            "Bank reconciliation completed successfully",
            { report }
        );
        res.status(response.statusCode).json(response);
    }
);

// ========================================
// FINANCIAL YEAR MANAGEMENT
// ========================================

/**
 * Get Financial Years
 * GET /api/financial-reports/financial-years
 */
export const getFinancialYears = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const financialYears =
            await EnhancedLedgerService.getFinancialYears(userId);

        const response = new CustomResponse(
            200,
            "Financial years retrieved successfully",
            { financialYears }
        );
        res.status(response.statusCode).json(response);
    }
);

/**
 * Create Financial Year
 * POST /api/financial-reports/financial-years
 */
export const createFinancialYear = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { startDate, endDate } = req.body;

        if (!startDate || !endDate) {
            throw new CustomError(400, "Start date and end date are required");
        }

        const financialYear = await EnhancedLedgerService.createFinancialYear(
            userId,
            new Date(startDate),
            new Date(endDate)
        );

        const response = new CustomResponse(
            201,
            "Financial year created successfully",
            { financialYear }
        );
        res.status(response.statusCode).json(response);
    }
);

// ========================================
// PERIOD CLOSING
// ========================================

/**
 * Close Financial Year
 * POST /api/financial-reports/period-closing/:financialYearId
 */
export const closeFinancialYear = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { financialYearId } = req.params;
        const { format } = req.query;

        if (!financialYearId) {
            throw new CustomError(400, "Financial year ID is required");
        }

        const closingReport = await EnhancedLedgerService.closeFinancialYear(
            userId,
            financialYearId
        );

        if (!closingReport.canClose) {
            throw new CustomError(
                400,
                `Cannot close financial year: ${closingReport.errors.join(", ")}`
            );
        }

        // Export if format is specified
        if (format === "pdf") {
            const pdfBuffer =
                await ExportService.exportPeriodClosingToPDF(closingReport);
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="period-closing-${closingReport.financialYear.name}.pdf"`
            );
            res.send(pdfBuffer);
            return;
        }

        const response = new CustomResponse(
            200,
            "Financial year closed successfully",
            { closingReport }
        );
        res.status(response.statusCode).json(response);
    }
);

/**
 * Get Period Closing Preview
 * GET /api/financial-reports/period-closing-preview/:financialYearId
 */
export const getPeriodClosingPreview = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { financialYearId } = req.params;

        if (!financialYearId) {
            throw new CustomError(400, "Financial year ID is required");
        }

        const closingReport = await EnhancedLedgerService.closeFinancialYear(
            userId,
            financialYearId
        );

        const response = new CustomResponse(
            200,
            "Period closing preview generated successfully",
            { closingReport }
        );
        res.status(response.statusCode).json(response);
    }
);

// ========================================
// LEDGER EXPORT
// ========================================

/**
 * Export Customer Ledger
 * GET /api/financial-reports/export-customer-ledger/:customerId
 */
export const exportCustomerLedger = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { customerId } = req.params;
        const { startDate, endDate, format } = req.query;

        if (!customerId) {
            throw new CustomError(400, "Customer ID is required");
        }

        if (!startDate || !endDate) {
            throw new CustomError(400, "Start date and end date are required");
        }

        // Import ledger service to get ledger data
        // const { LedgerService } = await import("../services/ledgerService");
        const ledger = await LedgerService.getCustomerLedger(
            userId,
            customerId,
            new Date(startDate as string),
            new Date(endDate as string)
        );

        if (format === "pdf") {
            const pdfBuffer = await ExportService.exportLedgerToPDF(
                ledger,
                "customer"
            );
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="customer-ledger-${customerId}.pdf"`
            );
            res.send(pdfBuffer);
            return;
        }

        if (format === "excel") {
            const excelBuffer = await ExportService.exportLedgerToExcel(
                ledger,
                "customer"
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="customer-ledger-${customerId}.xlsx"`
            );
            res.send(excelBuffer);
            return;
        }

        throw new CustomError(400, "Invalid format. Use 'pdf' or 'excel'");
    }
);

/**
 * Export Party Ledger
 * GET /api/financial-reports/export-party-ledger/:partyId
 */
export const exportPartyLedger = asyncHandler(
    async (req: Request, res: Response) => {
        const userId = req.user?.userId;
        if (!userId) {
            throw new CustomError(401, "Unauthorized");
        }

        const { partyId } = req.params;
        const { startDate, endDate, format } = req.query;

        if (!partyId) {
            throw new CustomError(400, "Party ID is required");
        }

        if (!startDate || !endDate) {
            throw new CustomError(400, "Start date and end date are required");
        }

        const { LedgerService } = await import("../services/ledgerService");
        const ledger = await LedgerService.getPartyLedger(
            userId,
            partyId,
            new Date(startDate as string),
            new Date(endDate as string)
        );

        if (format === "pdf") {
            const pdfBuffer = await ExportService.exportLedgerToPDF(
                ledger,
                "party"
            );
            res.setHeader("Content-Type", "application/pdf");
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="party-ledger-${partyId}.pdf"`
            );
            res.send(pdfBuffer);
            return;
        }

        if (format === "excel") {
            const excelBuffer = await ExportService.exportLedgerToExcel(
                ledger,
                "party"
            );
            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="party-ledger-${partyId}.xlsx"`
            );
            res.send(excelBuffer);
            return;
        }

        throw new CustomError(400, "Invalid format. Use 'pdf' or 'excel'");
    }
);
