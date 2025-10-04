import { prisma } from "@repo/db/prisma";
import { logger, LogCategory } from "@repo/common-backend/logger";
import { Decimal } from "@prisma/client/runtime/library";

export interface LedgerBalance {
    balance: number;
    totalSales?: number;
    totalPayments?: number;
    totalInvoices?: number;
    lastEntryDate?: Date;
}

export interface LedgerQuery {
    dateRange?: { gte?: Date; lte?: Date };
    limit?: number;
    offset?: number;
}

export interface LedgerStatement {
    entries: any[];
    openingBalance: number;
    closingBalance: number;
    totalDebit: number;
    totalCredit: number;
    entryCount: number;
}

export class LedgerService {
    // ========================================
    // CUSTOMER LEDGER METHODS (RECEIVABLES)
    // ========================================

    private static toNumber(
        value: number | Decimal | null | undefined
    ): number {
        if (value === null || value === undefined) return 0;
        return typeof value === "number" ? value : Number(value);
    }

    /**
     * Create sale entry - Customer owes us money (Debit customer account)
     */
    static async createSaleEntry(data: {
        saleId: string;
        customerId: string;
        amount: number;
        description: string;
        userId: string;
        date?: Date;
    }): Promise<void> {
        const entryDate = data.date || new Date();

        await prisma.ledgerEntry.create({
            data: {
                date: entryDate,
                description: data.description,
                debit: data.amount, // Customer owes us - DEBIT increases receivable
                credit: 0,
                balance: 0, // Calculate dynamically, don't store
                type: "SALE_CREATED",
                reference: data.saleId,
                customerId: data.customerId,
                saleId: data.saleId,
                userId: data.userId,
            },
        });

        logger.info("Sale ledger entry created", LogCategory.LEDGER, {
            saleId: data.saleId,
            customerId: data.customerId,
            amount: data.amount,
            userId: data.userId,
        });
    }

    /**
     * Create payment received entry - Customer pays us (Credit customer account)
     */
    static async createPaymentReceivedEntry(data: {
        paymentId: string;
        customerId: string;
        amount: number;
        description: string;
        userId: string;
        date?: Date;
    }): Promise<void> {
        const entryDate = data.date || new Date();

        await prisma.ledgerEntry.create({
            data: {
                date: entryDate,
                description: data.description,
                debit: 0,
                credit: data.amount, // Customer pays - CREDIT reduces receivable
                balance: 0, // Calculate dynamically
                type: "SALE_RECEIPT",
                reference: data.paymentId,
                customerId: data.customerId,
                saleReceiptId: data.paymentId,
                userId: data.userId,
            },
        });

        logger.info(
            "Payment received ledger entry created",
            LogCategory.LEDGER,
            {
                paymentId: data.paymentId,
                customerId: data.customerId,
                amount: data.amount,
                userId: data.userId,
            }
        );
    }

    // ========================================
    // PARTY LEDGER METHODS (PAYABLES)
    // ========================================

    /**
     * Create invoice entry - We owe party money (Credit party account)
     */
    static async createInvoiceEntry(data: {
        invoiceId: string;
        partyId: string;
        amount: number;
        description: string;
        userId: string;
        date?: Date;
    }): Promise<void> {
        const entryDate = data.date || new Date();

        await prisma.ledgerEntry.create({
            data: {
                date: entryDate,
                description: data.description,
                debit: 0,
                credit: data.amount, // We owe party - CREDIT increases payable
                balance: 0, // Calculate dynamically
                type: "INVOICE_CREATED",
                reference: data.invoiceId,
                partyId: data.partyId,
                invoiceId: data.invoiceId,
                userId: data.userId,
            },
        });

        logger.info("Invoice ledger entry created", LogCategory.LEDGER, {
            invoiceId: data.invoiceId,
            partyId: data.partyId,
            amount: data.amount,
            userId: data.userId,
        });
    }

    /**
     * Create payment made entry - We pay party (Debit party account)
     */
    static async createPaymentMadeEntry(data: {
        paymentId: string;
        partyId: string;
        amount: number;
        description: string;
        userId: string;
        date?: Date;
    }): Promise<void> {
        const entryDate = data.date || new Date();

        await prisma.ledgerEntry.create({
            data: {
                date: entryDate,
                description: data.description,
                debit: data.amount, // We pay party - DEBIT reduces payable
                credit: 0,
                balance: 0, // Calculate dynamically
                type: "INVOICE_PAYMENT",
                reference: data.paymentId,
                partyId: data.partyId,
                invoicePaymentId: data.paymentId,
                userId: data.userId,
            },
        });

        logger.info("Payment made ledger entry created", LogCategory.LEDGER, {
            paymentId: data.paymentId,
            partyId: data.partyId,
            amount: data.amount,
            userId: data.userId,
        });
    }

    // ========================================
    // BALANCE CALCULATION METHODS
    // ========================================

    /**
     * Calculate customer balance (Receivables - what customers owe us)
     */
    static async getCustomerBalance(
        customerId: string
    ): Promise<LedgerBalance> {
        // Get all ledger entries for this customer
        const entries = await prisma.ledgerEntry.findMany({
            where: { customerId },
            select: { debit: true, credit: true, createdAt: true },
            orderBy: { createdAt: "desc" },
        });

        // Calculate balance: Debit - Credit (positive = customer owes us)
        let balance = 0;
        for (const entry of entries) {
            balance += Number(entry.debit) - Number(entry.credit);
        }

        // Get aggregate data using correct table names
        const [salesTotal, receiptsTotal] = await Promise.all([
            prisma.sale.aggregate({
                where: { customerId, status: { not: "CANCELLED" } },
                _sum: { amount: true },
            }),
            prisma.saleReceipt.aggregate({
                where: { customerId },
                _sum: { amount: true },
            }),
        ]);

        return {
            balance,
            totalSales: Number(salesTotal._sum.amount) || 0,
            totalPayments: Number(receiptsTotal._sum.amount) || 0,
            lastEntryDate: entries[0]?.createdAt,
        };
    }

    /**
     * Calculate party balance (Payables - what we owe parties)
     */
    static async getPartyBalance(partyId: string): Promise<LedgerBalance> {
        // Get all ledger entries for this party
        const entries = await prisma.ledgerEntry.findMany({
            where: { partyId },
            select: { debit: true, credit: true, createdAt: true },
            orderBy: { createdAt: "desc" },
        });

        // Calculate balance: Credit - Debit (positive = we owe party)
        let balance = 0;
        for (const entry of entries) {
            balance += Number(entry.credit) - Number(entry.debit);
        }

        // Get aggregate data using correct table names
        const [invoicesTotal, paymentsTotal] = await Promise.all([
            prisma.invoice.aggregate({
                where: { partyId },
                _sum: { amount: true },
            }),
            prisma.invoicePayment.aggregate({
                where: { partyId },
                _sum: { amount: true },
            }),
        ]);

        return {
            balance,
            totalInvoices: Number(invoicesTotal._sum.amount) || 0,
            totalPayments: Number(paymentsTotal._sum.amount) || 0,
            lastEntryDate: entries[0]?.createdAt,
        };
    }

    // ========================================
    // ADJUSTMENT AND UTILITY METHODS
    // ========================================

    /**
     * Create adjustment entry
     */
    static async createAdjustmentEntry(data: {
        customerId?: string;
        partyId?: string;
        amount: number;
        description: string;
        reason: string;
        userId: string;
        date?: Date;
    }): Promise<void> {
        const entryDate = data.date || new Date();

        await prisma.ledgerEntry.create({
            data: {
                date: entryDate,
                description: `${data.description} - ${data.reason}`,
                debit: data.amount > 0 ? data.amount : 0,
                credit: data.amount < 0 ? Math.abs(data.amount) : 0,
                balance: 0, // Don't store running balance
                type: "ADJUSTMENT",
                reference: `ADJ-${Date.now()}`,
                customerId: data.customerId,
                partyId: data.partyId,
                userId: data.userId,
            },
        });

        logger.info("Adjustment ledger entry created", LogCategory.LEDGER, {
            customerId: data.customerId,
            partyId: data.partyId,
            amount: data.amount,
            reason: data.reason,
            userId: data.userId,
        });
    }

    /**
     * Create opening balance entry
     */
    static async createOpeningBalance(data: {
        customerId?: string;
        partyId?: string;
        amount: number;
        creditLimit?: number;
        userId: string;
        description: string;
        date?: Date;
    }): Promise<void> {
        const entryDate = data.date || new Date();

        await prisma.ledgerEntry.create({
            data: {
                date: entryDate,
                description: data.description,
                debit: data.amount > 0 ? data.amount : 0,
                credit: data.amount < 0 ? Math.abs(data.amount) : 0,
                balance: 0, // Don't store running balance
                type: "OPENING_BALANCE",
                reference: "OPENING",
                customerId: data.customerId,
                partyId: data.partyId,
                userId: data.userId,
            },
        });

        logger.info("Opening balance created", LogCategory.LEDGER, {
            customerId: data.customerId,
            partyId: data.partyId,
            amount: data.amount,
            userId: data.userId,
        });
    }

    // ========================================
    // STATEMENT GENERATION
    // ========================================

    /**
     * Get customer ledger statement with calculated balances
     */
    static async getCustomerLedger(
        customerId: string,
        query: LedgerQuery = {}
    ): Promise<LedgerStatement> {
        const whereClause: any = { customerId };

        if (query.dateRange) {
            whereClause.date = query.dateRange;
        }

        // Get entries for the period
        const entries = await prisma.ledgerEntry.findMany({
            where: whereClause,
            orderBy: { createdAt: "asc" },
            take: query.limit || 100,
            skip: query.offset || 0,
            include: {
                sale: {
                    select: { saleNo: true, voucherId: true },
                },
                saleReceipt: {
                    select: { receiptNo: true, voucherId: true, method: true },
                },
            },
        });

        // Calculate running balances for display
        let runningBalance = 0;
        const entriesWithBalance = entries.map((entry) => {
            runningBalance += Number(entry.debit) - Number(entry.credit);
            return {
                ...entry,
                runningBalance,
            };
        });

        // Calculate totals
        const totalDebit = entries.reduce(
            (sum, entry) => sum + Number(entry.debit),
            0
        );
        const totalCredit = entries.reduce(
            (sum, entry) => sum + Number(entry.credit),
            0
        );

        return {
            entries: entriesWithBalance,
            openingBalance: 0, // Calculate if needed
            closingBalance: runningBalance,
            totalDebit,
            totalCredit,
            entryCount: entries.length,
        };
    }

    /**
     * Get party ledger statement with calculated balances
     */
    static async getPartyLedger(
        partyId: string,
        query: LedgerQuery = {}
    ): Promise<LedgerStatement> {
        const whereClause: any = { partyId };

        if (query.dateRange) {
            whereClause.date = query.dateRange;
        }

        // Get entries for the period
        const entries = await prisma.ledgerEntry.findMany({
            where: whereClause,
            orderBy: { createdAt: "asc" },
            take: query.limit || 100,
            skip: query.offset || 0,
            include: {
                invoice: {
                    select: { invoiceNo: true, voucherId: true },
                },
                invoicePayment: {
                    select: { voucherId: true, method: true },
                },
            },
        });

        // Calculate running balances for display
        let runningBalance = 0;
        const entriesWithBalance = entries.map((entry) => {
            runningBalance += Number(entry.credit) - Number(entry.debit);
            return {
                ...entry,
                runningBalance,
            };
        });

        // Calculate totals
        const totalDebit = entries.reduce(
            (sum, entry) => sum + Number(entry.debit),
            0
        );
        const totalCredit = entries.reduce(
            (sum, entry) => sum + Number(entry.credit),
            0
        );

        return {
            entries: entriesWithBalance,
            openingBalance: 0, // Calculate if needed
            closingBalance: runningBalance,
            totalDebit,
            totalCredit,
            entryCount: entries.length,
        };
    }

    // ========================================
    // VALIDATION AND INTEGRITY CHECKS
    // ========================================

    /**
     * Validate ledger integrity
     */
    static async validateLedgerIntegrity(userId: string): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Check for customers with ledger entries but no corresponding sales/receipts
        const customersWithLedger = await prisma.ledgerEntry.findMany({
            where: { userId, customerId: { not: null } },
            distinct: ["customerId"],
            select: { customerId: true },
        });

        for (const { customerId } of customersWithLedger) {
            if (!customerId) continue;

            const calculatedBalance = await this.getCustomerBalance(customerId);
            const customer = await prisma.customer.findUnique({
                where: { id: customerId },
                select: { name: true },
            });

            // Check if balance calculation seems reasonable
            const salesMinusReceipts =
                calculatedBalance.totalSales! -
                calculatedBalance.totalPayments!;
            const ledgerBalance = calculatedBalance.balance;

            if (Math.abs(salesMinusReceipts - ledgerBalance) > 0.01) {
                warnings.push(
                    `Customer ${customer?.name}: Ledger balance (${ledgerBalance}) doesn't match sales-receipts (${salesMinusReceipts})`
                );
            }
        }

        // Similar check for parties
        const partiesWithLedger = await prisma.ledgerEntry.findMany({
            where: { userId, partyId: { not: null } },
            distinct: ["partyId"],
            select: { partyId: true },
        });

        for (const { partyId } of partiesWithLedger) {
            if (!partyId) continue;

            const calculatedBalance = await this.getPartyBalance(partyId);
            const party = await prisma.party.findUnique({
                where: { id: partyId },
                select: { name: true },
            });

            const invoicesMinusPayments =
                calculatedBalance.totalInvoices! -
                calculatedBalance.totalPayments!;
            const ledgerBalance = calculatedBalance.balance;

            if (Math.abs(invoicesMinusPayments - ledgerBalance) > 0.01) {
                warnings.push(
                    `Party ${party?.name}: Ledger balance (${ledgerBalance}) doesn't match invoices-payments (${invoicesMinusPayments})`
                );
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
        };
    }

    // ========================================
    // CASH FLOW AND BUSINESS REPORTING
    // ========================================

    /**
     * Get cash flow statement - corrected for your business model
     */
    static async getCashFlow(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        receipts: {
            customerPayments: number; // SaleReceipts from walk-in customers
            ecommercePayments: number; // OrderPayments from online orders
            otherReceipts: number;
            total: number;
        };
        payments: {
            supplierPayments: number; // InvoicePayments to suppliers/parties
            otherPayments: number;
            total: number;
        };
        netCashFlow: number;
    }> {
        const dateFilter = { gte: startDate, lte: endDate };

        // Money coming IN to the shop
        const [customerPayments, ecommercePayments] = await Promise.all([
            // Walk-in customer payments
            prisma.saleReceipt.aggregate({
                where: {
                    userId,
                    date: dateFilter,
                },
                _sum: { amount: true },
            }),
            // E-commerce order payments
            prisma.orderPayment.aggregate({
                where: {
                    order: { userId },
                    createdAt: dateFilter,
                    status: "completed",
                },
                _sum: { amount: true },
            }),
        ]);

        // Money going OUT from the shop
        const supplierPayments = await prisma.invoicePayment.aggregate({
            where: {
                userId,
                date: dateFilter,
                status: "COMPLETED",
            },
            _sum: { amount: true },
        });

        const customerPaymentAmount = this.toNumber(
            customerPayments._sum.amount
        );

        const ecommercePaymentAmount = this.toNumber(
            ecommercePayments._sum.amount
        );
        const supplierPaymentAmount = this.toNumber(
            supplierPayments._sum.amount
        );

        const receipts = {
            customerPayments: customerPaymentAmount,
            ecommercePayments: ecommercePaymentAmount,
            otherReceipts: 0, // Add other income sources if needed
            total: customerPaymentAmount + ecommercePaymentAmount,
        };

        const payments = {
            supplierPayments: supplierPaymentAmount,
            otherPayments: 0, // Add other expenses if needed
            total: supplierPaymentAmount,
        };

        return {
            receipts,
            payments,
            netCashFlow: receipts.total - Number(payments.total),
        };
    }

    /**
     * Get profit & loss for textile business
     */
    static async getProfitLoss(
        userId: string,
        startDate: Date,
        endDate: Date
    ): Promise<{
        revenue: {
            walkInSales: number; // In-store sales
            ecommerceSales: number; // Online sales
            otherIncome: number;
            total: number;
        };
        expenses: {
            supplierInvoices: number; // Cost of goods purchased
            otherExpenses: number;
            total: number;
        };
        grossProfit: number;
        netProfit: number;
    }> {
        const dateFilter = { gte: startDate, lte: endDate };

        // Revenue streams
        const [walkInSales, ecommerceSales, supplierInvoices] =
            await Promise.all([
                // Walk-in sales
                prisma.sale.aggregate({
                    where: {
                        userId,
                        date: dateFilter,
                        status: { not: "CANCELLED" },
                    },
                    _sum: { amount: true },
                }),
                // E-commerce sales
                prisma.order.aggregate({
                    where: {
                        userId,
                        createdAt: dateFilter,
                        status: { not: "CANCELLED" },
                    },
                    _sum: { totalAmount: true },
                }),
                // Cost of goods (supplier invoices)
                prisma.invoice.aggregate({
                    where: {
                        userId,
                        date: dateFilter,
                        status: { not: "CANCELLED" },
                    },
                    _sum: { amount: true },
                }),
            ]);

        const walkInSalesAmount = this.toNumber(walkInSales._sum.amount);
        const ecommerceSalesAmount = this.toNumber(
            ecommerceSales._sum.totalAmount
        );
        const supplierInvoiceAmount = this.toNumber(
            supplierInvoices._sum.amount
        );

        const revenue = {
            walkInSales: walkInSalesAmount,
            ecommerceSales: ecommerceSalesAmount,
            otherIncome: 0,
            total: walkInSalesAmount + ecommerceSalesAmount,
        };

        const expenses = {
            supplierInvoices: supplierInvoiceAmount,
            otherExpenses: 0, // You can add other expense categories
            total: supplierInvoiceAmount,
        };

        const grossProfit = revenue.total - Number(expenses.supplierInvoices);
        const netProfit = grossProfit - expenses.otherExpenses;

        return {
            revenue,
            expenses,
            grossProfit,
            netProfit,
        };
    }

    /**
     * Log credit limit change for audit trail
     */

    static async logCreditLimitChange(data: {
        customerId: string;
        oldLimit: number;
        newLimit: number;
        userId: string;
        reason: string;
        date?: Date;
    }): Promise<void> {
        const entryDate = data.date || new Date();

        await prisma.ledgerEntry.create({
            data: {
                date: entryDate,
                description: `Credit limit changed from ${data.oldLimit} to ${data.newLimit} - ${data.reason}`,
                debit: 0,
                credit: 0, // No financial impact, just audit trail
                balance: 0,
                type: "CREDIT_LIMIT_CHANGE",
                reference: `CREDIT-LIMIT-${Date.now()}`,
                customerId: data.customerId,
                userId: data.userId,
            },
        });

        logger.info("Credit limit change logged", LogCategory.LEDGER, {
            customerId: data.customerId,
            oldLimit: data.oldLimit,
            newLimit: data.newLimit,
            reason: data.reason,
            userId: data.userId,
        });
    }
}
