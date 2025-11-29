// apps/accounts/src/controllers/invoiceController.ts
import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
    generateInvoicePaymentVoucherId,
    generateInvoiceVoucherId,
    generateVoucherId,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import {
    InvoiceCreatedPublisher,
    InvoiceUpdatedPublisher,
    InvoiceDeletedPublisher,
    InvoicePaidPublisher,
} from "../events/publishers/invoicePublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { LedgerService } from "../services/ledgerService";
import { SendEmailRequestPublisher } from "@repo/common-backend/publisher";
import { InventoryService } from "../services/inventoryService";

export const createInvoice = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return;
    const {
        invoiceNo,
        date,
        dueDate,
        amount,
        items,
        description,
        taxAmount,
        discountAmount,
        roundOffAmount,
        notes,
        poNumber,
        transportMode,
        vehicleNo,
        deliveryNote,
        supplierRef,
        otherRef,
        buyersOrderNo,
        dispatchedThrough,
        destination,
        partyId,
    } = req.body;

    logger.info("Creating invoice", LogCategory.ACCOUNTS, {
        userId,
        invoiceNo,
        partyId,
        amount,
    });

    // Verify party exists and belongs to user
    const party = await prisma.party.findFirst({
        where: { id: partyId, userId, isActive: true },
        select: { id: true, name: true, gstNo: true, email: true, phone: true },
    });

    if (!party) {
        throw new CustomError(404, "Party not found or inactive");
    }

    // Check for duplicate invoice number for this party
    const existingInvoice = await prisma.invoice.findFirst({
        where: {
            invoiceNo,
            partyId,
            userId,
        },
    });

    if (existingInvoice) {
        throw new CustomError(
            409,
            "Invoice with this number already exists for this party"
        );
    }

    const invoiceDate = new Date(date);
    const invoiceDueDate = dueDate ? new Date(dueDate) : null;
    const invoiceAmount = Number(amount);
    const remainingAmount = invoiceAmount;
    const voucherId = generateInvoiceVoucherId(party.name, date, invoiceNo);

    // Create invoice
    const invoice = await prisma.invoice.create({
        data: {
            voucherId,
            invoiceNo,
            date: invoiceDate,
            dueDate: invoiceDueDate,
            amount: invoiceAmount,
            paidAmount: 0,
            remainingAmount,
            status: "PENDING",
            items,
            description,
            taxAmount: taxAmount ? Number(taxAmount) : null,
            discountAmount: discountAmount ? Number(discountAmount) : 0,
            roundOffAmount: roundOffAmount ? Number(roundOffAmount) : 0,
            notes,
            poNumber,
            transportMode,
            vehicleNo,
            deliveryNote,
            supplierRef,
            otherRef,
            buyersOrderNo,
            dispatchedThrough,
            destination,
            partyId,
            userId,
        },
        include: {
            party: {
                select: {
                    id: true,
                    name: true,
                    gstNo: true,
                    email: true,
                    phone: true,
                },
            },
        },
    });

    // Create ledger entry
    await LedgerService.createInvoiceEntry({
        invoiceId: invoice.id,
        partyId,
        amount: invoiceAmount,
        description: `Invoice ${invoiceNo} - ${party.name}`,
        userId,
        date: invoiceDate,
    });

    // Audit log
    logger.audit("CREATE", "Invoice", invoice.id, userId, null, invoice, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish invoice created event
    const invoiceCreatedPublisher = new InvoiceCreatedPublisher(
        kafkaWrapper.producer
    );
    await invoiceCreatedPublisher.publish({
        id: invoice.id,
        voucherId: invoice.voucherId,
        invoiceNo: invoice.invoiceNo,
        date: invoice.date.toISOString(),
        dueDate: invoice.dueDate?.toISOString(),
        amount: Number(invoice.amount),
        paidAmount: Number(invoice.paidAmount),
        remainingAmount: Number(invoice.remainingAmount),
        status: invoice.status,
        description: invoice.description,
        taxAmount: invoice.taxAmount ? Number(invoice.taxAmount) : undefined,
        discountAmount: invoice.discountAmount
            ? Number(invoice.discountAmount)
            : undefined,
        roundOffAmount: invoice.roundOffAmount
            ? Number(invoice.roundOffAmount)
            : undefined,
        notes: invoice.notes,
        partyId: invoice.partyId,
        partyName: party.name,
        partyGSTNo: party.gstNo,
        poNumber: invoice.poNumber,
        transportMode: invoice.transportMode,
        vehicleNo: invoice.vehicleNo,
        deliveryNote: invoice.deliveryNote,
        supplierRef: invoice.supplierRef,
        otherRef: invoice.otherRef,
        buyersOrderNo: invoice.buyersOrderNo,
        dispatchedThrough: invoice.dispatchedThrough,
        destination: invoice.destination,
        createdBy: userId,
        createdAt: invoice.createdAt.toISOString(),
        userId,
    });

    // Send notification email if party has email
    if (party.email) {
        try {
            const emailPublisher = new SendEmailRequestPublisher(
                kafkaWrapper.producer
            );
            await emailPublisher.publish({
                eventId: `invoice_created_${invoice.id}_${Date.now()}`,
                recipientType: "PARTY",
                recipientId: party.id,
                recipient: {
                    email: party.email,
                    name: party.name,
                    phone: party.phone || undefined,
                },
                email: {
                    subject: `New Invoice ${invoice.invoiceNo} - ₹${invoice.amount}`,
                    templateName: "INVOICE_CREATED",
                    templateData: {
                        partyName: party.name,
                        invoiceNo: invoice.invoiceNo,
                        invoiceDate: invoice.date.toISOString(),
                        dueDate: invoice.dueDate?.toISOString(),
                        amount: Number(invoice.amount),
                        description: invoice.description,
                        items: invoice.items,
                    },
                },
                metadata: {
                    sourceService: "accounts",
                    sourceEntity: "invoice",
                    sourceEntityId: invoice.id,
                    priority: "MEDIUM",
                },
                userId,
                timestamp: new Date().toISOString(),
            });
        } catch (emailError) {
            logger.error(
                "Failed to send invoice notification email",
                undefined,
                LogCategory.ACCOUNTS,
                {
                    invoiceId: invoice.id,
                    partyEmail: party.email,
                    error:
                        emailError instanceof Error
                            ? emailError.message
                            : String(emailError),
                }
            );
        }
    }

    logger.info("Invoice created successfully", LogCategory.ACCOUNTS, {
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        partyName: party.name,
        amount: invoiceAmount,
        userId,
    });

    const response = new CustomResponse(201, "Invoice created successfully", {
        invoice,
    });
    res.status(response.statusCode).json(response);
});

/**
 * ============================================================================================
 *       #############################################################################
 * ============================================================================================
 */

export const getInvoices = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) return;
    const {
        page = 1,
        limit = 10,
        search,
        partyId,
        status,
        startDate,
        endDate,
        sortBy = "date",
        sortOrder = "desc",
        overdue = false,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const whereClause: any = {
        userId,
    };

    if (search) {
        whereClause.OR = [
            { invoiceNo: { contains: search as string, mode: "insensitive" } },
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
            { voucherId: { contains: search as string, mode: "insensitive" } },
        ];
    }

    if (partyId) {
        whereClause.partyId = partyId;
    }

    if (status) {
        whereClause.status = status;
    }

    if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date.gte = new Date(startDate as string);
        if (endDate) whereClause.date.lte = new Date(endDate as string);
    }

    if (overdue === "true") {
        whereClause.AND = [
            { status: { in: ["PENDING", "PARTIALLY_PAID"] } },
            { dueDate: { lt: new Date() } },
        ];
    }

    const [invoices, total] = await Promise.all([
        prisma.invoice.findMany({
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
                        gstNo: true,
                        phone: true,
                        email: true,
                    },
                },
                _count: {
                    select: {
                        invoicePayments: true,
                    },
                },
            },
        }),
        prisma.invoice.count({ where: whereClause }),
    ]);

    // Add computed fields
    const invoicesWithComputed = invoices.map((invoice: any) => ({
        ...invoice,
        isOverdue:
            invoice.dueDate &&
            invoice.dueDate < new Date() &&
            ["PENDING", "PARTIALLY_PAID"].includes(invoice.status),
        daysOverdue:
            invoice.dueDate && invoice.dueDate < new Date()
                ? Math.floor(
                      (Date.now() - invoice.dueDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                  )
                : 0,
        paymentCount: invoice._count.invoicePayments,
    }));

    const response = new CustomResponse(
        200,
        "Invoices retrieved successfully",
        {
            invoices: invoicesWithComputed,
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
 * ============================================================================================
 *       #############################################################################
 * ============================================================================================
 */

export const getInvoiceById = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId || !id) {
        throw new CustomError(400);
    }

    const invoice = await prisma.invoice.findFirst({
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
                    panNo: true,
                    phone: true,
                    email: true,
                    address: true,
                    city: true,
                    state: true,
                    pincode: true,
                    contactPerson: true,
                },
            },
            invoicePayments: {
                orderBy: { date: "desc" },
                select: {
                    id: true,
                    voucherId: true,
                    amount: true,
                    date: true,
                    method: true,
                    reference: true,
                    status: true,
                },
            },
            ledger: {
                orderBy: { createdAt: "desc" },
                take: 10,
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

    if (!invoice) {
        throw new CustomError(404, "Invoice not found");
    }

    // Add computed fields
    const invoiceWithComputed = {
        ...invoice,
        isOverdue:
            invoice.dueDate &&
            invoice.dueDate < new Date() &&
            ["PENDING", "PARTIALLY_PAID"].includes(invoice.status),
        daysOverdue:
            invoice.dueDate && invoice.dueDate < new Date()
                ? Math.floor(
                      (Date.now() - invoice.dueDate.getTime()) /
                          (1000 * 60 * 60 * 24)
                  )
                : 0,
        paymentHistory: invoice.invoicePayments,
    };

    const response = new CustomResponse(200, "Invoice retrieved successfully", {
        invoice: invoiceWithComputed,
    });
    res.status(response.statusCode).json(response);
});

/**
 * ============================================================================================
 *       #############################################################################
 * ============================================================================================
 */

export const updateInvoice = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updateData = req.body;

    if (!userId || !id) {
        throw new CustomError(400);
    }

    // Get existing invoice
    const existingInvoice = await prisma.invoice.findFirst({
        where: { id, userId },
        include: {
            party: { select: { name: true } },
        },
    });

    if (!existingInvoice) {
        throw new CustomError(404, "Invoice not found");
    }

    // Prevent updating paid invoices
    if (
        existingInvoice.status === "PAID" &&
        updateData.amount &&
        updateData.amount !== existingInvoice.amount
    ) {
        throw new CustomError(400, "Cannot modify amount of paid invoice");
    }

    // If amount is being changed, update remaining amount
    if (updateData.amount) {
        const newAmount = Number(updateData.amount);
        const amountDifference = newAmount - Number(existingInvoice.amount);
        updateData.remainingAmount =
            Number(existingInvoice.remainingAmount) + amountDifference;

        // Update status if needed
        if (updateData.remainingAmount <= 0) {
            updateData.status = "PAID";
        } else if (updateData.remainingAmount < newAmount) {
            updateData.status = "PARTIALLY_PAID";
        } else {
            updateData.status = "PENDING";
        }
    }

    // Convert date fields
    if (updateData.date) updateData.date = new Date(updateData.date);
    if (updateData.dueDate) updateData.dueDate = new Date(updateData.dueDate);

    // Update invoice
    const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
            ...updateData,
            updatedAt: new Date(),
        },
        include: {
            party: { select: { id: true, name: true } },
        },
    });

    // Update ledger if amount changed
    if (updateData.amount && updateData.amount !== existingInvoice.amount) {
        const amountDifference =
            Number(updateData.amount) - Number(existingInvoice.amount);
        await LedgerService.createAdjustmentEntry({
            partyId: existingInvoice.partyId,
            amount: amountDifference,
            description: `Invoice ${existingInvoice.invoiceNo} amount adjustment`,
            reason: `Amount changed from ₹${existingInvoice.amount} to ₹${updateData.amount}`,
            userId,
        });
    }

    // Calculate changes for event
    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== (existingInvoice as any)[key]) {
            changes[key] = {
                oldValue: (existingInvoice as any)[key],
                newValue: updateData[key],
            };
        }
    });

    // Audit log
    logger.audit(
        "UPDATE",
        "Invoice",
        id,
        userId,
        existingInvoice,
        updatedInvoice,
        {
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        }
    );

    // Publish invoice updated event
    const invoiceUpdatedPublisher = new InvoiceUpdatedPublisher(
        kafkaWrapper.producer
    );
    await invoiceUpdatedPublisher.publish({
        id: updatedInvoice.id,
        updatedAt: updatedInvoice.updatedAt.toISOString(),
        changes,
        updatedBy: userId,
        partyId: updatedInvoice.partyId,
        statusChanged: !!changes.status,
        paymentUpdated: !!(changes.amount || changes.remainingAmount),
        dueDateChanged: !!changes.dueDate,
        amountChanged: !!changes.amount,
    });

    logger.info("Invoice updated successfully", LogCategory.ACCOUNTS, {
        invoiceId: id,
        invoiceNo: updatedInvoice.invoiceNo,
        partyName: updatedInvoice.party.name,
        userId,
        changesCount: Object.keys(changes).length,
    });

    const response = new CustomResponse(200, "Invoice updated successfully", {
        invoice: updatedInvoice,
    });
    res.status(response.statusCode).json(response);
});

/**
 * ============================================================================================
 *       #############################################################################
 * ============================================================================================
 */

export const deleteInvoice = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    if (!userId || !id) {
        throw new CustomError(400);
    }

    const invoice = await prisma.invoice.findFirst({
        where: { id, userId },
        include: {
            party: { select: { name: true } },
            _count: {
                select: {
                    invoicePayments: true,
                },
            },
        },
    });

    if (!invoice) {
        throw new CustomError(404, "Invoice not found");
    }

    // Prevent deletion if payments exist
    if (invoice._count.invoicePayments > 0) {
        throw new CustomError(
            400,
            "Cannot delete invoice with existing payments. Consider cancelling instead."
        );
    }

    // Check if invoice is paid
    if (invoice.status === "PAID") {
        throw new CustomError(400, "Cannot delete paid invoice");
    }

    // Delete invoice
    await prisma.invoice.delete({
        where: { id },
    });

    // Reverse ledger entry
    await LedgerService.createAdjustmentEntry({
        partyId: invoice.partyId,
        amount: -Number(invoice.amount),
        description: `Reversal: Invoice ${invoice.invoiceNo} deleted`,
        reason: "Invoice deletion",
        userId,
    });

    // Audit log
    logger.audit("DELETE", "Invoice", id, userId, invoice, null, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish invoice deleted event
    const invoiceDeletedPublisher = new InvoiceDeletedPublisher(
        kafkaWrapper.producer
    );
    await invoiceDeletedPublisher.publish({
        id: invoice.id,
        invoiceNo: invoice.invoiceNo,
        partyId: invoice.partyId,
        partyName: invoice.party.name,
        amount: Number(invoice.amount),
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
        reason: "Manual deletion",
        hadPayments: false,
        refundRequired: false,
        complianceImpact: false,
    });

    logger.info("Invoice deleted successfully", LogCategory.ACCOUNTS, {
        invoiceId: id,
        invoiceNo: invoice.invoiceNo,
        partyName: invoice.party.name,
        userId,
    });

    const response = new CustomResponse(200, "Invoice deleted successfully");
    res.status(response.statusCode).json(response);
});

/**
 * ============================================================================================
 *       #############################################################################
 * ============================================================================================
 */

export const markInvoiceAsPaid = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || !id) {
        throw new CustomError(400, "params");
    }
    const { paymentDate, paymentReference, notes, sequenceNo } = req.body;

    const invoice = await prisma.invoice.findFirst({
        where: { id, userId },
        include: {
            party: { select: { id: true, name: true } },
        },
    });

    if (!invoice) {
        throw new CustomError(404, "Invoice not found");
    }

    if (invoice.status === "PAID") {
        throw new CustomError(400, "Invoice is already marked as paid");
    }

    // Update invoice status

    const updatedInvoice = await prisma.invoice.update({
        where: { id },
        data: {
            status: "PAID",
            paidAmount: invoice.amount,
            remainingAmount: 0,
            updatedAt: new Date(),
        },
    });

    // Create payment record

    const voucherId = generateInvoicePaymentVoucherId(
        invoice.party.name,
        paymentDate,
        sequenceNo
    );

    const payment = await prisma.invoicePayment.create({
        data: {
            voucherId,
            amount: invoice.remainingAmount,
            date: paymentDate ? new Date(paymentDate) : new Date(),
            method: "OTHER",
            reference: paymentReference || "Manual marking as paid",
            description:
                notes || `Manual payment for invoice ${invoice.invoiceNo}`,
            status: "COMPLETED",
            partyId: invoice.partyId,
            invoiceId: invoice.id,
            userId,
            sequenceNo,
        },
    });

    // Create ledger entry for payment
    await LedgerService.createPaymentMadeEntry({
        paymentId: payment.id,
        partyId: invoice.partyId,
        amount: Number(invoice.remainingAmount),
        description: `Payment for invoice ${invoice.invoiceNo}`,
        userId,
        date: payment.date,
    });

    // Publish invoice paid event
    const invoicePaidPublisher = new InvoicePaidPublisher(
        kafkaWrapper.producer
    );
    await invoicePaidPublisher.publish({
        invoiceId: invoice.id,
        invoiceNo: invoice.invoiceNo,
        partyId: invoice.partyId,
        partyName: invoice.party.name,
        amount: Number(invoice.amount),
        paymentId: payment.id,
        paymentMethod: "OTHER",
        paymentDate: payment.date.toISOString(),
        paymentReference: payment.reference,
        fullPayment: true,
        daysToPayment: Math.floor(
            (Date.now() - invoice.date.getTime()) / (1000 * 60 * 60 * 24)
        ),
        onTimePayment: !invoice.dueDate || payment.date <= invoice.dueDate,
        paidAt: payment.date.toISOString(),
        receiptGenerated: false,
        receiptNo: payment.voucherId,
    });

    logger.info("Invoice marked as paid", LogCategory.ACCOUNTS, {
        invoiceId: id,
        invoiceNo: invoice.invoiceNo,
        paymentId: payment.id,
        amount: Number(invoice.remainingAmount),
        userId,
    });

    const response = new CustomResponse(
        200,
        "Invoice marked as paid successfully",
        {
            invoice: updatedInvoice,
            payment,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ============================================================================================
 *       #############################################################################
 * ============================================================================================
 */

export const getOverdueInvoices = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { page = 1, limit = 10, partyId, minDaysOverdue = 1 } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);
    const minDate = new Date();
    minDate.setDate(minDate.getDate() - Number(minDaysOverdue));

    const whereClause: any = {
        userId,
        status: { in: ["PENDING", "PARTIALLY_PAID"] },
        dueDate: { lt: new Date() },
    };

    if (partyId) {
        whereClause.partyId = partyId;
    }

    const [overdueInvoices, total] = await Promise.all([
        prisma.invoice.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: { dueDate: "asc" },
            include: {
                party: {
                    select: {
                        id: true,
                        name: true,
                        phone: true,
                        email: true,
                    },
                },
            },
        }),
        prisma.invoice.count({ where: whereClause }),
    ]);

    // Add days overdue calculation
    const overdueWithDays = overdueInvoices.map((invoice: any) => ({
        ...invoice,
        daysOverdue: Math.floor(
            (Date.now() - invoice.dueDate!.getTime()) / (1000 * 60 * 60 * 24)
        ),
        overdueAmount: Number(invoice.remainingAmount),
    }));

    const response = new CustomResponse(
        200,
        "Overdue invoices retrieved successfully",
        {
            invoices: overdueWithDays,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
            summary: {
                totalOverdueAmount: overdueWithDays.reduce(
                    (sum: number, inv: any) => sum + inv.overdueAmount,
                    0
                ),
                averageDaysOverdue:
                    overdueWithDays.length > 0
                        ? Math.round(
                              overdueWithDays.reduce(
                                  (sum: number, inv: any) =>
                                      sum + inv.daysOverdue,
                                  0
                              ) / overdueWithDays.length
                          )
                        : 0,
            },
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ============================================================================================
 *       #############################################################################
 * ============================================================================================
 */

export const getInvoiceAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { startDate, endDate, partyId, status } = req.query;

    if (!userId) return;

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const whereClause: any = {
        userId,
        date: { gte: start, lte: end },
    };

    if (partyId) whereClause.partyId = partyId;
    if (status) whereClause.status = status;

    // Get overall invoice statistics
    const [invoiceStats, paymentStats, overdueStats, topParties] =
        await Promise.all([
            // Invoice statistics
            prisma.invoice.aggregate({
                where: whereClause,
                _sum: {
                    amount: true,
                    remainingAmount: true,
                    taxAmount: true,
                    discountAmount: true,
                },
                _count: true,
                _avg: { amount: true },
            }),

            // Related payments
            prisma.invoicePayment.aggregate({
                where: {
                    userId,
                    date: { gte: start, lte: end },
                    ...(partyId ? { partyId } : {}),
                },
                _sum: { amount: true },
                _count: true,
            }),

            // Overdue analysis
            prisma.invoice.aggregate({
                where: {
                    ...whereClause,
                    status: { in: ["PENDING", "PARTIALLY_PAID"] },
                    dueDate: { lt: new Date() },
                },
                _sum: { remainingAmount: true },
                _count: true,
            }),

            // Top parties by invoice volume
            prisma.invoice.groupBy({
                by: ["partyId"],
                where: whereClause,
                _sum: { amount: true, remainingAmount: true },
                _count: true,
                orderBy: { _sum: { amount: "desc" } },
                take: 10,
            }),
        ]);

    // Get party details
    const partyIds = topParties.map((tp: any) => tp.partyId);
    const parties = await prisma.party.findMany({
        where: { id: { in: partyIds } },
        select: { id: true, name: true, category: true, paymentTerms: true },
    });

    const topPartiesWithDetails = topParties.map((tp: any) => {
        const party = parties.find((p: any) => p.id === tp.partyId);
        return {
            partyId: tp.partyId,
            partyName: party?.name || "Unknown",
            category: party?.category,
            paymentTerms: party?.paymentTerms,
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

    // Status breakdown
    const statusBreakdown = await prisma.invoice.groupBy({
        by: ["status"],
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true, remainingAmount: true },
        _count: true,
    });

    // Aging analysis
    const now = new Date();
    const agingRanges = [
        { label: "Current", days: 0, max: 0 },
        { label: "1-30 days", days: 1, max: 30 },
        { label: "31-60 days", days: 31, max: 60 },
        { label: "61-90 days", days: 61, max: 90 },
        { label: "90+ days", days: 91, max: null },
    ];

    const agingAnalysis = await Promise.all(
        agingRanges.map(async (range) => {
            const minDate = new Date(now);
            minDate.setDate(now.getDate() - (range.max || 365));
            const maxDate = range.max
                ? new Date(
                      now.getTime() - (range.days - 1) * 24 * 60 * 60 * 1000
                  )
                : new Date(now.getTime() - range.days * 24 * 60 * 60 * 1000);

            const result = await prisma.invoice.aggregate({
                where: {
                    userId,
                    status: { in: ["PENDING", "PARTIALLY_PAID"] },
                    dueDate: range.max
                        ? { gte: minDate, lt: maxDate }
                        : { lt: maxDate },
                },
                _sum: { remainingAmount: true },
                _count: true,
            });

            return {
                range: range.label,
                amount: result._sum.remainingAmount || 0,
                count: result._count,
            };
        })
    );

    const response = new CustomResponse(
        200,
        "Invoice analytics retrieved successfully",
        {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            overview: {
                totalInvoices: invoiceStats._sum.amount || 0,
                totalPaid:
                    Number(invoiceStats._sum.amount || 0) -
                    Number(invoiceStats._sum.remainingAmount || 0),
                totalOutstanding: invoiceStats._sum.remainingAmount || 0,
                totalTax: invoiceStats._sum.taxAmount || 0,
                totalDiscount: invoiceStats._sum.discountAmount || 0,
                invoiceCount: invoiceStats._count,
                averageInvoiceValue: invoiceStats._avg.amount || 0,
                paymentRate: invoiceStats._sum.amount
                    ? (((invoiceStats._sum.amount || 0) -
                          (invoiceStats._sum.remainingAmount || 0)) /
                          invoiceStats._sum.amount) *
                      100
                    : 0,
                overdueCount: overdueStats._count,
                overdueAmount: overdueStats._sum.remainingAmount || 0,
            },
            topParties: topPartiesWithDetails,
            statusBreakdown,
            agingAnalysis,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ============================================================================================
 *       #############################################################################
 * ============================================================================================
 */

export const getPaymentTimingAnalysis = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { months = 6 } = req.query;

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    // Get invoices with their payment timing
    const invoicesWithPayments = await prisma.invoice.findMany({
        where: {
            userId,
            date: { gte: startDate, lte: endDate },
            status: "PAID",
            dueDate: { not: null },
        },
        select: {
            id: true,
            invoiceNo: true,
            amount: true,
            date: true,
            dueDate: true,
            partyId: true,
            party: {
                select: { name: true, paymentTerms: true, category: true },
            },
            invoicePayments: {
                select: { date: true, amount: true },
                orderBy: { date: "desc" },
                take: 1, // Get the final payment that completed the invoice
            },
        },
    });

    // Analyze payment timing
    const paymentAnalysis = invoicesWithPayments
        .map((invoice: (typeof invoicesWithPayments)[0]) => {
            const finalPayment = invoice.invoicePayments[0];
            if (!finalPayment || !invoice.dueDate) return null;

            const daysDifference = Math.floor(
                (finalPayment.date.getTime() - invoice.dueDate.getTime()) /
                    (1000 * 60 * 60 * 24)
            );

            return {
                invoiceId: invoice.id,
                invoiceNo: invoice.invoiceNo,
                partyId: invoice.partyId,
                partyName: invoice.party.name,
                category: invoice.party.category,
                amount: Number(invoice.amount),
                invoiceDate: invoice.date,
                dueDate: invoice.dueDate,
                paidDate: finalPayment.date,
                daysDifference,
                paymentStatus:
                    daysDifference <= 0
                        ? "On Time"
                        : daysDifference <= 7
                          ? "Slightly Late"
                          : daysDifference <= 30
                            ? "Late"
                            : "Very Late",
            };
        })
        .filter(Boolean);

    // Group by payment status
    const paymentStatusBreakdown = paymentAnalysis.reduce(
        (acc: Record<string, number>, analysis: any) => {
            if (analysis) {
                acc[analysis.paymentStatus] =
                    (acc[analysis.paymentStatus] || 0) + 1;
            }
            return acc;
        },
        {}
    );

    // Party-wise payment behavior
    const partyPaymentBehavior = paymentAnalysis.reduce(
        (
            acc: Record<
                string,
                {
                    partyName: string;
                    category: string;
                    onTimePayments: number;
                    latePayments: number;
                    totalPayments: number;
                    averageDelay: number;
                    totalAmount: number;
                }
            >,
            analysis: any
        ) => {
            if (!analysis) return acc;

            if (!acc[analysis.partyId]) {
                acc[analysis.partyId] = {
                    partyName: analysis.partyName,
                    category: analysis.category || "Unknown",
                    onTimePayments: 0,
                    latePayments: 0,
                    totalPayments: 0,
                    averageDelay: 0,
                    totalAmount: 0,
                };
            }

            const party = acc[analysis.partyId];
            party.totalPayments += 1;
            party.totalAmount += analysis.amount;
            party.averageDelay =
                (party.averageDelay * (party.totalPayments - 1) +
                    analysis.daysDifference) /
                party.totalPayments;

            if (analysis.daysDifference <= 0) {
                party.onTimePayments += 1;
            } else {
                party.latePayments += 1;
            }

            return acc;
        },
        {}
    );

    // Convert to array and sort by reliability
    const partyReliabilityRanking = Object.values(partyPaymentBehavior)
        .map((party) => ({
            ...party,
            onTimeRate: (party.onTimePayments / party.totalPayments) * 100,
            averageDelay: Math.round(party.averageDelay * 100) / 100,
        }))
        .sort((a, b) => b.onTimeRate - a.onTimeRate);

    const response = new CustomResponse(
        200,
        "Payment timing analysis retrieved successfully",
        {
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                months: Number(months),
            },
            summary: {
                totalInvoicesAnalyzed: paymentAnalysis.length,
                onTimePayments: paymentAnalysis.filter(
                    (p: any) => p && p.daysDifference <= 0
                ).length,
                latePayments: paymentAnalysis.filter(
                    (p: any) => p && p.daysDifference > 0
                ).length,
                onTimeRate:
                    paymentAnalysis.length > 0
                        ? (paymentAnalysis.filter(
                              (p: any) => p && p.daysDifference <= 0
                          ).length /
                              paymentAnalysis.length) *
                          100
                        : 0,
                averageDelay:
                    paymentAnalysis.length > 0
                        ? Math.round(
                              (paymentAnalysis.reduce(
                                  (sum: number, p: any) =>
                                      sum + (p?.daysDifference || 0),
                                  0
                              ) /
                                  paymentAnalysis.length) *
                                  100
                          ) / 100
                        : 0,
            },
            paymentStatusBreakdown,
            partyReliabilityRanking: partyReliabilityRanking.slice(0, 15),
            insights: {
                mostReliableParty: partyReliabilityRanking[0],
                leastReliableParty:
                    partyReliabilityRanking[partyReliabilityRanking.length - 1],
                categoriesWithBestPayment: Object.entries(
                    partyReliabilityRanking.reduce(
                        (
                            acc: Record<
                                string,
                                { total: number; onTimeRate: number }
                            >,
                            party
                        ) => {
                            if (!acc[party.category]) {
                                acc[party.category] = {
                                    total: 0,
                                    onTimeRate: 0,
                                };
                            }
                            acc[party.category].total += 1;
                            acc[party.category].onTimeRate += party.onTimeRate;
                            return acc;
                        },
                        {}
                    )
                )
                    .map(([category, data]) => ({
                        category,
                        averageOnTimeRate: data.onTimeRate / data.total,
                    }))
                    .sort((a, b) => b.averageOnTimeRate - a.averageOnTimeRate),
            },
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ============================================================================================
 * Process invoice items and update inventory
 * Call this after invoice creation or when invoice is marked as received
 * ============================================================================================
 */
export const processInvoiceInventory = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { items } = req.body; // Array of { inventoryItemId, quantity, unitPrice }

    if (!userId) return;

    const invoice = await prisma.invoice.findFirst({
        where: { id, userId },
    });

    if (!invoice) {
        throw new CustomError(404, "Invoice not found");
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new CustomError(400, "Invoice items are required");
    }

    // Process each item
    const processedItems = [];
    for (const item of items) {
        if (!item.inventoryItemId || !item.quantity || !item.unitPrice) {
            continue;
        }

        try {
            await InventoryService.addStockFromInvoice(
                item.inventoryItemId,
                Number(item.quantity),
                Number(item.unitPrice),
                invoice.id,
                userId
            );

            processedItems.push({
                inventoryItemId: item.inventoryItemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                status: "SUCCESS",
            });
        } catch (error) {
            logger.error(
                "Error adding stock from invoice",
                error as Error,
                LogCategory.INVENTORY,
                {
                    invoiceId: invoice.id,
                    inventoryItemId: item.inventoryItemId,
                }
            );

            processedItems.push({
                inventoryItemId: item.inventoryItemId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                status: "FAILED",
                error: (error as Error).message,
            });
        }
    }

    const response = new CustomResponse(200, "Invoice inventory processed", {
        invoiceId: invoice.id,
        processedItems,
        successCount: processedItems.filter((i) => i.status === "SUCCESS")
            .length,
        failedCount: processedItems.filter((i) => i.status === "FAILED").length,
    });
    res.status(response.statusCode).json(response);
});

export const searchInventoryForSale = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { search, limit = 10 } = req.query;

    const items = await prisma.inventoryItem.findMany({
        where: {
            userId,
            isActive: true,
            currentStock: { gt: 0 }, // Only items in stock
            OR: [
                { name: { contains: search as string, mode: "insensitive" } },
                { sku: { contains: search as string, mode: "insensitive" } },
                {
                    barcode: {
                        contains: search as string,
                        mode: "insensitive",
                    },
                },
            ],
        },
        select: {
            id: true,
            name: true,
            sku: true,
            barcode: true,
            currentStock: true,
            sellingPrice: true,
            mrp: true,
            unit: true,
            color: true,
            design: true,
            fabric: true,
            category: true,
            hsnCode: true,
            taxRate: true,
        },
        take: Number(limit),
        orderBy: { name: "asc" },
    });

    const response = new CustomResponse(200, "Inventory items retrieved", {
        items: items.map((item: any) => ({
            ...item,
            available: Number(item.currentStock),
        })),
    });
    res.status(response.statusCode).json(response);
});
