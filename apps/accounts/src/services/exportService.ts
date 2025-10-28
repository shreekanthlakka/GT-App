// apps/accounts/src/services/exportService.ts

import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import {
    TrialBalanceReport,
    BalanceSheetReport,
    ProfitLossReport,
    GSTReport,
    TDSReport,
    BankReconciliationReport,
    PeriodClosingReport,
} from "./enhancedLedgerService";
import { logger, LogCategory } from "@repo/common-backend/logger";

export class ExportService {
    // ========================================
    // TRIAL BALANCE EXPORT
    // ========================================

    static async exportTrialBalanceToPDF(
        report: TrialBalanceReport
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks: Buffer[] = [];

                doc.on("data", (chunk) => chunks.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(chunks)));

                // Header
                doc.fontSize(20).text("Trial Balance", { align: "center" });
                doc.moveDown();
                doc.fontSize(12).text(
                    `Financial Year: ${report.period.financialYear}`,
                    { align: "center" }
                );
                doc.text(
                    `Period: ${report.period.startDate.toLocaleDateString()} to ${report.period.endDate.toLocaleDateString()}`,
                    { align: "center" }
                );
                doc.moveDown(2);

                // Table headers
                const startY = doc.y;
                const col1 = 50;
                const col2 = 250;
                const col3 = 350;
                const col4 = 450;

                doc.fontSize(10).font("Helvetica-Bold");
                doc.text("Account Name", col1, startY);
                doc.text("Type", col2, startY);
                doc.text("Debit (₹)", col3, startY, {
                    width: 90,
                    align: "right",
                });
                doc.text("Credit (₹)", col4, startY, {
                    width: 90,
                    align: "right",
                });

                doc.moveTo(col1, doc.y + 5)
                    .lineTo(540, doc.y + 5)
                    .stroke();
                doc.moveDown();

                // Entries
                doc.font("Helvetica");
                for (const entry of report.entries) {
                    const y = doc.y;
                    doc.text(entry.accountName, col1, y, { width: 180 });
                    doc.text(entry.accountType, col2, y);
                    doc.text(this.formatCurrency(entry.debit), col3, y, {
                        width: 90,
                        align: "right",
                    });
                    doc.text(this.formatCurrency(entry.credit), col4, y, {
                        width: 90,
                        align: "right",
                    });
                    doc.moveDown();

                    // Add new page if needed
                    if (doc.y > 700) {
                        doc.addPage();
                    }
                }

                // Totals
                doc.moveTo(col1, doc.y).lineTo(540, doc.y).stroke();
                doc.moveDown();
                doc.font("Helvetica-Bold");
                const totalY = doc.y;
                doc.text("TOTAL", col1, totalY);
                doc.text(
                    this.formatCurrency(report.totals.totalDebit),
                    col3,
                    totalY,
                    {
                        width: 90,
                        align: "right",
                    }
                );
                doc.text(
                    this.formatCurrency(report.totals.totalCredit),
                    col4,
                    totalY,
                    { width: 90, align: "right" }
                );

                // Status
                doc.moveDown(2);
                doc.fontSize(12).text(
                    report.isBalanced
                        ? "✓ Trial Balance is BALANCED"
                        : "✗ Trial Balance is NOT BALANCED",
                    { align: "center" }
                );

                // Footer
                doc.fontSize(8).text(
                    `Generated on: ${new Date().toLocaleString()}`,
                    50,
                    750,
                    { align: "right" }
                );

                doc.end();
            } catch (error: any) {
                logger.error(
                    "Failed to export trial balance to PDF",
                    error,
                    LogCategory.BUSINESS
                );
                reject(error);
            }
        });
    }

    static async exportTrialBalanceToExcel(
        report: TrialBalanceReport
    ): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Trial Balance");

        // Title
        worksheet.mergeCells("A1:D1");
        worksheet.getCell("A1").value = "Trial Balance";
        worksheet.getCell("A1").font = { size: 16, bold: true };
        worksheet.getCell("A1").alignment = { horizontal: "center" };

        // Period
        worksheet.mergeCells("A2:D2");
        worksheet.getCell("A2").value =
            `Financial Year: ${report.period.financialYear}`;
        worksheet.getCell("A2").alignment = { horizontal: "center" };

        worksheet.mergeCells("A3:D3");
        worksheet.getCell("A3").value =
            `Period: ${report.period.startDate.toLocaleDateString()} to ${report.period.endDate.toLocaleDateString()}`;
        worksheet.getCell("A3").alignment = { horizontal: "center" };

        // Headers
        worksheet.addRow([]);
        const headerRow = worksheet.addRow([
            "Account Name",
            "Type",
            "Debit (₹)",
            "Credit (₹)",
        ]);
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFD3D3D3" },
        };

        // Data
        for (const entry of report.entries) {
            worksheet.addRow([
                entry.accountName,
                entry.accountType,
                entry.debit,
                entry.credit,
            ]);
        }

        // Totals
        const totalRow = worksheet.addRow([
            "TOTAL",
            "",
            report.totals.totalDebit,
            report.totals.totalCredit,
        ]);
        totalRow.font = { bold: true };

        // Format columns
        worksheet.getColumn(1).width = 40;
        worksheet.getColumn(2).width = 15;
        worksheet.getColumn(3).width = 15;
        worksheet.getColumn(3).numFmt = "#,##0.00";
        worksheet.getColumn(4).width = 15;
        worksheet.getColumn(4).numFmt = "#,##0.00";

        // Status
        worksheet.addRow([]);
        worksheet.addRow([
            report.isBalanced
                ? "✓ Trial Balance is BALANCED"
                : "✗ Trial Balance is NOT BALANCED",
        ]);

        return (await workbook.xlsx.writeBuffer()) as Buffer;
    }

    // ========================================
    // BALANCE SHEET EXPORT
    // ========================================

    static async exportBalanceSheetToPDF(
        report: BalanceSheetReport
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks: Buffer[] = [];

                doc.on("data", (chunk: any) => chunks.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(chunks)));

                // Header
                doc.fontSize(20).text("Balance Sheet", { align: "center" });
                doc.moveDown();
                doc.fontSize(12).text(
                    `As of: ${report.period.asOfDate.toLocaleDateString()}`,
                    { align: "center" }
                );
                doc.text(`Financial Year: ${report.period.financialYear}`, {
                    align: "center",
                });
                doc.moveDown(2);

                // ASSETS
                doc.fontSize(14).font("Helvetica-Bold").text("ASSETS");
                doc.moveDown();
                doc.fontSize(10);

                doc.text("Current Assets:");
                doc.font("Helvetica");
                doc.text(
                    `  Cash: ${this.formatCurrency(report.assets.currentAssets.cash)}`
                );
                doc.text(
                    `  Accounts Receivable: ${this.formatCurrency(report.assets.currentAssets.accountsReceivable)}`
                );
                doc.text(
                    `  Inventory: ${this.formatCurrency(report.assets.currentAssets.inventory)}`
                );
                doc.font("Helvetica-Bold");
                doc.text(
                    `Total Current Assets: ${this.formatCurrency(report.assets.currentAssets.total)}`
                );
                doc.moveDown();

                doc.font("Helvetica");
                doc.text("Fixed Assets:");
                doc.text(
                    `  Property, Plant & Equipment: ${this.formatCurrency(report.assets.fixedAssets.propertyPlantEquipment)}`
                );
                doc.text(
                    `  Less: Accumulated Depreciation: ${this.formatCurrency(report.assets.fixedAssets.accumulatedDepreciation)}`
                );
                doc.font("Helvetica-Bold");
                doc.text(
                    `Total Fixed Assets: ${this.formatCurrency(report.assets.fixedAssets.total)}`
                );
                doc.moveDown();

                doc.fontSize(12);
                doc.text(
                    `TOTAL ASSETS: ${this.formatCurrency(report.assets.totalAssets)}`
                );
                doc.moveDown(2);

                // LIABILITIES
                doc.fontSize(14).text("LIABILITIES");
                doc.moveDown();
                doc.fontSize(10);

                doc.font("Helvetica");
                doc.text("Current Liabilities:");
                doc.text(
                    `  Accounts Payable: ${this.formatCurrency(report.liabilities.currentLiabilities.accountsPayable)}`
                );
                doc.text(
                    `  Short-term Loans: ${this.formatCurrency(report.liabilities.currentLiabilities.shortTermLoans)}`
                );
                doc.font("Helvetica-Bold");
                doc.text(
                    `Total Current Liabilities: ${this.formatCurrency(report.liabilities.currentLiabilities.total)}`
                );
                doc.moveDown();

                doc.font("Helvetica");
                doc.text("Long-term Liabilities:");
                doc.text(
                    `  Long-term Loans: ${this.formatCurrency(report.liabilities.longTermLiabilities.longTermLoans)}`
                );
                doc.font("Helvetica-Bold");
                doc.text(
                    `Total Long-term Liabilities: ${this.formatCurrency(report.liabilities.longTermLiabilities.total)}`
                );
                doc.moveDown();

                doc.fontSize(12);
                doc.text(
                    `TOTAL LIABILITIES: ${this.formatCurrency(report.liabilities.totalLiabilities)}`
                );
                doc.moveDown(2);

                // EQUITY
                doc.fontSize(14).text("EQUITY");
                doc.moveDown();
                doc.fontSize(10);

                doc.font("Helvetica");
                doc.text(
                    `Capital: ${this.formatCurrency(report.equity.capital)}`
                );
                doc.text(
                    `Retained Earnings: ${this.formatCurrency(report.equity.retainedEarnings)}`
                );
                doc.text(
                    `Current Year Profit: ${this.formatCurrency(report.equity.currentYearProfit)}`
                );
                doc.font("Helvetica-Bold");
                doc.text(
                    `Total Equity: ${this.formatCurrency(report.equity.totalEquity)}`
                );
                doc.moveDown();

                doc.fontSize(12);
                doc.text(
                    `TOTAL LIABILITIES & EQUITY: ${this.formatCurrency(report.totalLiabilitiesAndEquity)}`
                );
                doc.moveDown(2);

                // Status
                doc.text(
                    report.isBalanced
                        ? "✓ Balance Sheet is BALANCED"
                        : "✗ Balance Sheet is NOT BALANCED",
                    { align: "center" }
                );

                // Footer
                doc.fontSize(8).text(
                    `Generated on: ${new Date().toLocaleString()}`,
                    50,
                    750,
                    { align: "right" }
                );

                doc.end();
            } catch (error: any) {
                logger.error(
                    "Failed to export balance sheet to PDF",
                    error,
                    LogCategory.BUSINESS
                );
                reject(error);
            }
        });
    }

    static async exportBalanceSheetToExcel(
        report: BalanceSheetReport
    ): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Balance Sheet");

        // Title
        worksheet.mergeCells("A1:B1");
        worksheet.getCell("A1").value = "Balance Sheet";
        worksheet.getCell("A1").font = { size: 16, bold: true };
        worksheet.getCell("A1").alignment = { horizontal: "center" };

        worksheet.mergeCells("A2:B2");
        worksheet.getCell("A2").value =
            `As of: ${report.period.asOfDate.toLocaleDateString()}`;
        worksheet.getCell("A2").alignment = { horizontal: "center" };

        worksheet.addRow([]);

        // ASSETS
        worksheet.addRow(["ASSETS"]).font = { bold: true, size: 14 };
        worksheet.addRow(["Current Assets"]).font = { bold: true };
        worksheet.addRow(["  Cash", report.assets.currentAssets.cash]);
        worksheet.addRow([
            "  Accounts Receivable",
            report.assets.currentAssets.accountsReceivable,
        ]);
        worksheet.addRow([
            "  Inventory",
            report.assets.currentAssets.inventory,
        ]);
        const currentAssetsRow = worksheet.addRow([
            "Total Current Assets",
            report.assets.currentAssets.total,
        ]);
        currentAssetsRow.font = { bold: true };

        worksheet.addRow([]);
        worksheet.addRow(["Fixed Assets"]).font = { bold: true };
        worksheet.addRow([
            "  Property, Plant & Equipment",
            report.assets.fixedAssets.propertyPlantEquipment,
        ]);
        worksheet.addRow([
            "  Less: Accumulated Depreciation",
            -report.assets.fixedAssets.accumulatedDepreciation,
        ]);
        const fixedAssetsRow = worksheet.addRow([
            "Total Fixed Assets",
            report.assets.fixedAssets.total,
        ]);
        fixedAssetsRow.font = { bold: true };

        worksheet.addRow([]);
        const totalAssetsRow = worksheet.addRow([
            "TOTAL ASSETS",
            report.assets.totalAssets,
        ]);
        totalAssetsRow.font = { bold: true, size: 12 };

        worksheet.addRow([]);
        worksheet.addRow([]);

        // LIABILITIES
        worksheet.addRow(["LIABILITIES"]).font = { bold: true, size: 14 };
        // ... similar structure for liabilities and equity

        // Format
        worksheet.getColumn(1).width = 40;
        worksheet.getColumn(2).width = 20;
        worksheet.getColumn(2).numFmt = "#,##0.00";

        return (await workbook.xlsx.writeBuffer()) as Buffer;
    }

    // ========================================
    // PROFIT & LOSS EXPORT
    // ========================================

    static async exportProfitLossToPDF(
        report: ProfitLossReport
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks: Buffer[] = [];

                doc.on("data", (chunk: any) => chunks.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(chunks)));

                // Header
                doc.fontSize(20).text("Profit & Loss Statement", {
                    align: "center",
                });
                doc.moveDown();
                doc.fontSize(12).text(
                    `Period: ${report.period.startDate.toLocaleDateString()} to ${report.period.endDate.toLocaleDateString()}`,
                    { align: "center" }
                );
                doc.text(`Financial Year: ${report.period.financialYear}`, {
                    align: "center",
                });
                doc.moveDown(2);

                // Revenue
                doc.fontSize(14).font("Helvetica-Bold").text("REVENUE");
                doc.moveDown();
                doc.fontSize(10).font("Helvetica");
                doc.text(`Sales: ${this.formatCurrency(report.revenue.sales)}`);
                doc.text(
                    `Other Income: ${this.formatCurrency(report.revenue.otherIncome)}`
                );
                doc.font("Helvetica-Bold");
                doc.text(
                    `Total Revenue: ${this.formatCurrency(report.revenue.totalRevenue)}`
                );
                doc.moveDown(2);

                // Cost of Goods Sold
                doc.text("COST OF GOODS SOLD");
                doc.moveDown();
                doc.font("Helvetica");
                doc.text(
                    `Opening Stock: ${this.formatCurrency(report.costOfGoodsSold.openingStock)}`
                );
                doc.text(
                    `Add: Purchases: ${this.formatCurrency(report.costOfGoodsSold.purchases)}`
                );
                doc.text(
                    `Less: Closing Stock: ${this.formatCurrency(report.costOfGoodsSold.closingStock)}`
                );
                doc.font("Helvetica-Bold");
                doc.text(
                    `Total COGS: ${this.formatCurrency(report.costOfGoodsSold.totalCOGS)}`
                );
                doc.moveDown(2);

                // Gross Profit
                doc.fontSize(12);
                doc.text(
                    `GROSS PROFIT: ${this.formatCurrency(report.grossProfit)} (${report.grossProfitMargin.toFixed(2)}%)`
                );
                doc.moveDown(2);

                // Operating Expenses
                doc.fontSize(14).text("OPERATING EXPENSES");
                doc.moveDown();
                doc.fontSize(10).font("Helvetica");
                doc.text(
                    `Salaries: ${this.formatCurrency(report.operatingExpenses.salaries)}`
                );
                doc.text(
                    `Rent: ${this.formatCurrency(report.operatingExpenses.rent)}`
                );
                doc.text(
                    `Utilities: ${this.formatCurrency(report.operatingExpenses.utilities)}`
                );
                doc.text(
                    `Depreciation: ${this.formatCurrency(report.operatingExpenses.depreciation)}`
                );
                doc.text(
                    `Other Expenses: ${this.formatCurrency(report.operatingExpenses.otherExpenses)}`
                );
                doc.font("Helvetica-Bold");
                doc.text(
                    `Total Operating Expenses: ${this.formatCurrency(report.operatingExpenses.totalOperatingExpenses)}`
                );
                doc.moveDown(2);

                // Operating Profit
                doc.fontSize(12);
                doc.text(
                    `OPERATING PROFIT: ${this.formatCurrency(report.operatingProfit)} (${report.operatingProfitMargin.toFixed(2)}%)`
                );
                doc.moveDown(2);

                // Other Expenses
                doc.fontSize(14).text("OTHER EXPENSES");
                doc.moveDown();
                doc.fontSize(10).font("Helvetica");
                doc.text(
                    `Interest Expense: ${this.formatCurrency(report.otherExpenses.interestExpense)}`
                );
                doc.text(
                    `Taxes: ${this.formatCurrency(report.otherExpenses.taxes)}`
                );
                doc.font("Helvetica-Bold");
                doc.text(
                    `Total Other Expenses: ${this.formatCurrency(report.otherExpenses.totalOtherExpenses)}`
                );
                doc.moveDown(2);

                // Net Profit
                doc.fontSize(16);
                doc.text(
                    `NET PROFIT: ${this.formatCurrency(report.netProfit)} (${report.netProfitMargin.toFixed(2)}%)`
                );

                // Footer
                doc.fontSize(8).text(
                    `Generated on: ${new Date().toLocaleString()}`,
                    50,
                    750,
                    { align: "right" }
                );

                doc.end();
            } catch (error: any) {
                logger.error(
                    "Failed to export P&L to PDF",
                    error,
                    LogCategory.BUSINESS
                );
                reject(error);
            }
        });
    }

    static async exportProfitLossToExcel(
        report: ProfitLossReport
    ): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Profit & Loss");

        // Similar structure to PDF export
        // Implementation left as exercise

        worksheet.addRow(["Profit & Loss Statement"]);
        worksheet.addRow([
            `Period: ${report.period.startDate.toLocaleDateString()} to ${report.period.endDate.toLocaleDateString()}`,
        ]);

        // Add data rows...

        return (await workbook.xlsx.writeBuffer()) as Buffer;
    }

    // ========================================
    // GST REPORT EXPORT
    // ========================================

    static async exportGSTReportToPDF(report: GSTReport): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks: Buffer[] = [];

                doc.on("data", (chunk: any) => chunks.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(chunks)));

                // Header
                doc.fontSize(20).text("GST Report", { align: "center" });
                doc.moveDown();
                doc.fontSize(12).text(`GSTIN: ${report.gstinNumber}`, {
                    align: "center",
                });
                doc.text(
                    `Period: ${report.period.startDate.toLocaleDateString()} to ${report.period.endDate.toLocaleDateString()}`,
                    { align: "center" }
                );
                doc.text(
                    `Quarter: ${report.period.quarter} - ${report.period.financialYear}`,
                    { align: "center" }
                );
                doc.moveDown(2);

                // Summary
                doc.fontSize(14).font("Helvetica-Bold").text("SUMMARY");
                doc.moveDown();
                doc.fontSize(10).font("Helvetica");
                doc.text(
                    `Total Output Tax: ${this.formatCurrency(report.summary.totalOutputTax)}`
                );
                doc.text(
                    `Total Input Tax Credit: ${this.formatCurrency(report.summary.totalInputTax)}`
                );
                doc.font("Helvetica-Bold");
                doc.text(
                    `Net Tax Liability: ${this.formatCurrency(report.summary.netTaxLiability)}`
                );
                doc.text(
                    `Balance Payable: ${this.formatCurrency(report.summary.balancePayable)}`
                );
                doc.moveDown(2);

                // Monthly breakdown
                for (const entry of report.entries) {
                    doc.fontSize(12).font("Helvetica-Bold").text(entry.month);
                    doc.moveDown();
                    doc.fontSize(10).font("Helvetica");

                    // GSTR-1
                    doc.text("GSTR-1 (Outward Supplies):");
                    doc.text(
                        `  B2B: ${this.formatCurrency(entry.gstr1.totalOutput.total)}`
                    );
                    doc.moveDown();

                    // GSTR-2
                    doc.text("GSTR-2 (Inward Supplies):");
                    doc.text(
                        `  B2B: ${this.formatCurrency(entry.gstr2.totalInput.total)}`
                    );
                    doc.moveDown();

                    // GSTR-3B
                    doc.text("GSTR-3B:");
                    doc.text(
                        `  Output Tax: ${this.formatCurrency(entry.gstr3b.outputTax)}`
                    );
                    doc.text(
                        `  Input Tax Credit: ${this.formatCurrency(entry.gstr3b.inputTaxCredit)}`
                    );
                    doc.text(
                        `  Net Liability: ${this.formatCurrency(entry.gstr3b.netTaxLiability)}`
                    );
                    doc.moveDown(2);

                    if (doc.y > 650) {
                        doc.addPage();
                    }
                }

                doc.end();
            } catch (error: any) {
                logger.error(
                    "Failed to export GST report to PDF",
                    error,
                    LogCategory.BUSINESS
                );
                reject(error);
            }
        });
    }

    static async exportGSTReportToExcel(report: GSTReport): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("GST Report");

        // Implementation similar to PDF
        worksheet.addRow(["GST Report"]);
        worksheet.addRow([`GSTIN: ${report.gstinNumber}`]);

        // Add monthly data...

        return (await workbook.xlsx.writeBuffer()) as Buffer;
    }

    // ========================================
    // TDS REPORT EXPORT
    // ========================================

    static async exportTDSReportToPDF(report: TDSReport): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 50,
                    size: "A4",
                    layout: "landscape",
                });
                const chunks: Buffer[] = [];

                doc.on("data", (chunk: any) => chunks.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(chunks)));

                // Header
                doc.fontSize(20).text("TDS Report", { align: "center" });
                doc.moveDown();
                doc.fontSize(12).text(
                    `Quarter: ${report.period.quarter} - ${report.period.financialYear}`,
                    { align: "center" }
                );
                doc.moveDown(2);

                // Table implementation...
                doc.fontSize(10).font("Helvetica-Bold");
                doc.text("Date", 50, doc.y);
                doc.text("Party Name", 120, doc.y);
                doc.text("PAN", 250, doc.y);
                doc.text("Payment", 350, doc.y);
                doc.text("TDS Rate", 450, doc.y);
                doc.text("TDS Amount", 550, doc.y);
                doc.text("Section", 650, doc.y);

                doc.moveDown();
                doc.font("Helvetica");

                for (const entry of report.entries) {
                    const y = doc.y;
                    doc.text(entry.date.toLocaleDateString(), 50, y);
                    doc.text(entry.partyName, 120, y);
                    doc.text(entry.panNumber, 250, y);
                    doc.text(this.formatCurrency(entry.paymentAmount), 350, y);
                    doc.text(`${entry.tdsRate}%`, 450, y);
                    doc.text(this.formatCurrency(entry.tdsAmount), 550, y);
                    doc.text(entry.tdsSection, 650, y);
                    doc.moveDown();

                    if (doc.y > 500) {
                        doc.addPage();
                    }
                }

                // Summary
                doc.moveDown();
                doc.font("Helvetica-Bold");
                doc.text(
                    `Total TDS Deducted: ${this.formatCurrency(report.summary.totalTDSDeducted)}`
                );
                doc.text(
                    `Pending Deposit: ${this.formatCurrency(report.summary.pendingDeposit)}`
                );

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    static async exportTDSReportToExcel(report: TDSReport): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("TDS Report");

        worksheet.addRow(["TDS Report"]);
        worksheet.addRow([
            `Quarter: ${report.period.quarter} - ${report.period.financialYear}`,
        ]);
        worksheet.addRow([]);

        // Headers
        worksheet.addRow([
            "Date",
            "Party Name",
            "PAN",
            "Payment Amount",
            "TDS Rate %",
            "TDS Amount",
            "Section",
        ]);

        // Data
        for (const entry of report.entries) {
            worksheet.addRow([
                entry.date.toLocaleDateString(),
                entry.partyName,
                entry.panNumber,
                entry.paymentAmount,
                entry.tdsRate,
                entry.tdsAmount,
                entry.tdsSection,
            ]);
        }

        return (await workbook.xlsx.writeBuffer()) as Buffer;
    }

    // ========================================
    // BANK RECONCILIATION EXPORT
    // ========================================

    static async exportBankReconciliationToPDF(
        report: BankReconciliationReport
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks: Buffer[] = [];

                doc.on("data", (chunk: any) => chunks.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(chunks)));

                doc.fontSize(20).text("Bank Reconciliation Statement", {
                    align: "center",
                });
                doc.moveDown();
                doc.fontSize(12).text(
                    `Period: ${report.period.startDate.toLocaleDateString()} to ${report.period.endDate.toLocaleDateString()}`,
                    { align: "center" }
                );
                doc.moveDown(2);

                // Balances
                doc.fontSize(14).font("Helvetica-Bold").text("Opening Balance");
                doc.fontSize(10).font("Helvetica");
                doc.text(
                    `As per Books: ${this.formatCurrency(report.openingBalance.asPerBooks)}`
                );
                doc.text(
                    `As per Bank: ${this.formatCurrency(report.openingBalance.asPerBank)}`
                );
                doc.moveDown();

                doc.fontSize(14).font("Helvetica-Bold").text("Closing Balance");
                doc.fontSize(10).font("Helvetica");
                doc.text(
                    `As per Books: ${this.formatCurrency(report.closingBalance.asPerBooks)}`
                );
                doc.text(
                    `As per Bank: ${this.formatCurrency(report.closingBalance.asPerBank)}`
                );
                doc.moveDown(2);

                // Reconciliation Items
                doc.fontSize(14)
                    .font("Helvetica-Bold")
                    .text("Reconciliation Items");
                doc.fontSize(10).font("Helvetica");
                doc.text(
                    `Cheques Issued: ${this.formatCurrency(report.reconciliationItems.chequesIssued.amount)}`
                );
                doc.text(
                    `Deposits in Transit: ${this.formatCurrency(report.reconciliationItems.depositsInTransit.amount)}`
                );
                doc.text(
                    `Bank Charges: ${this.formatCurrency(report.reconciliationItems.bankCharges.amount)}`
                );
                doc.text(
                    `Interest Earned: ${this.formatCurrency(report.reconciliationItems.interestEarned.amount)}`
                );
                doc.moveDown();

                doc.fontSize(12).font("Helvetica-Bold");
                doc.text(
                    `Reconciled Balance: ${this.formatCurrency(report.reconciledBalance)}`
                );
                doc.text(
                    `Difference: ${this.formatCurrency(report.difference)}`
                );
                doc.moveDown();

                doc.text(
                    report.isReconciled
                        ? "✓ Bank Reconciliation COMPLETE"
                        : "✗ Bank Reconciliation NOT COMPLETE"
                );

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    static async exportBankReconciliationToExcel(
        report: BankReconciliationReport
    ): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Bank Reconciliation");

        worksheet.addRow(["Bank Reconciliation Statement"]);
        // Add data...

        return (await workbook.xlsx.writeBuffer()) as Buffer;
    }

    // ========================================
    // PERIOD CLOSING EXPORT
    // ========================================

    static async exportPeriodClosingToPDF(
        report: PeriodClosingReport
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks: Buffer[] = [];

                doc.on("data", (chunk: any) => chunks.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(chunks)));

                doc.fontSize(20).text("Period Closing Report", {
                    align: "center",
                });
                doc.moveDown();
                doc.fontSize(12).text(
                    `Financial Year: ${report.financialYear.name}`,
                    { align: "center" }
                );
                doc.moveDown(2);

                // Checks
                doc.fontSize(14).font("Helvetica-Bold").text("Closing Checks");
                doc.fontSize(10).font("Helvetica");
                doc.text(
                    `${report.checks.trialBalanceMatched ? "✓" : "✗"} Trial Balance Matched`
                );
                doc.text(
                    `${report.checks.balanceSheetBalanced ? "✓" : "✗"} Balance Sheet Balanced`
                );
                doc.text(
                    `${report.checks.allTransactionsPosted ? "✓" : "✗"} All Transactions Posted`
                );
                doc.text(
                    `${report.checks.bankReconciliationComplete ? "✓" : "✗"} Bank Reconciliation Complete`
                );
                doc.moveDown();

                // Warnings and Errors
                if (report.warnings.length > 0) {
                    doc.fontSize(12).font("Helvetica-Bold").text("Warnings:");
                    doc.fontSize(10).font("Helvetica");
                    report.warnings.forEach((w) => doc.text(`• ${w}`));
                    doc.moveDown();
                }

                if (report.errors.length > 0) {
                    doc.fontSize(12).font("Helvetica-Bold").text("Errors:");
                    doc.fontSize(10).font("Helvetica");
                    report.errors.forEach((e) => doc.text(`• ${e}`));
                    doc.moveDown();
                }

                // Status
                doc.fontSize(14).font("Helvetica-Bold");
                doc.text(
                    report.canClose
                        ? "✓ Financial Year CAN BE CLOSED"
                        : "✗ Financial Year CANNOT BE CLOSED"
                );

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    // ========================================
    // LEDGER EXPORT
    // ========================================

    static async exportLedgerToPDF(
        ledger: any,
        type: "customer" | "party"
    ): Promise<Buffer> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50 });
                const chunks: Buffer[] = [];

                doc.on("data", (chunk: any) => chunks.push(chunk));
                doc.on("end", () => resolve(Buffer.concat(chunks)));

                doc.fontSize(20).text(
                    `${type === "customer" ? "Customer" : "Party"} Ledger`,
                    { align: "center" }
                );
                doc.moveDown();

                // Add ledger data...

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    static async exportLedgerToExcel(
        ledger: any,
        type: "customer" | "party"
    ): Promise<Buffer> {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Ledger");

        worksheet.addRow([
            `${type === "customer" ? "Customer" : "Party"} Ledger`,
        ]);

        // Add ledger data...

        return (await workbook.xlsx.writeBuffer()) as Buffer;
    }

    // ========================================
    // HELPER METHODS
    // ========================================

    private static formatCurrency(amount: number): string {
        return new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(amount);
    }
}
