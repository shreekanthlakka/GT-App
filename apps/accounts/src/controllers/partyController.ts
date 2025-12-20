import { prisma } from "@repo/db/prisma";
import {
    CustomError,
    CustomResponse,
    asyncHandler,
} from "@repo/common-backend/utils";

import { logger, LogCategory } from "@repo/common-backend/logger";
import {
    PartyCreatedPublisher,
    PartyUpdatedPublisher,
    PartyDeletedPublisher,
} from "../events/publishers/partyPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { LedgerService } from "../services/ledgerService";

/**
 * ==============================================================================================
 *   ##############  Create a new party ############
 * ==============================================================================================
 */

export const createParty = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return;
    const {
        name,
        gstNo,
        panNo,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        contactPerson,
        bankName,
        accountNo,
        ifscCode,
        category,
        paymentTerms,
        creditLimit = 0,
        taxId,
        website,
        notes,
    } = req.body;

    logger.info("Creating party", LogCategory.PARTY, {
        userId,
        partyName: name,
        gstNo,
        category,
    });

    // Check for duplicate GST number for this user
    if (gstNo) {
        const existingParty = await prisma.party.findFirst({
            where: {
                gstNo,
                userId,
                isActive: true,
            },
        });

        if (existingParty) {
            throw new CustomError(
                409,
                "Party with this GST number already exists"
            );
        }
    }

    // Create party
    const party = await prisma.party.create({
        data: {
            name,
            gstNo,
            panNo,
            phone,
            email,
            address,
            city,
            state,
            pincode,
            contactPerson,
            bankDetails:
                bankName && accountNo && ifscCode
                    ? {
                          create: { bankName, accountNo, ifsc: ifscCode },
                      }
                    : undefined,

            category,
            paymentTerms,
            creditLimit,
            taxId,
            website,
            notes,
            userId,
        },
        include: {
            bankDetails: true,
        },
    });

    // Create opening balance if creditLimit is provided
    if (creditLimit > 0) {
        await LedgerService.createOpeningBalance({
            partyId: party.id,
            amount: 0, // Starting with zero balance
            creditLimit,
            userId,
            description: `Opening balance for ${party.name}`,
        });
    }

    // Audit log
    logger.audit("CREATE", "Party", party.id, userId, null, party, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish party created event
    const partyCreatedPublisher = new PartyCreatedPublisher(
        kafkaWrapper.producer
    );

    const defaultBank =
        party.bankDetails.find((b) => b.isDefault) ?? party.bankDetails[0];
    await partyCreatedPublisher.publish({
        id: party.id,
        name: party.name,
        gstNo: party.gstNo || undefined,
        panNo: party.panNo || undefined,
        phone: party.phone || undefined,
        email: party.email || undefined,
        address: party.address || undefined,
        city: party.city || undefined,
        state: party.state || undefined,
        pincode: party.pincode || undefined,
        contactPerson: party.contactPerson || undefined,
        bankDetails: defaultBank
            ? {
                  bankName: defaultBank.bankName,
                  accountNo: defaultBank.accountNo,
                  ifsc: defaultBank.ifsc,
                  branch: defaultBank.branch ?? undefined,
              }
            : undefined,
        category: party.category || undefined,
        paymentTerms: party.paymentTerms || undefined,
        creditLimit: Number(party.creditLimit),
        taxId: party.taxId || undefined,
        website: party.website || undefined,
        notes: party.notes || undefined,
        createdBy: userId,
        createdAt: party.createdAt.toISOString(),
    });

    logger.info("Party created successfully", LogCategory.PARTY, {
        partyId: party.id,
        partyName: party.name,
        userId,
    });

    const response = new CustomResponse(201, "Party created successfully", {
        party,
    });
    res.status(response.statusCode).json(response);
});

/**
 * ============================================================================================
 *   ##############  Get all parties with filtering, sorting, and pagination ############
 * ============================================================================================
 *
 */

export const getParties = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const {
        page = 1,
        limit = 10,
        search,
        category,
        city,
        state,
        isActive = true,
        sortBy = "name",
        sortOrder = "asc",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const whereClause: any = {
        userId,
        isActive: isActive === "true",
    };

    if (search) {
        whereClause.OR = [
            { name: { contains: search as string, mode: "insensitive" } },
            { gstNo: { contains: search as string, mode: "insensitive" } },
            { phone: { contains: search as string, mode: "insensitive" } },
            { email: { contains: search as string, mode: "insensitive" } },
        ];
    }

    if (category) {
        whereClause.category = category;
    }

    if (city) {
        whereClause.city = { contains: city as string, mode: "insensitive" };
    }

    if (state) {
        whereClause.state = { contains: state as string, mode: "insensitive" };
    }

    const [parties, total] = await Promise.all([
        prisma.party.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: {
                [sortBy as string]: sortOrder as "asc" | "desc",
            },
            include: {
                _count: {
                    select: {
                        invoices: { where: { status: { not: "CANCELLED" } } },
                        invoicePayments: true,
                    },
                },
            },
        }),
        prisma.party.count({ where: whereClause }),
    ]);

    // Get balances for each party
    const partiesWithBalances = await Promise.all(
        parties.map(async (party: (typeof parties)[0]) => {
            const balance = await LedgerService.getPartyBalance(party.id);
            return {
                ...party,
                balance: balance.balance,
                totalInvoices: balance.totalInvoices,
                totalPayments: balance.totalPayments,
                lastTransactionDate: balance.lastEntryDate,
            };
        })
    );

    const response = new CustomResponse(200, "Parties retrieved successfully", {
        parties: partiesWithBalances,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
    });
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 *    ##################################  Get party by ID  #################################
 * @route GET /api/parties/:id
 * @access Private
 * @param {string} id - Party ID
 * @returns {Party} - Party details
 * @throws {CustomError} - If party not found
 * @example
 * GET /api/parties/1
 * ==========================================================================================
 *
 */

export const getPartyById = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const party = await prisma.party.findFirst({
        where: {
            id,
            userId,
        },
        include: {
            invoices: {
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    invoiceNo: true,
                    date: true,
                    amount: true,
                    remainingAmount: true,
                    status: true,
                },
            },
            invoicePayments: {
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    voucherId: true,
                    amount: true,
                    date: true,
                    method: true,
                    status: true,
                },
            },
            _count: {
                select: {
                    invoices: { where: { status: { not: "CANCELLED" } } },
                    invoicePayments: true,
                },
            },
        },
    });

    if (!party) {
        throw new CustomError(404, "Party not found");
    }

    // Get ledger balance
    const balance = await LedgerService.getPartyBalance(party.id);

    const response = new CustomResponse(200, "Party retrieved successfully", {
        party: {
            ...party,
            balance: balance.balance,
            totalInvoices: balance.totalInvoices,
            totalPayments: balance.totalPayments,
            lastTransactionDate: balance.lastEntryDate,
        },
    });
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 *    ##################################  Update party  #################################
 * @route PUT /api/parties/:id
 * @access Private
 * @param {string} id - Party ID
 * @param {Party} partyData - Party data to update
 * @returns {Party} - Updated party
 * @throws {CustomError} - If party not found or validation fails
 * @example
 * PUT /api/parties/1
 * ==========================================================================================
 *
 */

export const updateParty = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updateData = req.body;

    if (!userId || !id) {
        throw new CustomError(400, "ids required");
    }
    // Get existing party
    const existingParty = await prisma.party.findFirst({
        where: { id, userId },
    });

    if (!existingParty) {
        throw new CustomError(404, "Party not found");
    }

    // Check for duplicate GST if GST is being updated
    if (updateData.gstNo && updateData.gstNo !== existingParty.gstNo) {
        const duplicateGST = await prisma.party.findFirst({
            where: {
                gstNo: updateData.gstNo,
                userId,
                id: { not: id },
                isActive: true,
            },
        });

        if (duplicateGST) {
            throw new CustomError(
                409,
                "Party with this GST number already exists"
            );
        }
    }

    // Update party
    const updatedParty = await prisma.party.update({
        where: { id },
        data: {
            ...updateData,
            updatedAt: new Date(),
        },
    });

    // Log credit limit change if changed
    // if (
    //     updateData.creditLimit &&
    //     updateData.creditLimit !== existingParty.creditLimit
    // ) {
    //     await LedgerService.logCreditLimitChange({
    //         partyId: id,
    //         oldLimit: Number(existingParty.creditLimit),
    //         newLimit: Number(updateData.creditLimit),
    //         userId,
    //         reason: "Manual update via party management",
    //     });
    // }

    // Calculate changes for event
    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== (existingParty as any)[key]) {
            changes[key] = {
                oldValue: (existingParty as any)[key],
                newValue: updateData[key],
            };
        }
    });

    // Audit log
    logger.audit("UPDATE", "Party", id, userId, existingParty, updatedParty, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish party updated event
    const partyUpdatedPublisher = new PartyUpdatedPublisher(
        kafkaWrapper.producer
    );
    await partyUpdatedPublisher.publish({
        id: updatedParty.id,
        updatedAt: updatedParty.updatedAt.toISOString(),
        changes,
        updatedBy: userId,
        gstChanged: !!changes.gstNo,
        contactChanged: !!(changes.phone || changes.email || changes.address),
        bankDetailsChanged: !!changes.bankDetails,
        creditLimitChanged: !!changes.creditLimit,
        categoryChanged: !!changes.category,
    });

    logger.info("Party updated successfully", LogCategory.PARTY, {
        partyId: id,
        partyName: updatedParty.name,
        userId,
        changesCount: Object.keys(changes).length,
    });

    const response = new CustomResponse(200, "Party updated successfully", {
        party: updatedParty,
    });
    res.status(response.statusCode).json(response);
});

/**
 * =========================================================================================
 * Delete a party
 * @route DELETE /api/parties/:id
 * @access Private
 * ==========================================================================================
 */
export const deleteParty = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || !id) {
        throw new CustomError(400, "Ids required");
    }

    const party = await prisma.party.findFirst({
        where: { id, userId },
        include: {
            _count: {
                select: {
                    invoices: { where: { status: { not: "CANCELLED" } } },
                    invoicePayments: true,
                },
            },
        },
    });

    if (!party) {
        throw new CustomError(404, "Party not found");
    }

    // Check if party has transactions
    const hasTransactions =
        party._count.invoices > 0 || party._count.invoicePayments > 0;

    if (hasTransactions) {
        // Soft delete - deactivate instead of hard delete
        const updatedParty = await prisma.party.update({
            where: { id },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });

        logger.info("Party deactivated (has transactions)", LogCategory.PARTY, {
            partyId: id,
            partyName: party.name,
            userId,
            invoiceCount: party._count.invoices,
            paymentCount: party._count.invoicePayments,
        });

        const response = new CustomResponse(
            200,
            "Party deactivated successfully (has existing transactions)",
            {
                party: updatedParty,
            }
        );
        return res.status(response.statusCode).json(response);
    }

    // Hard delete if no transactions
    await prisma.party.delete({
        where: { id },
    });

    // Audit log
    logger.audit("DELETE", "Party", id, userId, party, null, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish party deleted event
    const partyDeletedPublisher = new PartyDeletedPublisher(
        kafkaWrapper.producer
    );
    await partyDeletedPublisher.publish({
        id: party.id,
        name: party.name,
        gstNo: party.gstNo || undefined,
        category: party.category || undefined,
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
        hasOutstandingInvoices: false,
        finalBalance: 0,
        reason: "Manual deletion via party management",
    });

    logger.info("Party deleted successfully", LogCategory.PARTY, {
        partyId: id,
        partyName: party.name,
        userId,
    });

    const response = new CustomResponse(200, "Party deleted successfully");
    res.status(response.statusCode).json(response);
});

/**
 * =========================================================================================
 *    #########################   Get party ledger ####################################
 *
 * /api/v1/parties/:id/ledger
 * @method GET
 * @access Private
 * ==========================================================================================
 */

export const getPartyLedger = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    if (!id || !userId) {
        throw new CustomError(400, "Ids required");
    }

    // Verify party belongs to user
    const party = await prisma.party.findFirst({
        where: { id, userId },
        select: { id: true, name: true },
    });

    if (!party) {
        throw new CustomError(404, "Party not found");
    }

    const query: any = {
        limit: Number(limit),
        offset: Number(offset),
    };

    if (startDate || endDate) {
        query.dateRange = {};
        if (startDate) query.dateRange.gte = new Date(startDate as string);
        if (endDate) query.dateRange.lte = new Date(endDate as string);
    }

    const ledgerStatement = await LedgerService.getPartyLedger(id, query);

    const response = new CustomResponse(
        200,
        "Party ledger retrieved successfully",
        {
            party: { id: party.id, name: party.name },
            ledger: ledgerStatement,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ===========================================================================================
 *    #########################   Get party statement ####################################
 *============================================================================================
 */

export const getPartyStatement = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { startDate, endDate, format = "json" } = req.query;
    if (!userId || !id) {
        throw new CustomError(400, "Ids required");
    }

    // Verify party belongs to user
    const party = await prisma.party.findFirst({
        where: { id, userId },
        select: { id: true, name: true, email: true, phone: true },
    });

    if (!party) {
        throw new CustomError(404, "Party not found");
    }

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const ledgerStatement = await LedgerService.getPartyLedger(id, {
        dateRange: { gte: start, lte: end },
        limit: 1000,
    });

    // Get outstanding invoices
    const outstandingInvoices = await prisma.invoice.findMany({
        where: {
            partyId: id,
            status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
        },
        select: {
            id: true,
            invoiceNo: true,
            date: true,
            dueDate: true,
            amount: true,
            remainingAmount: true,
            status: true,
        },
        orderBy: { date: "asc" },
    });

    const statement = {
        party,
        period: {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        },
        ledger: ledgerStatement,
        outstandingInvoices,
        summary: {
            totalInvoiced: ledgerStatement.totalCredit,
            totalPaid: ledgerStatement.totalDebit,
            currentBalance: ledgerStatement.closingBalance,
            overdueAmount: outstandingInvoices
                .filter((inv: any) => inv.status === "OVERDUE")
                .reduce(
                    (sum: number, inv: any) =>
                        sum + Number(inv.remainingAmount),
                    0
                ),
        },
    };

    const response = new CustomResponse(
        200,
        "Party statement generated successfully",
        {
            statement,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * =========================================================================================
 *    #########################   Get party analytics ####################################
 *============================================================================================
 *
 */
export const getPartyAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { startDate, endDate, partyId } = req.query;

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const whereClause: any = {
        userId,
        date: { gte: start, lte: end },
    };

    if (partyId) {
        whereClause.partyId = partyId;
    }

    // Get invoice analytics
    const [invoiceStats, paymentStats, topParties] = await Promise.all([
        // Invoice statistics
        prisma.invoice.aggregate({
            where: whereClause,
            _sum: { amount: true, remainingAmount: true },
            _count: true,
        }),

        // Payment statistics
        prisma.invoicePayment.aggregate({
            where: whereClause,
            _sum: { amount: true },
            _count: true,
        }),

        // Top parties by invoice amount
        prisma.invoice.groupBy({
            by: ["partyId"],
            where: whereClause,
            _sum: { amount: true, remainingAmount: true },
            _count: true,
            orderBy: { _sum: { amount: "desc" } },
            take: 10,
        }),
    ]);

    // Get party details for top parties
    const partyIds = topParties.map((tp: any) => tp.partyId);
    const parties = await prisma.party.findMany({
        where: { id: { in: partyIds } },
        select: { id: true, name: true, category: true, city: true },
    });

    const topPartiesWithDetails = topParties.map((tp: any) => {
        const party = parties.find((p: any) => p.id === tp.partyId);
        return {
            partyId: tp.partyId,
            partyName: party?.name || "Unknown",
            category: party?.category,
            city: party?.city,
            totalInvoices: tp._sum.amount || 0,
            outstandingAmount: tp._sum.remainingAmount || 0,
            invoiceCount: tp._count,
            paymentRate: tp._sum.amount
                ? ((Number(tp._sum.amount) -
                      Number(tp._sum.remainingAmount || 0)) /
                      Number(tp._sum.amount)) *
                  100
                : 0,
        };
    });

    // Payment method analysis
    const paymentMethods = await prisma.invoicePayment.groupBy({
        by: ["method"],
        where: whereClause,
        _sum: { amount: true },
        _count: true,
    });

    // Category analysis
    const categoryStats = await prisma.party.findMany({
        where: { userId, isActive: true },
        select: { category: true },
    });

    const categoryBreakdown = categoryStats.reduce(
        (acc: Record<string, number>, party: any) => {
            const category = party.category || "Uncategorized";
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        },
        {}
    );

    const response = new CustomResponse(
        200,
        "Party analytics retrieved successfully",
        {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            overview: {
                totalInvoiced: invoiceStats._sum.amount || 0,
                totalPaid: paymentStats._sum.amount || 0,
                totalOutstanding: invoiceStats._sum.remainingAmount || 0,
                invoiceCount: invoiceStats._count,
                paymentCount: paymentStats._count,
                averageInvoiceValue:
                    invoiceStats._count > 0
                        ? Number(invoiceStats._sum.amount || 0) /
                          invoiceStats._count
                        : 0,
                paymentRate: invoiceStats._sum.amount
                    ? (Number(paymentStats._sum.amount || 0) /
                          Number(invoiceStats._sum.amount || 1)) *
                      100
                    : 0,
            },
            topParties: topPartiesWithDetails,
            paymentMethods,
            categoryBreakdown,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 * Get party performance analytics
 * @route GET /api/parties/:id/performance
 * @access Private
 * @param {string} id - Party ID
 * @param {number} months - Number of months to analyze (default: 6)
 * @returns {object} - Party performance analytics
 * @throws {CustomError} - If party not found or unauthorized
 * @example
 * GET /api/parties/123/performance?months=12
 * ==========================================================================================
 *
 */

export const getPartyPerformance = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { months = 6 } = req.query;

    if (!userId || !id) {
        throw new CustomError(400);
    }

    // Verify party belongs to user
    const party = await prisma.party.findFirst({
        where: { id, userId },
        select: { id: true, name: true, paymentTerms: true },
    });

    if (!party) {
        throw new CustomError(404, "Party not found");
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    // Get monthly invoice and payment trends
    const invoiceTrends = await prisma.invoice.findMany({
        where: {
            partyId: id,
            date: { gte: startDate, lte: endDate },
            status: { not: "CANCELLED" },
        },
        select: {
            date: true,
            amount: true,
            remainingAmount: true,
            status: true,
        },
        orderBy: { date: "asc" },
    });

    const paymentTrends = await prisma.invoicePayment.findMany({
        where: {
            partyId: id,
            date: { gte: startDate, lte: endDate },
        },
        select: {
            date: true,
            amount: true,
            method: true,
        },
        orderBy: { date: "asc" },
    });

    // Calculate payment timeliness
    const paidInvoices = await prisma.invoice.findMany({
        where: {
            partyId: id,
            status: "PAID",
            date: { gte: startDate },
        },
        include: {
            invoicePayments: {
                select: { date: true, amount: true },
                orderBy: { date: "desc" },
                take: 1,
            },
        },
    });

    const paymentTimeliness = paidInvoices
        .map((invoice: (typeof paidInvoices)[0]) => {
            const paymentDate = invoice.invoicePayments[0]?.date;
            if (!paymentDate || !invoice.dueDate) return null;

            const daysDifference = Math.floor(
                (paymentDate.getTime() - invoice.dueDate.getTime()) /
                    (1000 * 60 * 60 * 24)
            );
            return {
                invoiceId: invoice.id,
                invoiceNo: invoice.invoiceNo,
                dueDate: invoice.dueDate,
                paymentDate,
                daysDifference,
                onTime: daysDifference <= 0,
            };
        })
        .filter(Boolean);

    const onTimePayments = paymentTimeliness.filter(
        (p: (typeof paymentTimeliness)[0]) => p!.onTime
    ).length;
    const onTimeRate =
        paymentTimeliness.length > 0
            ? (onTimePayments / paymentTimeliness.length) * 100
            : 0;

    // Group data by month for trends
    const monthlyData: Record<
        string,
        {
            invoices: number;
            payments: number;
            invoiceAmount: number;
            paymentAmount: number;
        }
    > = {};

    invoiceTrends.forEach((invoice: (typeof invoiceTrends)[0]) => {
        const monthKey = invoice.date.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                invoices: 0,
                payments: 0,
                invoiceAmount: 0,
                paymentAmount: 0,
            };
        }
        monthlyData[monthKey].invoices += 1;
        monthlyData[monthKey].invoiceAmount += Number(invoice.amount);
    });

    paymentTrends.forEach((payment: (typeof paymentTrends)[0]) => {
        const monthKey = payment.date.toISOString().substring(0, 7);
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                invoices: 0,
                payments: 0,
                invoiceAmount: 0,
                paymentAmount: 0,
            };
        }
        monthlyData[monthKey].payments += 1;
        monthlyData[monthKey].paymentAmount += Number(payment.amount);
    });

    const monthlyTrends = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
            month,
            invoiceCount: data.invoices,
            paymentCount: data.payments,
            invoiceAmount: data.invoiceAmount,
            paymentAmount: data.paymentAmount,
        }));

    const response = new CustomResponse(
        200,
        "Party performance retrieved successfully",
        {
            party: {
                id: party.id,
                name: party.name,
                paymentTerms: party.paymentTerms,
            },
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
            },
            performance: {
                totalInvoices: invoiceTrends.length,
                totalPayments: paymentTrends.length,
                onTimePaymentRate: Math.round(onTimeRate * 100) / 100,
                averagePaymentDelay:
                    paymentTimeliness.length > 0
                        ? Math.round(
                              paymentTimeliness.reduce(
                                  (
                                      sum: number,
                                      p: (typeof paymentTimeliness)[0]
                                  ) => sum + (p?.daysDifference || 0),
                                  0
                              ) / paymentTimeliness.length
                          )
                        : 0,
            },
            monthlyTrends,
            paymentTimeliness: paymentTimeliness.slice(0, 20), // Latest 20 payments
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==============================================================================================
 *         #################### Get party comparison data #################################
 * @route GET /api/parties/comparison
 * @access Private
 * @description Get comparison data for multiple parties
 * @param {string[]} partyIds - Array of party IDs to compare
 * @param {string} [startDate] - Start date for comparison (default: first day of current month)
 * @param {string} [endDate] - End date for comparison (default: today)
 * @param {string} [metric] - Metric to compare (amount, count, or average)
 * @returns {object} Comparison data for each party
 * @example
 * GET /api/parties/comparison?partyIds[]=1&partyIds[]=2&startDate=2023-01-01&endDate=2023-12-31&metric=amount
 * ==================================================================================================
 *
 */

export const getPartyComparison = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { partyIds, startDate, endDate, metric = "amount" } = req.query;

    if (!partyIds || !userId) {
        throw new CustomError(400, "IDs are required");
    }

    const ids = Array.isArray(partyIds) ? partyIds : [partyIds];
    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    // Verify all parties belong to user
    const parties = await prisma.party.findMany({
        where: {
            id: { in: ids as string[] },
            userId,
        },
        select: {
            id: true,
            name: true,
            category: true,
            paymentTerms: true,
        },
    });

    if (parties.length !== ids.length) {
        throw new CustomError(404, "One or more parties not found");
    }

    // Get comparison data for each party
    const comparisonData = await Promise.all(
        parties.map(async (party: (typeof parties)[0]) => {
            const [invoiceStats, paymentStats] = await Promise.all([
                prisma.invoice.aggregate({
                    where: {
                        partyId: party.id,
                        date: { gte: start, lte: end },
                        status: { not: "CANCELLED" },
                    },
                    _sum: { amount: true, remainingAmount: true },
                    _count: true,
                }),
                prisma.invoicePayment.aggregate({
                    where: {
                        partyId: party.id,
                        date: { gte: start, lte: end },
                    },
                    _sum: { amount: true },
                    _count: true,
                }),
            ]);

            return {
                party,
                invoiceAmount: invoiceStats._sum.amount || 0,
                invoiceCount: invoiceStats._count,
                paymentAmount: paymentStats._sum.amount || 0,
                paymentCount: paymentStats._count,
                outstandingAmount: invoiceStats._sum.remainingAmount || 0,
                paymentRate: invoiceStats._sum.amount
                    ? (Number(paymentStats._sum.amount || 0) /
                          Number(invoiceStats._sum.amount)) *
                      100
                    : 0,
            };
        })
    );

    // Sort by the requested metric
    const sortedData = comparisonData.sort((a, b) => {
        switch (metric) {
            case "amount":
                return (
                    (b.invoiceAmount as number) - (a.invoiceAmount as number)
                );
            case "count":
                return b.invoiceCount - a.invoiceCount;
            case "payments":
                return (
                    (b.paymentAmount as number) - (a.paymentAmount as number)
                );
            case "outstanding":
                return (
                    (b.outstandingAmount as number) -
                    (a.outstandingAmount as number)
                );
            default:
                return (
                    (b.invoiceAmount as number) - (a.invoiceAmount as number)
                );
        }
    });

    const response = new CustomResponse(
        200,
        "Party comparison retrieved successfully",
        {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            metric,
            comparison: sortedData,
            summary: {
                totalInvoiceAmount: comparisonData.reduce(
                    (sum, p) => sum + (p.invoiceAmount as number),
                    0
                ),
                totalPaymentAmount: comparisonData.reduce(
                    (sum, p) => sum + (p.paymentAmount as number),
                    0
                ),
                totalOutstanding: comparisonData.reduce(
                    (sum, p) => sum + (p.outstandingAmount as number),
                    0
                ),
                averagePaymentRate:
                    comparisonData.length > 0
                        ? comparisonData.reduce(
                              (sum, p) => sum + p.paymentRate,
                              0
                          ) / comparisonData.length
                        : 0,
            },
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 * Get all invoices for a party
 * @route GET /api/v1/parties/:id/invoices
 * @access Private
 * @param {string} id - Party ID
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Items per page (default: 10)
 * @param {string} status - Filter by status (optional)
 * @param {string} sortBy - Sort field (default: date)
 * @param {string} sortOrder - Sort order (default: desc)
 * @returns {object} - Paginated invoices for the party
 * @throws {CustomError} - If party not found or unauthorized
 * @example
 * GET /api/v1/parties/123/invoices?page=1&limit=10&status=PENDING
 * ==========================================================================================
 */

export const getPartyInvoices = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const {
        page = 1,
        limit = 10,
        status,
        sortBy = "date",
        sortOrder = "desc",
    } = req.query;

    if (!userId || !id) {
        throw new CustomError(400, "User ID and Party ID required");
    }

    // Verify party belongs to user
    const party = await prisma.party.findFirst({
        where: { id, userId },
        select: { id: true, name: true },
    });

    if (!party) {
        throw new CustomError(404, "Party not found");
    }

    // Build where clause
    const whereClause: any = {
        partyId: id,
        userId,
    };

    // Add status filter if provided
    if (status) {
        whereClause.status = status;
    }

    // Get total count
    const total = await prisma.invoice.count({ where: whereClause });

    // Get paginated invoices
    const invoices = await prisma.invoice.findMany({
        where: whereClause,
        select: {
            id: true,
            voucherId: true,
            invoiceNo: true,
            date: true,
            dueDate: true,
            amount: true,
            paidAmount: true,
            remainingAmount: true,
            status: true,
            taxAmount: true,
            discountAmount: true,
            description: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
        },
        orderBy: { [sortBy as string]: sortOrder },
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
    });

    logger.info("Party invoices retrieved", LogCategory.PARTY, {
        partyId: id,
        partyName: party.name,
        invoiceCount: invoices.length,
        total,
        page,
        limit,
    });

    const response = new CustomResponse(
        200,
        "Party invoices retrieved successfully",
        {
            party: {
                id: party.id,
                name: party.name,
            },
            invoices,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 * Get party outstanding balance and invoices
 * @route GET /api/v1/parties/:id/outstanding
 * @access Private
 * @param {string} id - Party ID
 * @returns {object} - Outstanding balance and unpaid invoices
 * @throws {CustomError} - If party not found or unauthorized
 * ==========================================================================================
 */

export const getPartyOutstanding = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || !id) {
        throw new CustomError(400, "User ID and Party ID required");
    }

    // Verify party belongs to user
    const party = await prisma.party.findFirst({
        where: { id, userId },
        select: {
            id: true,
            name: true,
            gstNo: true,
            phone: true,
            email: true,
            creditLimit: true,
            paymentTerms: true,
        },
    });

    if (!party) {
        throw new CustomError(404, "Party not found");
    }

    // Get outstanding invoices
    const outstandingInvoices = await prisma.invoice.findMany({
        where: {
            partyId: id,
            userId,
            status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
        },
        select: {
            id: true,
            voucherId: true,
            invoiceNo: true,
            date: true,
            dueDate: true,
            amount: true,
            paidAmount: true,
            remainingAmount: true,
            status: true,
            description: true,
            notes: true,
        },
        orderBy: { dueDate: "asc" },
    });

    // Calculate totals
    const totalOutstanding = outstandingInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.remainingAmount),
        0
    );

    const overdueInvoices = outstandingInvoices.filter(
        (inv) => inv.status === "OVERDUE"
    );
    const overdueAmount = overdueInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.remainingAmount),
        0
    );

    const pendingInvoices = outstandingInvoices.filter(
        (inv: any) => inv.status === "PENDING"
    );
    const pendingAmount = pendingInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.remainingAmount),
        0
    );

    const partiallyPaidInvoices = outstandingInvoices.filter(
        (inv) => inv.status === "PARTIALLY_PAID"
    );
    const partiallyPaidAmount = partiallyPaidInvoices.reduce(
        (sum: number, inv: any) => sum + Number(inv.remainingAmount),
        0
    );

    // Calculate days overdue
    const now = new Date();
    const invoicesWithDaysOverdue = outstandingInvoices.map(
        (inv: (typeof outstandingInvoices)[0]) => {
            const daysOverdue =
                inv.status === "OVERDUE" && inv.dueDate
                    ? Math.floor(
                          (now.getTime() - new Date(inv.dueDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                      )
                    : 0;

            return {
                ...inv,
                daysOverdue: daysOverdue > 0 ? daysOverdue : 0,
            };
        }
    );

    // Get ledger balance
    const balance = await LedgerService.getPartyBalance(party.id);

    // Credit limit utilization
    const creditLimit = Number(party.creditLimit);
    const creditUtilization =
        creditLimit > 0 ? (totalOutstanding / creditLimit) * 100 : 0;

    logger.info("Party outstanding retrieved", LogCategory.PARTY, {
        partyId: id,
        partyName: party.name,
        totalOutstanding,
        overdueAmount,
        invoiceCount: outstandingInvoices.length,
    });

    const response = new CustomResponse(
        200,
        "Party outstanding retrieved successfully",
        {
            party: {
                id: party.id,
                name: party.name,
                gstNo: party.gstNo,
                phone: party.phone,
                email: party.email,
                creditLimit: party.creditLimit,
                paymentTerms: party.paymentTerms,
            },
            summary: {
                totalOutstanding,
                overdueAmount,
                pendingAmount,
                partiallyPaidAmount,
                currentBalance: balance.balance,
                creditLimit,
                creditUtilization: Math.round(creditUtilization * 100) / 100,
                creditAvailable:
                    creditLimit > totalOutstanding
                        ? creditLimit - totalOutstanding
                        : 0,
            },
            invoices: {
                all: invoicesWithDaysOverdue,
                overdue: invoicesWithDaysOverdue.filter(
                    (inv: (typeof invoicesWithDaysOverdue)[0]) =>
                        inv.status === "OVERDUE"
                ),
                pending: invoicesWithDaysOverdue.filter(
                    (inv: (typeof invoicesWithDaysOverdue)[0]) =>
                        inv.status === "PENDING"
                ),
                partiallyPaid: invoicesWithDaysOverdue.filter(
                    (inv: (typeof invoicesWithDaysOverdue)[0]) =>
                        inv.status === "PARTIALLY_PAID"
                ),
            },
            counts: {
                total: outstandingInvoices.length,
                overdue: overdueInvoices.length,
                pending: pendingInvoices.length,
                partiallyPaid: partiallyPaidInvoices.length,
            },
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 * Get top parties by invoice volume
 * @route GET /api/v1/parties/analytics/top
 * @access Private
 * ==========================================================================================
 */

export const getTopParties = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { limit = 10, startDate, endDate, sortBy = "amount" } = req.query;

    if (!userId) {
        throw new CustomError(401, "Unauthorized");
    }

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const whereClause: any = {
        userId,
        date: { gte: start, lte: end },
    };

    // Get top parties by invoice amount
    const topPartiesByInvoice = await prisma.invoice.groupBy({
        by: ["partyId"],
        where: whereClause,
        _sum: {
            amount: true,
            remainingAmount: true,
            paidAmount: true,
        },
        _count: {
            _all: true,
        },
        orderBy: {
            _sum: {
                amount: sortBy === "amount" ? "desc" : undefined,
            },
            _count: {
                id: sortBy === "count" ? "desc" : undefined,
            },
        },
        take: Number(limit),
    });

    // Get party details
    const partyIds = topPartiesByInvoice.map((tp: any) => tp.partyId);
    const parties = await prisma.party.findMany({
        where: { id: { in: partyIds } },
        select: {
            id: true,
            name: true,
            category: true,
            city: true,
            state: true,
            gstNo: true,
            phone: true,
            email: true,
        },
    });

    // Get payment counts for each party
    const paymentCounts = await prisma.invoicePayment.groupBy({
        by: ["partyId"],
        where: {
            partyId: { in: partyIds },
            userId,
            date: { gte: start, lte: end },
        },
        _count: true,
        _sum: { amount: true },
    });

    // Combine data
    const topPartiesWithDetails = topPartiesByInvoice.map(
        (tp: (typeof topPartiesByInvoice)[0]) => {
            const party = parties.find(
                (p: (typeof parties)[0]) => p.id === tp.partyId
            );
            const payments = paymentCounts.find(
                (pc: (typeof paymentCounts)[0]) => pc.partyId === tp.partyId
            );

            const totalInvoiced = Number(tp._sum?.amount || 0);
            const totalPaid = Number(tp._sum?.paidAmount || 0);
            const totalOutstanding = Number(tp._sum?.remainingAmount || 0);

            return {
                partyId: tp.partyId,
                partyName: party?.name || "Unknown",
                category: party?.category,
                city: party?.city,
                state: party?.state,
                gstNo: party?.gstNo,
                phone: party?.phone,
                email: party?.email,
                metrics: {
                    totalInvoiced,
                    totalPaid,
                    totalOutstanding,
                    invoiceCount: tp._count,
                    paymentCount: payments?._count || 0,
                    averageInvoiceValue:
                        Number(tp._count) > 0
                            ? totalInvoiced / Number(tp._count)
                            : 0,
                    paymentRate:
                        totalInvoiced > 0
                            ? (totalPaid / totalInvoiced) * 100
                            : 0,
                    outstandingRate:
                        totalInvoiced > 0
                            ? (totalOutstanding / totalInvoiced) * 100
                            : 0,
                },
            };
        }
    );

    // Sort based on sortBy parameter
    let sortedParties = topPartiesWithDetails;
    if (sortBy === "outstanding") {
        sortedParties.sort(
            (
                a: (typeof topPartiesWithDetails)[0],
                b: (typeof topPartiesWithDetails)[0]
            ) => b.metrics.totalOutstanding - a.metrics.totalOutstanding
        );
    } else if (sortBy === "paymentRate") {
        sortedParties.sort(
            (
                a: (typeof topPartiesWithDetails)[0],
                b: (typeof topPartiesWithDetails)[0]
            ) => b.metrics.paymentRate - a.metrics.paymentRate
        );
    }

    logger.info("Top parties retrieved", LogCategory.PARTY, {
        userId,
        limit: Number(limit),
        count: sortedParties.length,
        period: { start, end },
    });

    const response = new CustomResponse(
        200,
        "Top parties retrieved successfully",
        {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            topParties: sortedParties,
        }
    );
    res.status(response.statusCode).json(response);
});
