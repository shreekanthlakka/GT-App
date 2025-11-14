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

export const createParty = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
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
        bankDetails,
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
            bankDetails,
            category,
            paymentTerms,
            creditLimit,
            taxId,
            website,
            notes,
            userId,
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
    await partyCreatedPublisher.publish({
        id: party.id,
        name: party.name,
        gstNo: party.gstNo,
        panNo: party.panNo,
        phone: party.phone,
        email: party.email,
        address: party.address,
        city: party.city,
        state: party.state,
        pincode: party.pincode,
        contactPerson: party.contactPerson,
        bankDetails: party.bankDetails,
        category: party.category,
        paymentTerms: party.paymentTerms,
        creditLimit: Number(party.creditLimit),
        taxId: party.taxId,
        website: party.website,
        notes: party.notes,
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

export const getParties = asyncHandler(async (req, res) => {
    const userId = req.user?.id;
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
        parties.map(async (party) => {
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
    if (
        updateData.creditLimit &&
        updateData.creditLimit !== existingParty.creditLimit
    ) {
        await LedgerService.logCreditLimitChange({
            partyId: id,
            oldLimit: Number(existingParty.creditLimit),
            newLimit: Number(updateData.creditLimit),
            userId,
            reason: "Manual update via party management",
        });
    }

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
                .filter((inv) => inv.status === "OVERDUE")
                .reduce((sum, inv) => sum + Number(inv.remainingAmount), 0),
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
    const partyIds = topParties.map((tp) => tp.partyId);
    const parties = await prisma.party.findMany({
        where: { id: { in: partyIds } },
        select: { id: true, name: true, category: true, city: true },
    });

    const topPartiesWithDetails = topParties.map((tp) => {
        const party = parties.find((p) => p.id === tp.partyId);
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
        (acc: Record<string, number>, party) => {
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
        .map((invoice) => {
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

    const onTimePayments = paymentTimeliness.filter((p) => p!.onTime).length;
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

    invoiceTrends.forEach((invoice) => {
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

    paymentTrends.forEach((payment) => {
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
                                  (sum, p) => sum + (p?.daysDifference || 0),
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
        parties.map(async (party) => {
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
