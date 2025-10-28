// apps/accounts/src/routes/financialReportsRoutes.ts

import express from "express";
import { authenticate } from "@repo/common-backend/middleware";
import {
    validateDateRange,
    validateAsOfDate,
    validateGSTINNumber,
    validateFinancialYearId,
} from "@repo/common-backend/financialValidators";
import * as financialReportsController from "../controllers/financialReportController";

const router = express.Router();

// ========================================
// TRIAL BALANCE
// ========================================

/**
 * @route   GET /api/v1/financial-reports/trial-balance
 * @desc    Get Trial Balance
 * @access  Private
 * @query   {
 *            startDate: string (ISO date),
 *            endDate: string (ISO date),
 *            format?: 'json' | 'pdf' | 'excel'
 *          }
 * @returns Trial balance report or file download
 */
router.get(
    "/trial-balance",
    authenticate,
    validateDateRange,
    financialReportsController.getTrialBalance
);

// ========================================
// BALANCE SHEET
// ========================================

/**
 * @route   GET /api/v1/financial-reports/balance-sheet
 * @desc    Get Balance Sheet
 * @access  Private
 * @query   {
 *            asOfDate: string (ISO date),
 *            format?: 'json' | 'pdf' | 'excel'
 *          }
 * @returns Balance sheet report or file download
 */
router.get(
    "/balance-sheet",
    authenticate,
    validateAsOfDate,
    financialReportsController.getBalanceSheet
);

// ========================================
// PROFIT & LOSS
// ========================================

/**
 * @route   GET /api/v1/financial-reports/profit-loss
 * @desc    Get Profit & Loss Statement
 * @access  Private
 * @query   {
 *            startDate: string (ISO date),
 *            endDate: string (ISO date),
 *            format?: 'json' | 'pdf' | 'excel'
 *          }
 * @returns P&L report or file download
 */
router.get(
    "/profit-loss",
    authenticate,
    validateDateRange,
    financialReportsController.getProfitLoss
);

// ========================================
// GST REPORT
// ========================================

/**
 * @route   GET /api/v1/financial-reports/gst-report
 * @desc    Get GST Report (GSTR-1, GSTR-2, GSTR-3B)
 * @access  Private
 * @query   {
 *            startDate: string (ISO date),
 *            endDate: string (ISO date),
 *            gstinNumber: string,
 *            format?: 'json' | 'pdf' | 'excel'
 *          }
 * @returns GST report with monthly breakdown or file download
 */
router.get(
    "/gst-report",
    authenticate,
    validateDateRange,
    validateGSTINNumber,
    financialReportsController.getGSTReport
);

// ========================================
// TDS REPORT
// ========================================

/**
 * @route   GET /api/v1/financial-reports/tds-report
 * @desc    Get TDS Report (Quarterly)
 * @access  Private
 * @query   {
 *            startDate: string (ISO date),
 *            endDate: string (ISO date),
 *            format?: 'json' | 'pdf' | 'excel'
 *          }
 * @returns TDS report with all deductions or file download
 */
router.get(
    "/tds-report",
    authenticate,
    validateDateRange,
    financialReportsController.getTDSReport
);

// ========================================
// BANK RECONCILIATION
// ========================================

/**
 * @route   POST /api/v1/financial-reports/bank-reconciliation
 * @desc    Perform Bank Reconciliation
 * @access  Private
 * @body    {
 *            startDate: string (ISO date),
 *            endDate: string (ISO date),
 *            bankStatementTransactions: Array<{
 *              date: string,
 *              description: string,
 *              debit: number,
 *              credit: number,
 *              balance: number
 *            }>,
 *            format?: 'json' | 'pdf' | 'excel'
 *          }
 * @returns Bank reconciliation report or file download
 */
router.post(
    "/bank-reconciliation",
    authenticate,
    financialReportsController.performBankReconciliation
);

// ========================================
// FINANCIAL YEAR MANAGEMENT
// ========================================

/**
 * @route   GET /api/v1/financial-reports/financial-years
 * @desc    Get all Financial Years
 * @access  Private
 * @returns List of financial years
 */
router.get(
    "/financial-years",
    authenticate,
    financialReportsController.getFinancialYears
);

/**
 * @route   POST /api/v1/financial-reports/financial-years
 * @desc    Create a new Financial Year
 * @access  Private (Owner/Manager only)
 * @body    {
 *            startDate: string (ISO date),
 *            endDate: string (ISO date)
 *          }
 * @returns Created financial year
 */
router.post(
    "/financial-years",
    authenticate,
    financialReportsController.createFinancialYear
);

// ========================================
// PERIOD CLOSING
// ========================================

/**
 * @route   GET /api/v1/financial-reports/period-closing-preview/:financialYearId
 * @desc    Get Period Closing Preview (checks before closing)
 * @access  Private (Owner/Manager only)
 * @returns Period closing report with checks, warnings, and errors
 */
router.get(
    "/period-closing-preview/:financialYearId",
    authenticate,
    validateFinancialYearId,
    financialReportsController.getPeriodClosingPreview
);

/**
 * @route   POST /api/v1/financial-reports/period-closing/:financialYearId
 * @desc    Close Financial Year
 * @access  Private (Owner only)
 * @query   { format?: 'json' | 'pdf' }
 * @returns Period closing report or PDF download
 */
router.post(
    "/period-closing/:financialYearId",
    authenticate,
    validateFinancialYearId,
    financialReportsController.closeFinancialYear
);

// ========================================
// LEDGER EXPORT
// ========================================

/**
 * @route   GET /api/v1/financial-reports/export-customer-ledger/:customerId
 * @desc    Export Customer Ledger to PDF or Excel
 * @access  Private
 * @query   {
 *            startDate: string (ISO date),
 *            endDate: string (ISO date),
 *            format: 'pdf' | 'excel'
 *          }
 * @returns PDF or Excel file download
 */
router.get(
    "/export-customer-ledger/:customerId",
    authenticate,
    validateDateRange,
    financialReportsController.exportCustomerLedger
);

/**
 * @route   GET /api/v1/financial-reports/export-party-ledger/:partyId
 * @desc    Export Party Ledger to PDF or Excel
 * @access  Private
 * @query   {
 *            startDate: string (ISO date),
 *            endDate: string (ISO date),
 *            format: 'pdf' | 'excel'
 *          }
 * @returns PDF or Excel file download
 */
router.get(
    "/export-party-ledger/:partyId",
    authenticate,
    validateDateRange,
    financialReportsController.exportPartyLedger
);

export default router;
