// apps/accounts/src/services/enhancedLedgerService.ts
// UPDATED VERSION - Integrates with existing ledgerService.ts

import { prisma } from "@repo/db/prisma";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { CustomError } from "@repo/common-backend/utils";
import { LedgerService } from "./ledgerService";
import {
    LedgerEntry,
    LedgerType,
    Prisma,
    InvoiceStatus,
    SaleStatus,
} from "@repo/db/client";

// ========================================
// TYPES & INTERFACES (same as before)
// ========================================

export interface TrialBalanceEntry {
    accountName: string;
    accountType: "ASSET" | "LIABILITY" | "INCOME" | "EXPENSE" | "EQUITY";
    debit: number;
    credit: number;
    balance: number;
}

export interface TrialBalanceReport {
    period: {
        startDate: Date;
        endDate: Date;
        financialYear: string;
    };
    entries: TrialBalanceEntry[];
    totals: {
        totalDebit: number;
        totalCredit: number;
    };
    isBalanced: boolean;
    generatedAt: Date;
}

export interface BalanceSheetReport {
    period: {
        asOfDate: Date;
        financialYear: string;
    };
    assets: {
        currentAssets: {
            cash: number;
            accountsReceivable: number;
            inventory: number;
            total: number;
        };
        fixedAssets: {
            propertyPlantEquipment: number;
            accumulatedDepreciation: number;
            total: number;
        };
        totalAssets: number;
    };
    liabilities: {
        currentLiabilities: {
            accountsPayable: number;
            shortTermLoans: number;
            total: number;
        };
        longTermLiabilities: {
            longTermLoans: number;
            total: number;
        };
        totalLiabilities: number;
    };
    equity: {
        capital: number;
        retainedEarnings: number;
        currentYearProfit: number;
        totalEquity: number;
    };
    totalLiabilitiesAndEquity: number;
    isBalanced: boolean;
    generatedAt: Date;
}

export interface ProfitLossReport {
    period: {
        startDate: Date;
        endDate: Date;
        financialYear: string;
    };
    revenue: {
        sales: number;
        otherIncome: number;
        totalRevenue: number;
    };
    costOfGoodsSold: {
        openingStock: number;
        purchases: number;
        closingStock: number;
        totalCOGS: number;
    };
    grossProfit: number;
    grossProfitMargin: number;
    operatingExpenses: {
        salaries: number;
        rent: number;
        utilities: number;
        depreciation: number;
        otherExpenses: number;
        totalOperatingExpenses: number;
    };
    operatingProfit: number;
    operatingProfitMargin: number;
    otherExpenses: {
        interestExpense: number;
        taxes: number;
        totalOtherExpenses: number;
    };
    netProfit: number;
    netProfitMargin: number;
    generatedAt: Date;
}

export interface GSTReportEntry {
    month: string;
    gstr1: {
        b2b: { taxableValue: number; cgst: number; sgst: number; igst: number };
        b2c: { taxableValue: number; cgst: number; sgst: number; igst: number };
        exports: { taxableValue: number };
        totalOutput: {
            taxableValue: number;
            cgst: number;
            sgst: number;
            igst: number;
            total: number;
        };
    };
    gstr2: {
        b2b: { taxableValue: number; cgst: number; sgst: number; igst: number };
        imports: { taxableValue: number; igst: number };
        totalInput: {
            taxableValue: number;
            cgst: number;
            sgst: number;
            igst: number;
            total: number;
        };
    };
    gstr3b: {
        outputTax: number;
        inputTaxCredit: number;
        netTaxLiability: number;
        interestAndPenalty: number;
        totalPayable: number;
    };
}

export interface GSTReport {
    period: {
        startDate: Date;
        endDate: Date;
        financialYear: string;
        quarter: string;
    };
    gstinNumber: string;
    entries: GSTReportEntry[];
    summary: {
        totalOutputTax: number;
        totalInputTax: number;
        netTaxLiability: number;
        totalTaxPaid: number;
        balancePayable: number;
    };
    generatedAt: Date;
}

export interface TDSEntry {
    date: Date;
    partyName: string;
    panNumber: string;
    paymentAmount: number;
    tdsRate: number;
    tdsAmount: number;
    tdsSection: string;
    challanNumber?: string;
    depositeDate?: Date;
}

export interface TDSReport {
    period: {
        startDate: Date;
        endDate: Date;
        quarter: string;
        financialYear: string;
    };
    entries: TDSEntry[];
    summary: {
        totalPayments: number;
        totalTDSDeducted: number;
        totalTDSDeposited: number;
        pendingDeposit: number;
    };
    generatedAt: Date;
}

export interface BankTransaction {
    date: Date;
    description: string;
    chequeNumber?: string;
    debit: number;
    credit: number;
    balance: number;
    bankBalance: number;
    matched: boolean;
    ledgerEntryId?: string;
}

export interface BankReconciliationReport {
    period: {
        startDate: Date;
        endDate: Date;
    };
    bankAccount: {
        accountNumber: string;
        bankName: string;
        ifscCode: string;
    };
    openingBalance: {
        asPerBooks: number;
        asPerBank: number;
    };
    closingBalance: {
        asPerBooks: number;
        asPerBank: number;
    };
    transactions: {
        matched: BankTransaction[];
        unmatchedInBooks: BankTransaction[];
        unmatchedInBank: BankTransaction[];
    };
    reconciliationItems: {
        chequesIssued: { count: number; amount: number };
        depositsInTransit: { count: number; amount: number };
        bankCharges: { count: number; amount: number };
        interestEarned: { count: number; amount: number };
    };
    reconciledBalance: number;
    difference: number;
    isReconciled: boolean;
    generatedAt: Date;
}

export interface FinancialYear {
    id: string;
    startDate: Date;
    endDate: Date;
    name: string;
    isCurrent: boolean;
    isClosed: boolean;
    closedAt?: Date;
    closedBy?: string;
}

export interface PeriodClosingReport {
    financialYear: FinancialYear;
    closingDate: Date;
    trialBalance: TrialBalanceReport;
    profitLoss: ProfitLossReport;
    balanceSheet: BalanceSheetReport;
    checks: {
        trialBalanceMatched: boolean;
        balanceSheetBalanced: boolean;
        allTransactionsPosted: boolean;
        bankReconciliationComplete: boolean;
    };
    warnings: string[];
    errors: string[];
    canClose: boolean;
}

// ========================================
// ENHANCED LEDGER SERVICE
// ========================================

export class EnhancedLedgerService {
    // ========================================
    // TRIAL BALANCE
    // ========================================

    static async getTrialBalance(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<TrialBalanceReport> {
        try {
            logger.info("Generating trial balance", LogCategory.BUSINESS, {
                userId,
                startDate,
                endDate,
            });

            const accountBalances = new Map<
                string,
                { debit: number; credit: number; type: string }
            >();

            // 🔥 USE EXISTING LEDGER SERVICE for customer balances
            const customers = await prisma.customer.findMany({
                where: { userId, isActive: true },
                select: { id: true, name: true },
            });

            for (const customer of customers) {
                const balance = await LedgerService.getCustomerBalance(
                    customer.id
                );

                if (Math.abs(balance) > 0.01) {
                    accountBalances.set(customer.name, {
                        debit: balance > 0 ? balance : 0,
                        credit: balance < 0 ? Math.abs(balance) : 0,
                        type: "ASSET",
                    });
                }
            }

            // 🔥 USE EXISTING LEDGER SERVICE for party balances
            const parties = await prisma.party.findMany({
                where: { userId, isActive: true },
                select: { id: true, name: true },
            });

            for (const party of parties) {
                const balance = await LedgerService.getPartyBalance(party.id);

                if (Math.abs(balance) > 0.01) {
                    accountBalances.set(party.name, {
                        debit: balance > 0 ? balance : 0,
                        credit: balance < 0 ? Math.abs(balance) : 0,
                        type: "LIABILITY",
                    });
                }
            }

            // Revenue (Sales)
            const totalSales = await this.getTotalSales(
                userId,
                startDate,
                endDate
            );
            if (totalSales > 0) {
                accountBalances.set("Sales Revenue", {
                    debit: 0,
                    credit: totalSales,
                    type: "INCOME",
                });
            }

            // COGS (Purchases)
            const totalPurchases = await this.getTotalPurchases(
                userId,
                startDate,
                endDate
            );
            if (totalPurchases > 0) {
                accountBalances.set("Cost of Goods Sold", {
                    debit: totalPurchases,
                    credit: 0,
                    type: "EXPENSE",
                });
            }

            // Inventory
            const inventoryValue = await this.getInventoryValue(
                userId,
                endDate
            );
            if (inventoryValue > 0) {
                accountBalances.set("Inventory", {
                    debit: inventoryValue,
                    credit: 0,
                    type: "ASSET",
                });
            }

            // Cash
            const cashBalance = await this.getCashBalance(userId, endDate);
            accountBalances.set("Cash", {
                debit: cashBalance > 0 ? cashBalance : 0,
                credit: cashBalance < 0 ? Math.abs(cashBalance) : 0,
                type: "ASSET",
            });

            // Convert to trial balance entries
            const trialBalanceEntries: TrialBalanceEntry[] = [];
            let totalDebit = 0;
            let totalCredit = 0;

            accountBalances.forEach((value, accountName) => {
                const entry: TrialBalanceEntry = {
                    accountName,
                    accountType: value.type as any,
                    debit: value.debit,
                    credit: value.credit,
                    balance: value.debit - value.credit,
                };
                trialBalanceEntries.push(entry);
                totalDebit += value.debit;
                totalCredit += value.credit;
            });

            // Sort by account type and name
            trialBalanceEntries.sort((a, b) => {
                if (a.accountType !== b.accountType) {
                    return a.accountType.localeCompare(b.accountType);
                }
                return a.accountName.localeCompare(b.accountName);
            });

            const financialYear = this.getFinancialYear(endDate);

            return {
                period: {
                    startDate,
                    endDate,
                    financialYear,
                },
                entries: trialBalanceEntries,
                totals: {
                    totalDebit,
                    totalCredit,
                },
                isBalanced: Math.abs(totalDebit - totalCredit) < 0.01,
                generatedAt: new Date(),
            };
        } catch (error) {
            logger.error(
                "Failed to generate trial balance",
                error,
                LogCategory.BUSINESS,
                { userId, startDate, endDate }
            );
            throw new CustomError(500, "Failed to generate trial balance");
        }
    }

    // ========================================
    // BALANCE SHEET
    // ========================================

    static async getBalanceSheet(
        userId: string,
        asOfDate: Date
    ): Promise<BalanceSheetReport> {
        try {
            logger.info("Generating balance sheet", LogCategory.BUSINESS, {
                userId,
                asOfDate,
            });

            // 🔥 USE EXISTING LEDGER SERVICE methods
            const cash = await this.getCashBalance(userId, asOfDate);
            const accountsReceivable = await this.getTotalAccountsReceivable(
                userId,
                asOfDate
            );
            const inventory = await this.getInventoryValue(userId, asOfDate);

            const accountsPayable = await this.getTotalAccountsPayable(
                userId,
                asOfDate
            );

            const capital = await this.getCapital(userId);
            const financialYearStart = this.getFinancialYearStart(asOfDate);
            const profitLoss = await this.getProfitLoss(
                userId,
                financialYearStart,
                asOfDate
            );

            const currentAssets = {
                cash: Math.max(0, cash),
                accountsReceivable: Math.max(0, accountsReceivable),
                inventory: Math.max(0, inventory),
                total: 0,
            };
            currentAssets.total =
                currentAssets.cash +
                currentAssets.accountsReceivable +
                currentAssets.inventory;

            const fixedAssets = {
                propertyPlantEquipment: 0,
                accumulatedDepreciation: 0,
                total: 0,
            };
            fixedAssets.total =
                fixedAssets.propertyPlantEquipment -
                fixedAssets.accumulatedDepreciation;

            const totalAssets = currentAssets.total + fixedAssets.total;

            const currentLiabilities = {
                accountsPayable: Math.max(0, accountsPayable),
                shortTermLoans: 0,
                total: 0,
            };
            currentLiabilities.total =
                currentLiabilities.accountsPayable +
                currentLiabilities.shortTermLoans;

            const longTermLiabilities = {
                longTermLoans: 0,
                total: 0,
            };
            longTermLiabilities.total = longTermLiabilities.longTermLoans;

            const totalLiabilities =
                currentLiabilities.total + longTermLiabilities.total;

            const equity = {
                capital,
                retainedEarnings: 0,
                currentYearProfit: profitLoss.netProfit,
                totalEquity: 0,
            };
            equity.totalEquity =
                equity.capital +
                equity.retainedEarnings +
                equity.currentYearProfit;

            const totalLiabilitiesAndEquity =
                totalLiabilities + equity.totalEquity;

            return {
                period: {
                    asOfDate,
                    financialYear: this.getFinancialYear(asOfDate),
                },
                assets: {
                    currentAssets,
                    fixedAssets,
                    totalAssets,
                },
                liabilities: {
                    currentLiabilities,
                    longTermLiabilities,
                    totalLiabilities,
                },
                equity,
                totalLiabilitiesAndEquity,
                isBalanced:
                    Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
                generatedAt: new Date(),
            };
        } catch (error) {
            logger.error(
                "Failed to generate balance sheet",
                error,
                LogCategory.BUSINESS,
                { userId, asOfDate }
            );
            throw new CustomError(500, "Failed to generate balance sheet");
        }
    }

    // ========================================
    // PROFIT & LOSS
    // ========================================

    static async getProfitLoss(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<ProfitLossReport> {
        try {
            logger.info(
                "Generating profit and loss statement",
                LogCategory.BUSINESS,
                { userId, startDate, endDate }
            );

            const totalSales = await this.getTotalSales(
                userId,
                startDate,
                endDate
            );
            const otherIncome = 0;

            const openingStock = await this.getInventoryValue(
                userId,
                startDate
            );
            const purchases = await this.getTotalPurchases(
                userId,
                startDate,
                endDate
            );
            const closingStock = await this.getInventoryValue(userId, endDate);
            const totalCOGS = openingStock + purchases - closingStock;

            const grossProfit = totalSales - totalCOGS;
            const grossProfitMargin =
                totalSales > 0 ? (grossProfit / totalSales) * 100 : 0;

            const operatingExpenses = {
                salaries: 0,
                rent: 0,
                utilities: 0,
                depreciation: 0,
                otherExpenses: 0,
                totalOperatingExpenses: 0,
            };

            const operatingProfit =
                grossProfit - operatingExpenses.totalOperatingExpenses;
            const operatingProfitMargin =
                totalSales > 0 ? (operatingProfit / totalSales) * 100 : 0;

            const otherExpenses = {
                interestExpense: 0,
                taxes: 0,
                totalOtherExpenses: 0,
            };

            const netProfit =
                operatingProfit - otherExpenses.totalOtherExpenses;
            const netProfitMargin =
                totalSales > 0 ? (netProfit / totalSales) * 100 : 0;

            return {
                period: {
                    startDate,
                    endDate,
                    financialYear: this.getFinancialYear(endDate),
                },
                revenue: {
                    sales: totalSales,
                    otherIncome,
                    totalRevenue: totalSales + otherIncome,
                },
                costOfGoodsSold: {
                    openingStock,
                    purchases,
                    closingStock,
                    totalCOGS,
                },
                grossProfit,
                grossProfitMargin,
                operatingExpenses,
                operatingProfit,
                operatingProfitMargin,
                otherExpenses,
                netProfit,
                netProfitMargin,
                generatedAt: new Date(),
            };
        } catch (error) {
            logger.error(
                "Failed to generate P&L statement",
                error,
                LogCategory.BUSINESS,
                { userId, startDate, endDate }
            );
            throw new CustomError(500, "Failed to generate P&L statement");
        }
    }

    // ========================================
    // GST REPORT (same as before)
    // ========================================

    static async getGSTReport(
        userId: string,
        startDate: Date,
        endDate: Date,
        gstinNumber: string
    ): Promise<GSTReport> {
        try {
            logger.info("Generating GST report", LogCategory.BUSINESS, {
                userId,
                startDate,
                endDate,
            });

            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: { state: true },
            });

            const sales = await prisma.sale.findMany({
                where: {
                    userId,
                    date: { gte: startDate, lte: endDate },
                    status: { not: "CANCELLED" },
                },
                include: {
                    customer: { select: { state: true, gstNumber: true } },
                },
            });

            const invoices = await prisma.invoice.findMany({
                where: {
                    userId,
                    date: { gte: startDate, lte: endDate },
                    status: { not: InvoiceStatus.CANCELLED },
                },
                include: {
                    party: { select: { state: true, gstNumber: true } },
                },
            });

            const monthlyEntries = new Map<string, GSTReportEntry>();

            for (const sale of sales) {
                const month = this.getMonthKey(sale.date);
                if (!monthlyEntries.has(month)) {
                    monthlyEntries.set(month, this.initializeGSTEntry(month));
                }

                const entry = monthlyEntries.get(month)!;
                const isInterstate = sale.customer?.state !== user?.state;
                const taxableValue = sale.totalAmount - sale.taxAmount;

                if (sale.customer?.gstNumber) {
                    entry.gstr1.b2b.taxableValue += taxableValue;
                    if (isInterstate) {
                        entry.gstr1.b2b.igst += sale.taxAmount;
                    } else {
                        entry.gstr1.b2b.cgst += sale.taxAmount / 2;
                        entry.gstr1.b2b.sgst += sale.taxAmount / 2;
                    }
                } else {
                    entry.gstr1.b2c.taxableValue += taxableValue;
                    if (isInterstate) {
                        entry.gstr1.b2c.igst += sale.taxAmount;
                    } else {
                        entry.gstr1.b2c.cgst += sale.taxAmount / 2;
                        entry.gstr1.b2c.sgst += sale.taxAmount / 2;
                    }
                }
            }

            for (const invoice of invoices) {
                const month = this.getMonthKey(invoice.date);
                if (!monthlyEntries.has(month)) {
                    monthlyEntries.set(month, this.initializeGSTEntry(month));
                }

                const entry = monthlyEntries.get(month)!;
                const isInterstate = invoice.party?.state !== user?.state;
                const taxableValue = invoice.totalAmount - invoice.taxAmount;

                entry.gstr2.b2b.taxableValue += taxableValue;
                if (isInterstate) {
                    entry.gstr2.b2b.igst += invoice.taxAmount;
                } else {
                    entry.gstr2.b2b.cgst += invoice.taxAmount / 2;
                    entry.gstr2.b2b.sgst += invoice.taxAmount / 2;
                }
            }

            const entries: GSTReportEntry[] = [];
            let totalOutputTax = 0;
            let totalInputTax = 0;

            for (const entry of monthlyEntries.values()) {
                entry.gstr1.totalOutput.taxableValue =
                    entry.gstr1.b2b.taxableValue +
                    entry.gstr1.b2c.taxableValue +
                    entry.gstr1.exports.taxableValue;

                entry.gstr1.totalOutput.cgst =
                    entry.gstr1.b2b.cgst + entry.gstr1.b2c.cgst;
                entry.gstr1.totalOutput.sgst =
                    entry.gstr1.b2b.sgst + entry.gstr1.b2c.sgst;
                entry.gstr1.totalOutput.igst =
                    entry.gstr1.b2b.igst + entry.gstr1.b2c.igst;
                entry.gstr1.totalOutput.total =
                    entry.gstr1.totalOutput.cgst +
                    entry.gstr1.totalOutput.sgst +
                    entry.gstr1.totalOutput.igst;

                entry.gstr2.totalInput.taxableValue =
                    entry.gstr2.b2b.taxableValue +
                    entry.gstr2.imports.taxableValue;
                entry.gstr2.totalInput.cgst = entry.gstr2.b2b.cgst;
                entry.gstr2.totalInput.sgst = entry.gstr2.b2b.sgst;
                entry.gstr2.totalInput.igst =
                    entry.gstr2.b2b.igst + entry.gstr2.imports.igst;
                entry.gstr2.totalInput.total =
                    entry.gstr2.totalInput.cgst +
                    entry.gstr2.totalInput.sgst +
                    entry.gstr2.totalInput.igst;

                entry.gstr3b.outputTax = entry.gstr1.totalOutput.total;
                entry.gstr3b.inputTaxCredit = entry.gstr2.totalInput.total;
                entry.gstr3b.netTaxLiability =
                    entry.gstr3b.outputTax - entry.gstr3b.inputTaxCredit;
                entry.gstr3b.totalPayable = Math.max(
                    0,
                    entry.gstr3b.netTaxLiability
                );

                totalOutputTax += entry.gstr3b.outputTax;
                totalInputTax += entry.gstr3b.inputTaxCredit;

                entries.push(entry);
            }

            return {
                period: {
                    startDate,
                    endDate,
                    financialYear: this.getFinancialYear(endDate),
                    quarter: this.getQuarter(startDate, endDate),
                },
                gstinNumber,
                entries,
                summary: {
                    totalOutputTax,
                    totalInputTax,
                    netTaxLiability: totalOutputTax - totalInputTax,
                    totalTaxPaid: 0,
                    balancePayable: Math.max(0, totalOutputTax - totalInputTax),
                },
                generatedAt: new Date(),
            };
        } catch (error) {
            logger.error(
                "Failed to generate GST report",
                error,
                LogCategory.BUSINESS,
                { userId, startDate, endDate }
            );
            throw new CustomError(500, "Failed to generate GST report");
        }
    }

    // ========================================
    // TDS REPORT (same as before)
    // ========================================

    static async getTDSReport(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<TDSReport> {
        try {
            logger.info("Generating TDS report", LogCategory.BUSINESS, {
                userId,
                startDate,
                endDate,
            });

            const payments = await prisma.invoicePayment.findMany({
                where: {
                    userId,
                    date: { gte: startDate, lte: endDate },
                },
                include: {
                    party: {
                        select: {
                            name: true,
                            panNumber: true,
                        },
                    },
                },
            });

            const entries: TDSEntry[] = [];
            let totalPayments = 0;
            let totalTDSDeducted = 0;

            for (const payment of payments) {
                const tdsRate = this.getTDSRate(payment.amount);
                const tdsAmount = (payment.amount * tdsRate) / 100;

                if (tdsAmount > 0) {
                    entries.push({
                        date: payment.date,
                        partyName: payment.party?.name || "Unknown",
                        panNumber: payment.party?.panNumber || "",
                        paymentAmount: payment.amount,
                        tdsRate,
                        tdsAmount,
                        tdsSection: this.getTDSSection(payment.amount),
                    });

                    totalPayments += payment.amount;
                    totalTDSDeducted += tdsAmount;
                }
            }

            return {
                period: {
                    startDate,
                    endDate,
                    quarter: this.getQuarter(startDate, endDate),
                    financialYear: this.getFinancialYear(endDate),
                },
                entries,
                summary: {
                    totalPayments,
                    totalTDSDeducted,
                    totalTDSDeposited: 0,
                    pendingDeposit: totalTDSDeducted,
                },
                generatedAt: new Date(),
            };
        } catch (error) {
            logger.error(
                "Failed to generate TDS report",
                error,
                LogCategory.BUSINESS,
                { userId, startDate, endDate }
            );
            throw new CustomError(500, "Failed to generate TDS report");
        }
    }

    // ========================================
    // BANK RECONCILIATION (same as before)
    // ========================================

    static async reconcileBank(
        userId: string,
        startDate: Date,
        endDate: Date,
        bankStatementTransactions: Array<{
            date: Date;
            description: string;
            debit: number;
            credit: number;
            balance: number;
        }>
    ): Promise<BankReconciliationReport> {
        try {
            logger.info(
                "Performing bank reconciliation",
                LogCategory.BUSINESS,
                {
                    userId,
                    startDate,
                    endDate,
                }
            );

            const ledgerEntries = await prisma.ledgerEntry.findMany({
                where: {
                    userId,
                    date: { gte: startDate, lte: endDate },
                    type: {
                        in: [
                            LedgerType.PAYMENT_RECEIVED,
                            LedgerType.PAYMENT_MADE,
                        ],
                    },
                },
                orderBy: { date: "asc" },
            });

            const matched: BankTransaction[] = [];
            const unmatchedInBooks: BankTransaction[] = [];
            const unmatchedInBank: BankTransaction[] = [];

            const bankTxnMap = new Map(
                bankStatementTransactions.map((t, i) => [i, t])
            );
            const ledgerMap = new Map(ledgerEntries.map((e, i) => [i, e]));

            for (const [ledgerIdx, ledgerEntry] of ledgerMap.entries()) {
                let foundMatch = false;

                for (const [bankIdx, bankTxn] of bankTxnMap.entries()) {
                    const amountMatches =
                        Math.abs(ledgerEntry.debit - bankTxn.debit) < 0.01 ||
                        Math.abs(ledgerEntry.credit - bankTxn.credit) < 0.01;

                    const dateMatches =
                        Math.abs(
                            ledgerEntry.date.getTime() - bankTxn.date.getTime()
                        ) <=
                        3 * 24 * 60 * 60 * 1000;

                    if (amountMatches && dateMatches) {
                        matched.push({
                            date: ledgerEntry.date,
                            description: ledgerEntry.description || "",
                            debit: ledgerEntry.debit,
                            credit: ledgerEntry.credit,
                            balance: ledgerEntry.balance,
                            bankBalance: bankTxn.balance,
                            matched: true,
                            ledgerEntryId: ledgerEntry.id,
                        });

                        bankTxnMap.delete(bankIdx);
                        foundMatch = true;
                        break;
                    }
                }

                if (!foundMatch) {
                    unmatchedInBooks.push({
                        date: ledgerEntry.date,
                        description: ledgerEntry.description || "",
                        debit: ledgerEntry.debit,
                        credit: ledgerEntry.credit,
                        balance: ledgerEntry.balance,
                        bankBalance: 0,
                        matched: false,
                        ledgerEntryId: ledgerEntry.id,
                    });
                }
            }

            for (const bankTxn of bankTxnMap.values()) {
                unmatchedInBank.push({
                    date: bankTxn.date,
                    description: bankTxn.description,
                    debit: bankTxn.debit,
                    credit: bankTxn.credit,
                    balance: 0,
                    bankBalance: bankTxn.balance,
                    matched: false,
                });
            }

            const chequesIssued = unmatchedInBooks
                .filter((t) => t.credit > 0)
                .reduce(
                    (acc, t) => ({
                        count: acc.count + 1,
                        amount: acc.amount + t.credit,
                    }),
                    { count: 0, amount: 0 }
                );

            const depositsInTransit = unmatchedInBooks
                .filter((t) => t.debit > 0)
                .reduce(
                    (acc, t) => ({
                        count: acc.count + 1,
                        amount: acc.amount + t.debit,
                    }),
                    { count: 0, amount: 0 }
                );

            const bankCharges = unmatchedInBank
                .filter((t) => t.debit > 0)
                .reduce(
                    (acc, t) => ({
                        count: acc.count + 1,
                        amount: acc.amount + t.debit,
                    }),
                    { count: 0, amount: 0 }
                );

            const interestEarned = unmatchedInBank
                .filter((t) => t.credit > 0)
                .reduce(
                    (acc, t) => ({
                        count: acc.count + 1,
                        amount: acc.amount + t.credit,
                    }),
                    { count: 0, amount: 0 }
                );

            const openingBalanceBooks = await this.getCashBalance(
                userId,
                startDate
            );
            const closingBalanceBooks = await this.getCashBalance(
                userId,
                endDate
            );
            const openingBalanceBank =
                bankStatementTransactions[0]?.balance || 0;
            const closingBalanceBank =
                bankStatementTransactions[bankStatementTransactions.length - 1]
                    ?.balance || 0;

            const reconciledBalance =
                closingBalanceBank +
                depositsInTransit.amount -
                chequesIssued.amount +
                interestEarned.amount -
                bankCharges.amount;

            const difference = Math.abs(
                reconciledBalance - closingBalanceBooks
            );

            return {
                period: { startDate, endDate },
                bankAccount: {
                    accountNumber: "XXXXXXXX1234",
                    bankName: "Bank Name",
                    ifscCode: "XXXX0001234",
                },
                openingBalance: {
                    asPerBooks: openingBalanceBooks,
                    asPerBank: openingBalanceBank,
                },
                closingBalance: {
                    asPerBooks: closingBalanceBooks,
                    asPerBank: closingBalanceBank,
                },
                transactions: {
                    matched,
                    unmatchedInBooks,
                    unmatchedInBank,
                },
                reconciliationItems: {
                    chequesIssued,
                    depositsInTransit,
                    bankCharges,
                    interestEarned,
                },
                reconciledBalance,
                difference,
                isReconciled: difference < 1,
                generatedAt: new Date(),
            };
        } catch (error: any) {
            logger.error(
                "Failed to perform bank reconciliation",
                error,
                LogCategory.BUSINESS,
                { userId, startDate, endDate }
            );
            throw new CustomError(500, "Failed to perform bank reconciliation");
        }
    }

    // ========================================
    // FINANCIAL YEAR & PERIOD CLOSING (same as before)
    // ========================================

    static async getFinancialYears(userId: string): Promise<FinancialYear[]> {
        const currentFY = this.getCurrentFinancialYear();
        return [currentFY];
    }

    static async createFinancialYear(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<FinancialYear> {
        const name = this.getFinancialYear(endDate);
        return {
            id: "fy_" + Date.now(),
            startDate,
            endDate,
            name,
            isCurrent: true,
            isClosed: false,
        };
    }

    static async closeFinancialYear(
        userId: string,
        financialYearId: string
    ): Promise<PeriodClosingReport> {
        try {
            const fy = await this.getFinancialYears(userId);
            const financialYear = fy.find((f) => f.id === financialYearId);

            if (!financialYear) {
                throw new CustomError(404, "Financial year not found");
            }

            if (financialYear.isClosed) {
                throw new CustomError(400, "Financial year already closed");
            }

            const trialBalance = await this.getTrialBalance(
                userId,
                financialYear.startDate,
                financialYear.endDate
            );

            const profitLoss = await this.getProfitLoss(
                userId,
                financialYear.startDate,
                financialYear.endDate
            );

            const balanceSheet = await this.getBalanceSheet(
                userId,
                financialYear.endDate
            );

            const checks = {
                trialBalanceMatched: trialBalance.isBalanced,
                balanceSheetBalanced: balanceSheet.isBalanced,
                allTransactionsPosted: true,
                bankReconciliationComplete: false,
            };

            const warnings: string[] = [];
            const errors: string[] = [];

            if (!checks.trialBalanceMatched) {
                errors.push("Trial balance does not match");
            }

            if (!checks.balanceSheetBalanced) {
                errors.push("Balance sheet is not balanced");
            }

            if (!checks.bankReconciliationComplete) {
                warnings.push("Bank reconciliation not completed");
            }

            const pendingSales = await prisma.sale.count({
                where: {
                    userId,
                    status: { in: ["PENDING", "PARTIALLY_PAID"] },
                    date: {
                        gte: financialYear.startDate,
                        lte: financialYear.endDate,
                    },
                },
            });

            if (pendingSales > 0) {
                warnings.push(`${pendingSales} pending sales`);
            }

            const canClose = errors.length === 0;

            if (canClose) {
                financialYear.isClosed = true;
                financialYear.closedAt = new Date();
                financialYear.closedBy = userId;
            }

            return {
                financialYear,
                closingDate: new Date(),
                trialBalance,
                profitLoss,
                balanceSheet,
                checks,
                warnings,
                errors,
                canClose,
            };
        } catch (error: any) {
            logger.error(
                "Failed to close financial year",
                error,
                LogCategory.BUSINESS,
                { userId, financialYearId }
            );
            throw error;
        }
    }

    // ========================================
    // HELPER METHODS - Using aggregate queries
    // ========================================

    private static async getTotalSales(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        const result = await prisma.sale.aggregate({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
                status: { not: "CANCELLED" },
            },
            _sum: { totalAmount: true },
        });

        return result._sum.totalAmount || 0;
    }

    private static async getTotalPurchases(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<number> {
        const result = await prisma.invoice.aggregate({
            where: {
                userId,
                date: { gte: startDate, lte: endDate },
                status: { not: InvoiceStatus.CANCELLED },
            },
            _sum: { totalAmount: true },
        });

        return result._sum.totalAmount || 0;
    }

    private static async getInventoryValue(
        userId: string,
        asOfDate: Date
    ): Promise<number> {
        const items = await prisma.inventoryItem.findMany({
            where: { userId, isActive: true },
            select: { currentStock: true, costPrice: true },
        });

        return items.reduce(
            (sum, item) => sum + item.currentStock * (item.costPrice || 0),
            0
        );
    }

    private static async getCashBalance(
        userId: string,
        asOfDate: Date
    ): Promise<number> {
        const entries = await prisma.ledgerEntry.findMany({
            where: {
                userId,
                date: { lte: asOfDate },
                type: {
                    in: [LedgerType.PAYMENT_RECEIVED, LedgerType.PAYMENT_MADE],
                },
            },
        });

        return entries.reduce((sum, e) => sum + e.debit - e.credit, 0);
    }

    private static async getTotalAccountsReceivable(
        userId: string,
        asOfDate: Date
    ): Promise<number> {
        // 🔥 USE EXISTING LEDGER SERVICE
        const customers = await prisma.customer.findMany({
            where: { userId, isActive: true },
            select: { id: true },
        });

        let total = 0;
        for (const customer of customers) {
            const balance = await LedgerService.getCustomerBalance(customer.id);
            if (balance > 0) {
                total += balance;
            }
        }

        return total;
    }

    private static async getTotalAccountsPayable(
        userId: string,
        asOfDate: Date
    ): Promise<number> {
        // 🔥 USE EXISTING LEDGER SERVICE
        const parties = await prisma.party.findMany({
            where: { userId, isActive: true },
            select: { id: true },
        });

        let total = 0;
        for (const party of parties) {
            const balance = await LedgerService.getPartyBalance(party.id);
            if (balance < 0) {
                total += Math.abs(balance);
            }
        }

        return total;
    }

    private static async getCapital(userId: string): Promise<number> {
        return 100000; // Placeholder
    }

    private static getFinancialYear(date: Date): string {
        const year = date.getFullYear();
        const month = date.getMonth();

        if (month >= 3) {
            return `FY ${year}-${year + 1}`;
        } else {
            return `FY ${year - 1}-${year}`;
        }
    }

    private static getFinancialYearStart(date: Date): Date {
        const year = date.getFullYear();
        const month = date.getMonth();

        if (month >= 3) {
            return new Date(year, 3, 1);
        } else {
            return new Date(year - 1, 3, 1);
        }
    }

    private static getCurrentFinancialYear(): FinancialYear {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();

        let startDate: Date;
        let endDate: Date;

        if (month >= 3) {
            startDate = new Date(year, 3, 1);
            endDate = new Date(year + 1, 2, 31);
        } else {
            startDate = new Date(year - 1, 3, 1);
            endDate = new Date(year, 2, 31);
        }

        return {
            id: "current",
            startDate,
            endDate,
            name: this.getFinancialYear(today),
            isCurrent: true,
            isClosed: false,
        };
    }

    private static getQuarter(startDate: Date, endDate: Date): string {
        const month = startDate.getMonth();
        if (month >= 3 && month <= 5) return "Q1";
        if (month >= 6 && month <= 8) return "Q2";
        if (month >= 9 && month <= 11) return "Q3";
        return "Q4";
    }

    private static getMonthKey(date: Date): string {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        return `${year}-${month}`;
    }

    private static initializeGSTEntry(month: string): GSTReportEntry {
        return {
            month,
            gstr1: {
                b2b: { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 },
                b2c: { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 },
                exports: { taxableValue: 0 },
                totalOutput: {
                    taxableValue: 0,
                    cgst: 0,
                    sgst: 0,
                    igst: 0,
                    total: 0,
                },
            },
            gstr2: {
                b2b: { taxableValue: 0, cgst: 0, sgst: 0, igst: 0 },
                imports: { taxableValue: 0, igst: 0 },
                totalInput: {
                    taxableValue: 0,
                    cgst: 0,
                    sgst: 0,
                    igst: 0,
                    total: 0,
                },
            },
            gstr3b: {
                outputTax: 0,
                inputTaxCredit: 0,
                netTaxLiability: 0,
                interestAndPenalty: 0,
                totalPayable: 0,
            },
        };
    }

    private static getTDSRate(amount: number): number {
        if (amount > 30000) {
            return 1;
        }
        return 0;
    }

    private static getTDSSection(amount: number): string {
        if (amount > 30000) {
            return "194C";
        }
        return "";
    }
}
