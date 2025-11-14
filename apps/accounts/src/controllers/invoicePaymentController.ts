import { InvoiceStatus, prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
    generateInvoicePaymentVoucherId,
    generateVoucherId,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import {
    InvoicePaymentCreatedPublisher,
    InvoicePaymentUpdatedPublisher,
    InvoicePaymentDeletedPublisher,
    InvoicePaymentProcessedPublisher,
} from "../events/publishers/invoicePaymentPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { LedgerService } from "../services/ledgerService";
import { SendEmailRequestPublisher } from "@repo/common-backend/publisher";

export const createInvoicePayment = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return;
    const {
        amount,
        date,
        method,
        reference,
        description,
        partyId,
        invoiceId,
        // Method-specific details
        bankName,
        chequeNo,
        chequeDate,
        gatewayOrderId,
        gatewayPaymentId,
        transactionId,
        upiTransactionId,
        charges,
        sequenceNo,
    } = req.body;

    logger.info("Creating invoice payment", LogCategory.ACCOUNTS, {
        userId,
        partyId,
        invoiceId,
        amount,
        method,
    });

    // Verify party exists and belongs to user
    const party = await prisma.party.findFirst({
        where: { id: partyId, userId, isActive: true },
        select: { id: true, name: true, email: true, phone: true },
    });

    if (!party) {
        throw new CustomError(404, "Party not found or inactive");
    }

    // If invoice is specified, verify it exists and belongs to the party
    let invoice = null;
    if (invoiceId) {
        invoice = await prisma.invoice.findFirst({
            where: { id: invoiceId, partyId, userId },
            select: {
                id: true,
                invoiceNo: true,
                amount: true,
                remainingAmount: true,
                status: true,
                date: true,
            },
        });

        if (!invoice) {
            throw new CustomError(
                404,
                "Invoice not found or doesn't belong to this party"
            );
        }

        // Check if invoice is already paid
        if (invoice.status === "PAID") {
            throw new CustomError(
                400,
                "Cannot add payment to already paid invoice"
            );
        }

        // Validate payment amount
        if (Number(amount) > Number(invoice.remainingAmount)) {
            throw new CustomError(
                400,
                "Payment amount exceeds remaining invoice amount"
            );
        }
    }

    const paymentDate = new Date(date);
    const paymentAmount = Number(amount);

    const voucherId = generateInvoicePaymentVoucherId(
        party.name,
        date,
        sequenceNo
    );

    // Create payment
    const payment = await prisma.invoicePayment.create({
        data: {
            voucherId,
            amount: paymentAmount,
            date: paymentDate,
            method,
            reference,
            description: description || `Payment for ${party.name}`,
            status: "COMPLETED",
            // Banking details
            bankName,
            chequeNo,
            chequeDate: chequeDate ? new Date(chequeDate) : null,
            charges: charges ? Number(charges) : null,
            // Gateway details
            gatewayOrderId,
            gatewayPaymentId,
            transactionId,
            failureReason: null,
            partyId,
            invoiceId,
            userId,
            sequenceNo,
        },
        include: {
            party: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                },
            },
            invoice: {
                select: {
                    id: true,
                    invoiceNo: true,
                    amount: true,
                    remainingAmount: true,
                },
            },
        },
    });

    // Update invoice if specified
    if (invoice) {
        const newPaidAmount =
            Number(invoice.amount) -
            Number(invoice.remainingAmount) +
            paymentAmount;
        const newRemainingAmount = Number(invoice.amount) - newPaidAmount;

        let newStatus = invoice.status;
        if (newRemainingAmount <= 0) {
            newStatus = "PAID";
        } else if (newRemainingAmount < Number(invoice.amount)) {
            newStatus = "PARTIALLY_PAID";
        }

        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newStatus,
                updatedAt: new Date(),
            },
        });
    }

    // Create ledger entry
    await LedgerService.createPaymentMadeEntry({
        paymentId: payment.id,
        partyId,
        amount: paymentAmount,
        description: payment.description || `Payment made for ${party.name}`,
        userId,
        date: paymentDate,
    });

    // Audit log
    logger.audit(
        "CREATE",
        "InvoicePayment",
        payment.id,
        userId,
        null,
        payment,
        {
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        }
    );

    // Publish payment created event
    const paymentCreatedPublisher = new InvoicePaymentCreatedPublisher(
        kafkaWrapper.producer
    );
    await paymentCreatedPublisher.publish({
        id: payment.id,
        voucherId: payment.voucherId,
        amount: Number(payment.amount),
        date: payment.date.toISOString(),
        method: payment.method,
        status: payment.status,
        reference: payment.reference || undefined,
        description: payment.description || undefined,
        partyId: payment.partyId,
        partyName: party.name,
        invoiceId: payment.invoiceId || undefined,
        invoiceNumber: invoice?.invoiceNo,
        appliedToInvoices: invoice
            ? [
                  {
                      invoiceId: invoice.id,
                      invoiceNumber: invoice.invoiceNo,
                      amountApplied: paymentAmount,
                      remainingAmount:
                          Number(invoice.remainingAmount) - paymentAmount,
                  },
              ]
            : undefined,
        unappliedAmount: invoice ? 0 : paymentAmount,
        prepayment: !invoice,
        methodDetails: {
            method: payment.method as any,
            ...(method === "CHEQUE" && chequeNo
                ? {
                      chequeNo,
                      chequeDate: chequeDate || payment.date.toISOString(),
                      bankName: bankName || "",
                      clearanceStatus: "ISSUED" as const,
                      postDated: chequeDate
                          ? new Date(chequeDate) > new Date()
                          : false,
                  }
                : {}),
            ...(method === "BANK_TRANSFER" && reference
                ? {
                      bankReference: reference,
                      transferMode: "NEFT" as const,
                      payerBankName: bankName || "",
                      payeeBankName: "",
                      ifscCode: "",
                      transferDate: payment.date.toISOString(),
                      valueDate: payment.date.toISOString(),
                      charges: charges || 0,
                  }
                : {}),
            ...(method === "UPI" && upiTransactionId
                ? {
                      upiTransactionId,
                      upiReference: reference || "",
                      payerVPA: "",
                      payeeVPA: "",
                      instantSettlement: true,
                  }
                : {}),
        } as any,
        createdBy: userId,
        createdAt: payment.createdAt.toISOString(),
    });

    // Send confirmation email if party has email
    if (party.email) {
        try {
            const emailPublisher = new SendEmailRequestPublisher(
                kafkaWrapper.producer
            );
            await emailPublisher.publish({
                eventId: `payment_received_${payment.id}_${Date.now()}`,
                recipientType: "PARTY",
                recipientId: party.id,
                recipient: {
                    email: party.email,
                    name: party.name,
                    phone: party.phone || undefined,
                },
                email: {
                    subject: `Payment Confirmation - ₹${payment.amount}`,
                    templateName: "PAYMENT_RECEIVED",
                    templateData: {
                        partyName: party.name,
                        paymentAmount: Number(payment.amount),
                        paymentDate: payment.date.toISOString(),
                        paymentMethod: payment.method,
                        paymentReference: payment.reference,
                        invoiceNo: invoice?.invoiceNo,
                    },
                },
                metadata: {
                    sourceService: "accounts",
                    sourceEntity: "invoicePayment",
                    sourceEntityId: payment.id,
                    priority: "MEDIUM",
                },
                userId,
                timestamp: new Date().toISOString(),
            });
        } catch (emailError) {
            logger.error(
                "Failed to send payment confirmation email",
                undefined,
                LogCategory.ACCOUNTS,
                {
                    paymentId: payment.id,
                    partyEmail: party.email,
                    error:
                        emailError instanceof Error
                            ? emailError.message
                            : String(emailError),
                }
            );
        }
    }

    logger.info("Invoice payment created successfully", LogCategory.ACCOUNTS, {
        paymentId: payment.id,
        voucherId: payment.voucherId,
        partyName: party.name,
        amount: paymentAmount,
        invoiceNo: invoice?.invoiceNo,
        userId,
    });

    const response = new CustomResponse(
        201,
        "Invoice payment created successfully",
        {
            payment,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ====================================================================================
 * ====================================================================================
 */

export const getInvoicePayments = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const {
        page = 1,
        limit = 10,
        search,
        partyId,
        invoiceId,
        method,
        status,
        startDate,
        endDate,
        sortBy = "date",
        sortOrder = "desc",
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const whereClause: any = {
        userId,
    };

    if (search) {
        whereClause.OR = [
            { voucherId: { contains: search as string, mode: "insensitive" } },
            { reference: { contains: search as string, mode: "insensitive" } },
            {
                description: {
                    contains: search as string,
                    mode: "insensitive",
                },
            },
            {
                party: {
                    name: { contains: search as string, mode: "insensitive" },
                },
            },
        ];
    }

    if (partyId) {
        whereClause.partyId = partyId;
    }

    if (invoiceId) {
        whereClause.invoiceId = invoiceId;
    }

    if (method) {
        whereClause.method = method;
    }

    if (status) {
        whereClause.status = status;
    }

    if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date.gte = new Date(startDate as string);
        if (endDate) whereClause.date.lte = new Date(endDate as string);
    }

    const [payments, total] = await Promise.all([
        prisma.invoicePayment.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: {
                [sortBy as string]: sortOrder as "asc" | "desc",
            },
            include: {
                party: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
                invoice: {
                    select: {
                        id: true,
                        invoiceNo: true,
                        amount: true,
                        remainingAmount: true,
                        status: true,
                    },
                },
            },
        }),
        prisma.invoicePayment.count({ where: whereClause }),
    ]);

    const response = new CustomResponse(
        200,
        "Invoice payments retrieved successfully",
        {
            payments,
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

export const getInvoicePaymentById = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const payment = await prisma.invoicePayment.findFirst({
        where: {
            id,
            userId,
        },
        include: {
            party: {
                select: {
                    id: true,
                    name: true,
                    gstNo: true,
                    phone: true,
                    email: true,
                    address: true,
                    city: true,
                    state: true,
                    pincode: true,
                },
            },
            invoice: {
                select: {
                    id: true,
                    invoiceNo: true,
                    date: true,
                    amount: true,
                    remainingAmount: true,
                    status: true,
                },
            },
            ledger: {
                orderBy: { createdAt: "desc" },
                take: 5,
                select: {
                    id: true,
                    date: true,
                    description: true,
                    debit: true,
                    credit: true,
                    balance: true,
                    type: true,
                },
            },
        },
    });

    if (!payment) {
        throw new CustomError(404, "Invoice payment not found");
    }

    const response = new CustomResponse(
        200,
        "Invoice payment retrieved successfully",
        {
            payment,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ====================================================================================
 * ====================================================================================
 */

export const updateInvoicePayment = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updateData = req.body;

    if (!userId || !id) {
        throw new CustomError(400);
    }

    // Get existing payment
    const existingPayment = await prisma.invoicePayment.findFirst({
        where: { id, userId },
        include: {
            party: { select: { name: true } },
            invoice: {
                select: {
                    invoiceNo: true,
                    amount: true,
                    remainingAmount: true,
                },
            },
        },
    });

    if (!existingPayment) {
        throw new CustomError(404, "Invoice payment not found");
    }

    // Prevent updating completed payments in most cases
    if (
        existingPayment.status === "COMPLETED" &&
        updateData.amount &&
        updateData.amount !== existingPayment.amount
    ) {
        throw new CustomError(400, "Cannot modify amount of completed payment");
    }

    // Convert date fields
    if (updateData.date) updateData.date = new Date(updateData.date);
    if (updateData.chequeDate)
        updateData.chequeDate = new Date(updateData.chequeDate);

    // Update payment
    const updatedPayment = await prisma.invoicePayment.update({
        where: { id },
        data: {
            ...updateData,
            updatedAt: new Date(),
        },
        include: {
            party: { select: { id: true, name: true } },
            invoice: { select: { invoiceNo: true } },
        },
    });

    // Update ledger if amount changed
    if (updateData.amount && updateData.amount !== existingPayment.amount) {
        const amountDifference =
            Number(updateData.amount) - Number(existingPayment.amount);
        await LedgerService.createAdjustmentEntry({
            partyId: existingPayment.partyId,
            amount: amountDifference,
            description: `Payment ${existingPayment.voucherId} amount adjustment`,
            reason: `Amount changed from ₹${existingPayment.amount} to ₹${updateData.amount}`,
            userId,
        });
    }

    // Calculate changes for event
    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== (existingPayment as any)[key]) {
            changes[key] = {
                oldValue: (existingPayment as any)[key],
                newValue: updateData[key],
            };
        }
    });

    // Audit log
    logger.audit(
        "UPDATE",
        "InvoicePayment",
        id,
        userId,
        existingPayment,
        updatedPayment,
        {
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        }
    );

    // Publish payment updated event
    const paymentUpdatedPublisher = new InvoicePaymentUpdatedPublisher(
        kafkaWrapper.producer
    );
    await paymentUpdatedPublisher.publish({
        id: updatedPayment.id,
        voucherId: updatedPayment.voucherId,
        updatedAt: updatedPayment.updatedAt.toISOString(),
        changes,
        updatedBy: userId,
        statusChanged: !!changes.status,
        amountChanged: !!changes.amount,
        methodChanged: !!changes.method,
        allocationChanged: false,
        bankDetailsChanged: !!(
            changes.bankName ||
            changes.chequeNo ||
            changes.chequeDate
        ),
        reason: "Manual update via payment management",
        autoUpdated: false,
    });

    logger.info("Invoice payment updated successfully", LogCategory.ACCOUNTS, {
        paymentId: id,
        voucherId: updatedPayment.voucherId,
        partyName: updatedPayment.party.name,
        userId,
        changesCount: Object.keys(changes).length,
    });

    const response = new CustomResponse(
        200,
        "Invoice payment updated successfully",
        {
            payment: updatedPayment,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ====================================================================================
 * ====================================================================================
 */

export const deleteInvoicePayment = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId || !id) {
        throw new CustomError(400, "ids required");
    }

    const payment = await prisma.invoicePayment.findFirst({
        where: { id, userId },
        include: {
            party: { select: { name: true } },
            invoice: {
                select: {
                    id: true,
                    invoiceNo: true,
                    amount: true,
                    paidAmount: true,
                    remainingAmount: true,
                    status: true,
                },
            },
        },
    });

    if (!payment) {
        throw new CustomError(404, "Invoice payment not found");
    }

    // Check if payment is reconciled or in clearing
    if (payment.status === "COMPLETED" && payment.method === "CHEQUE") {
        throw new CustomError(
            400,
            "Cannot delete reconciled or cleared payment"
        );
    }

    // Update invoice amounts if payment was applied to an invoice
    if (payment.invoice) {
        const newPaidAmount =
            Number(payment.invoice.paidAmount) - Number(payment.amount);
        const newRemainingAmount =
            Number(payment.invoice.amount) - newPaidAmount;

        let newStatus: InvoiceStatus = "PENDING";
        if (newPaidAmount > 0) {
            newStatus = "PARTIALLY_PAID";
        }

        await prisma.invoice.update({
            where: { id: payment.invoiceId! },
            data: {
                paidAmount: newPaidAmount,
                remainingAmount: newRemainingAmount,
                status: newStatus,
                updatedAt: new Date(),
            },
        });
    }

    // Delete payment
    await prisma.invoicePayment.delete({
        where: { id },
    });

    // Reverse ledger entry
    await LedgerService.createAdjustmentEntry({
        partyId: payment.partyId,
        amount: Number(payment.amount), // Positive to reverse the negative payment entry
        description: `Reversal: Payment ${payment.voucherId} deleted`,
        reason: "Payment deletion",
        userId,
    });

    // Audit log
    logger.audit("DELETE", "InvoicePayment", id, userId, payment, null, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish payment deleted event
    const paymentDeletedPublisher = new InvoicePaymentDeletedPublisher(
        kafkaWrapper.producer
    );
    await paymentDeletedPublisher.publish({
        id: payment.id,
        voucherId: payment.voucherId,
        amount: Number(payment.amount),
        method: payment.method,
        date: payment.date.toISOString(),
        partyId: payment.partyId,
        partyName: payment.party.name,
        invoiceId: payment.invoiceId || undefined,
        invoiceNumber: payment.invoice?.invoiceNo,
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
        reason: "Manual deletion",
        ledgerAdjustmentRequired: true,
        invoiceStatusReverted: !!payment.invoice,
        outstandingAmountIncreased: payment.invoice
            ? Number(payment.amount)
            : 0,
        backupData: payment,
    });

    logger.info("Invoice payment deleted successfully", LogCategory.ACCOUNTS, {
        paymentId: id,
        voucherId: payment.voucherId,
        partyName: payment.party.name,
        amount: Number(payment.amount),
        userId,
    });

    const response = new CustomResponse(
        200,
        "Invoice payment deleted successfully"
    );
    res.status(response.statusCode).json(response);
});

/**
 * ====================================================================================
 * ====================================================================================
 */

export const getPaymentSummary = asyncHandler(async (req, res) => {
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

    // Get total payments
    const totalPayments = await prisma.invoicePayment.aggregate({
        where: whereClause,
        _sum: { amount: true },
        _count: true,
    });

    // Get payment method breakdown
    const methodBreakdown = await prisma.invoicePayment.groupBy({
        by: ["method"],
        where: whereClause,
        _sum: { amount: true },
        _count: true,
    });

    // Get payment status breakdown
    const statusBreakdown = await prisma.invoicePayment.groupBy({
        by: ["status"],
        where: whereClause,
        _sum: { amount: true },
        _count: true,
    });

    const response = new CustomResponse(
        200,
        "Payment summary retrieved successfully",
        {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            summary: {
                totalAmount: totalPayments._sum.amount || 0,
                totalCount: totalPayments._count,
                averagePayment:
                    totalPayments._count > 0
                        ? Number(totalPayments._sum.amount || 0) /
                          totalPayments._count
                        : 0,
            },
            methodBreakdown,
            statusBreakdown,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ============================================================================================
 * ============================================================================================
 */

export const getPaymentAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { startDate, endDate, partyId, method } = req.query;

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const whereClause: any = {
        userId,
        date: { gte: start, lte: end },
    };

    if (partyId) whereClause.partyId = partyId;
    if (method) whereClause.method = method;

    // Get overall payment statistics
    const [paymentStats, statusBreakdown, methodBreakdown, topParties] =
        await Promise.all([
            // Payment statistics
            prisma.invoicePayment.aggregate({
                where: whereClause,
                _sum: { amount: true, charges: true },
                _count: true,
                _avg: { amount: true },
            }),

            // Status breakdown
            prisma.invoicePayment.groupBy({
                by: ["status"],
                where: whereClause,
                _sum: { amount: true },
                _count: true,
            }),

            // Payment method breakdown
            prisma.invoicePayment.groupBy({
                by: ["method"],
                where: whereClause,
                _sum: { amount: true, charges: true },
                _count: true,
            }),

            // Top parties by payment volume
            prisma.invoicePayment.groupBy({
                by: ["partyId"],
                where: whereClause,
                _sum: { amount: true },
                _count: true,
                orderBy: { _sum: { amount: "desc" } },
                take: 10,
            }),
        ]);

    // Get party details
    const partyIds = topParties.map((tp) => tp.partyId);
    const parties = await prisma.party.findMany({
        where: { id: { in: partyIds } },
        select: { id: true, name: true, category: true },
    });

    const topPartiesWithDetails = topParties.map((tp) => {
        const party = parties.find((p) => p.id === tp.partyId);
        return {
            partyId: tp.partyId,
            partyName: party?.name || "Unknown",
            category: party?.category,
            totalPayments: tp._sum.amount || 0,
            paymentCount: tp._count,
            averagePayment:
                tp._count > 0 ? Number(tp._sum.amount || 0) / tp._count : 0,
        };
    });

    // Daily payment trends
    const dailyPayments = await prisma.invoicePayment.findMany({
        where: whereClause,
        select: { date: true, amount: true },
        orderBy: { date: "asc" },
    });

    const dailyTrends: Record<
        string,
        { date: string; amount: number; count: number }
    > = {};
    dailyPayments.forEach((payment) => {
        const dateKey = payment.date.toISOString().substring(0, 10);
        if (!dailyTrends[dateKey]) {
            dailyTrends[dateKey] = { date: dateKey, amount: 0, count: 0 };
        }
        dailyTrends[dateKey].amount += Number(payment.amount);
        dailyTrends[dateKey].count += 1;
    });

    // Payment efficiency metrics
    const chequePayments = await prisma.invoicePayment.count({
        where: { ...whereClause, method: "CHEQUE" },
    });

    const digitalPayments = await prisma.invoicePayment.count({
        where: {
            ...whereClause,
            method: { in: ["UPI", "BANK_TRANSFER", "CARD", "ONLINE"] },
        },
    });

    const response = new CustomResponse(
        200,
        "Payment analytics retrieved successfully",
        {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            overview: {
                totalPayments: paymentStats._sum.amount || 0,
                totalCharges: paymentStats._sum.charges || 0,
                paymentCount: paymentStats._count,
                averagePayment: paymentStats._avg.amount || 0,
                netPayments:
                    Number(paymentStats._sum.amount || 0) -
                    Number(paymentStats._sum.charges || 0),
                digitalPaymentRate:
                    paymentStats._count > 0
                        ? (digitalPayments / paymentStats._count) * 100
                        : 0,
            },
            statusBreakdown,
            methodBreakdown: methodBreakdown.map((mb) => ({
                method: mb.method,
                amount: mb._sum.amount || 0,
                count: mb._count,
                charges: mb._sum.charges || 0,
                averageAmount:
                    mb._count > 0 ? Number(mb._sum.amount || 0) / mb._count : 0,
            })),
            topParties: topPartiesWithDetails,
            dailyTrends: Object.values(dailyTrends).sort((a, b) =>
                a.date.localeCompare(b.date)
            ),
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * =============================================================================================
 * =============================================================================================
 */

export const getCashFlowAnalysis = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { months = 12 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    // Get monthly cash flows
    const monthlyPayments = await prisma.invoicePayment.findMany({
        where: {
            userId,
            date: { gte: startDate, lte: endDate },
            status: "COMPLETED",
        },
        select: {
            date: true,
            amount: true,
            method: true,
            party: {
                select: { category: true },
            },
        },
        orderBy: { date: "asc" },
    });

    // Get monthly receipts from sales for comparison
    const monthlyReceipts = await prisma.saleReceipt.findMany({
        where: {
            userId,
            date: { gte: startDate, lte: endDate },
        },
        select: {
            date: true,
            amount: true,
            method: true,
        },
        orderBy: { date: "asc" },
    });

    // Group by month
    const monthlyData: Record<
        string,
        {
            month: string;
            paymentsOut: number;
            receiptsIn: number;
            netCashFlow: number;
            paymentCount: number;
            receiptCount: number;
            methods: Record<string, number>;
        }
    > = {};

    // Process payments (money going out)
    monthlyPayments.forEach((payment) => {
        const monthKey = payment.date.toISOString().substring(0, 7); // YYYY-MM
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                month: monthKey,
                paymentsOut: 0,
                receiptsIn: 0,
                netCashFlow: 0,
                paymentCount: 0,
                receiptCount: 0,
                methods: {},
            };
        }
        monthlyData[monthKey].paymentsOut += Number(payment.amount);
        monthlyData[monthKey].paymentCount += 1;
        monthlyData[monthKey].methods[payment.method] =
            (monthlyData[monthKey].methods[payment.method] || 0) +
            Number(payment.amount);
    });

    // Process receipts (money coming in)
    monthlyReceipts.forEach((receipt) => {
        const monthKey = receipt.date.toISOString().substring(0, 7);
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = {
                month: monthKey,
                paymentsOut: 0,
                receiptsIn: 0,
                netCashFlow: 0,
                paymentCount: 0,
                receiptCount: 0,
                methods: {},
            };
        }
        monthlyData[monthKey].receiptsIn += Number(receipt.amount);
        monthlyData[monthKey].receiptCount += 1;
    });

    // Calculate net cash flow and trends
    const sortedMonths = Object.keys(monthlyData).sort();
    const cashFlowTrends = sortedMonths.map((month, index) => {
        const data = monthlyData[month];
        data.netCashFlow = data.receiptsIn - data.paymentsOut;

        // Calculate month-over-month growth
        const previousMonth =
            index > 0 ? monthlyData[sortedMonths[index - 1]] : null;
        return {
            ...data,
            paymentsGrowth: previousMonth
                ? ((data.paymentsOut - previousMonth.paymentsOut) /
                      previousMonth.paymentsOut) *
                  100
                : 0,
            receiptsGrowth: previousMonth
                ? ((data.receiptsIn - previousMonth.receiptsIn) /
                      previousMonth.receiptsIn) *
                  100
                : 0,
        };
    });

    // Payment timing analysis
    const paymentTiming = (await prisma.$queryRaw`
        SELECT 
            EXTRACT(DOW FROM date) as day_of_week,
            COUNT(*) as payment_count,
            SUM(amount) as total_amount
        FROM "invoice_payments" 
        WHERE "userId" = ${userId} 
        AND date >= ${startDate} 
        AND date <= ${endDate}
        AND status = 'COMPLETED'
        GROUP BY EXTRACT(DOW FROM date)
        ORDER BY day_of_week
    `) as Array<{
        day_of_week: number;
        payment_count: bigint;
        total_amount: any;
    }>;

    const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];
    const timingAnalysis = paymentTiming.map((pt) => ({
        dayOfWeek: dayNames[Number(pt.day_of_week)],
        paymentCount: Number(pt.payment_count),
        totalAmount: Number(pt.total_amount),
    }));

    const response = new CustomResponse(
        200,
        "Cash flow analysis retrieved successfully",
        {
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                months: Number(months),
            },
            cashFlowTrends,
            summary: {
                totalPaymentsOut: cashFlowTrends.reduce(
                    (sum, t) => sum + t.paymentsOut!,
                    0
                ),
                totalReceiptsIn: cashFlowTrends.reduce(
                    (sum, t) => sum + t.receiptsIn!,
                    0
                ),
                netCashFlow: cashFlowTrends.reduce(
                    (sum, t) => sum + t.netCashFlow!,
                    0
                ),
                averageMonthlyPayments:
                    cashFlowTrends.length > 0
                        ? cashFlowTrends.reduce(
                              (sum, t) => sum + t.paymentsOut!,
                              0
                          ) / cashFlowTrends.length
                        : 0,
                averageMonthlyReceipts:
                    cashFlowTrends.length > 0
                        ? cashFlowTrends.reduce(
                              (sum, t) => sum + t.receiptsIn!,
                              0
                          ) / cashFlowTrends.length
                        : 0,
                bestCashFlowMonth: cashFlowTrends.reduce(
                    (best, current) =>
                        current.netCashFlow! > best.netCashFlow!
                            ? current
                            : best,
                    cashFlowTrends[0]
                ),
                worstCashFlowMonth: cashFlowTrends.reduce(
                    (worst, current) =>
                        current.netCashFlow! < worst.netCashFlow!
                            ? current
                            : worst,
                    cashFlowTrends[0]
                ),
            },
            timingAnalysis,
        }
    );
    res.status(response.statusCode).json(response);
});
