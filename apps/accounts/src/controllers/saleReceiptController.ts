// apps/accounts/src/controllers/saleReceiptController.ts
import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
    generateSaleReceiptVoucherId,
    generateVoucherId,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import {
    SaleReceiptCreatedPublisher,
    SaleReceiptUpdatedPublisher,
    SaleReceiptDeletedPublisher,
} from "../events/publishers/saleReceiptPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { LedgerService } from "../services/ledgerService";
import { SendEmailRequestPublisher } from "@repo/common-backend/publisher";
import { Prisma } from "@repo/db";

export const createSaleReceipt = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return;
    }

    const {
        customerId,
        saleId, // Optional - can allocate to specific sale
        receiptNo,
        date,
        amount,
        method,
        description,
        reference,
        imageUrl,
        // Banking details for cheque/bank transfer
        bankName,
        chequeNo,
        chequeDate,
        clearanceDate,
        charges = 0,
    } = req.body;

    logger.info("Creating sale receipt", LogCategory.ACCOUNTS, {
        userId,
        customerId,
        saleId,
        amount,
        method,
    });

    // Validate customer exists and belongs to user
    const customer = await prisma.customer.findFirst({
        where: { id: customerId, userId, isActive: true },
        select: { id: true, name: true },
    });

    if (!customer) {
        throw new CustomError(404, "Customer not found or inactive");
    }

    // Validate sale if provided
    let sale = null;
    if (saleId) {
        sale = await prisma.sale.findFirst({
            where: {
                id: saleId,
                customerId,
                userId,
                status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
            },
        });

        if (!sale) {
            throw new CustomError(
                404,
                "Sale not found or cannot accept payments"
            );
        }

        // Check if payment amount doesn't exceed remaining amount
        if (Number(amount) > Number(sale.remainingAmount)) {
            throw new CustomError(
                400,
                `Payment amount (${amount}) cannot exceed remaining amount (${sale.remainingAmount})`
            );
        }
    }

    // Validate required fields
    if (!receiptNo || !amount || amount <= 0) {
        throw new CustomError(
            400,
            "Receipt number and positive amount are required"
        );
    }

    // Check for duplicate receipt number
    const existingReceipt = await prisma.saleReceipt.findFirst({
        where: {
            receiptNo,
            customerId,
            userId,
        },
    });

    if (existingReceipt) {
        throw new CustomError(
            409,
            "Receipt number already exists for this customer"
        );
    }

    // Generate voucher ID
    // const voucherId = generateVoucherId("RCP");
    const voucherId = generateSaleReceiptVoucherId(customer.name);
    const receiptDate = date ? new Date(date) : new Date();

    // Create receipt transaction
    const receipt = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            // Create receipt record
            const newReceipt = await tx.saleReceipt.create({
                data: {
                    voucherId,
                    receiptNo,
                    date: receiptDate,
                    amount: Number(amount),
                    method,
                    description: description || `Payment from ${customer.name}`,
                    reference,
                    imageUrl,
                    bankName,
                    chequeNo,
                    chequeDate: chequeDate ? new Date(chequeDate) : null,
                    clearanceDate: clearanceDate
                        ? new Date(clearanceDate)
                        : null,
                    charges: Number(charges),
                    customerId,
                    saleId,
                    userId,
                },
                include: {
                    customer: {
                        select: { name: true, phone: true, email: true },
                    },
                    sale: {
                        select: {
                            saleNo: true,
                            voucherId: true,
                            amount: true,
                            remainingAmount: true,
                        },
                    },
                },
            });

            // Update sale if allocated
            if (saleId && sale) {
                const newPaidAmount = Number(sale.paidAmount) + Number(amount);
                const newRemainingAmount = Number(sale.amount) - newPaidAmount;

                // Determine new status
                let newStatus = sale.status;
                if (newRemainingAmount <= 0) {
                    newStatus = "PAID";
                } else if (newPaidAmount > 0) {
                    newStatus = "PARTIALLY_PAID";
                }

                await tx.sale.update({
                    where: { id: saleId },
                    data: {
                        paidAmount: newPaidAmount,
                        remainingAmount: Math.max(0, newRemainingAmount),
                        status: newStatus,
                        updatedAt: new Date(),
                    },
                });
            }

            // Create ledger entry - Customer pays us (Credit)
            await LedgerService.createPaymentReceivedEntry({
                paymentId: newReceipt.id,
                customerId,
                amount: Number(amount),
                description: `Receipt ${receiptNo} - ${customer.name}${saleId ? ` (Sale: ${sale?.saleNo})` : ""}`,
                userId,
                date: receiptDate,
            });

            return newReceipt;
        }
    );

    // Audit log
    logger.audit("CREATE", "SaleReceipt", receipt.id, userId, null, receipt, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish receipt created event
    const receiptCreatedPublisher = new SaleReceiptCreatedPublisher(
        kafkaWrapper.producer
    );
    await receiptCreatedPublisher.publish({
        id: receipt.id,
        voucherId: receipt.voucherId,
        receiptNo: receipt.receiptNo,
        customerId: receipt.customerId,
        customerName: receipt.customer.name,
        customerPhone: receipt.customer.phone,
        customerEmail: receipt.customer.email,
        saleId: receipt.saleId,
        saleNo: receipt.sale?.saleNo,
        date: receipt.date.toISOString(),
        amount: Number(receipt.amount),
        method: receipt.method,
        reference: receipt.reference,
        bankName: receipt.bankName,
        chequeNo: receipt.chequeNo,
        userId,
        createdBy: userId,
        createdAt: receipt.createdAt.toISOString(),
        paymentType: saleId ? "SALE_PAYMENT" : "ADVANCE_PAYMENT",
        businessMetrics: {
            collectionEfficiency: sale
                ? ((Number(sale.paidAmount) + Number(amount)) /
                      Number(sale.amount)) *
                  100
                : 100,
            paymentMethod: receipt.method,
            hasImageProof: !!receipt.imageUrl,
        },
    });

    logger.info("Sale receipt created successfully", LogCategory.ACCOUNTS, {
        receiptId: receipt.id,
        receiptNo: receipt.receiptNo,
        customerId,
        saleId,
        amount: Number(amount),
        method: receipt.method,
        userId,
    });

    const response = new CustomResponse(
        201,
        "Sale receipt created successfully",
        {
            receipt,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 *                  ##############################################
 *                  ##############################################
 * ==========================================================================================
 */

export const getSaleReceipts = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const {
        page = 1,
        limit = 10,
        search,
        customerId,
        saleId,
        method,
        startDate,
        endDate,
        sortBy = "date",
        sortOrder = "desc",
        minAmount,
        maxAmount,
        cleared,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const whereClause: any = {
        userId,
    };

    if (search) {
        whereClause.OR = [
            { receiptNo: { contains: search as string, mode: "insensitive" } },
            { voucherId: { contains: search as string, mode: "insensitive" } },
            { reference: { contains: search as string, mode: "insensitive" } },
            {
                customer: {
                    name: { contains: search as string, mode: "insensitive" },
                },
            },
            { chequeNo: { contains: search as string, mode: "insensitive" } },
        ];
    }

    if (customerId) {
        whereClause.customerId = customerId;
    }

    if (saleId) {
        whereClause.saleId = saleId;
    }

    if (method) {
        whereClause.method = method;
    }

    if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) whereClause.date.gte = new Date(startDate as string);
        if (endDate) whereClause.date.lte = new Date(endDate as string);
    }

    if (minAmount || maxAmount) {
        whereClause.amount = {};
        if (minAmount) whereClause.amount.gte = Number(minAmount);
        if (maxAmount) whereClause.amount.lte = Number(maxAmount);
    }

    // Filter by clearance status for cheques
    if (cleared !== undefined) {
        if (cleared === "true") {
            whereClause.clearanceDate = { not: null };
        } else if (cleared === "false") {
            whereClause.AND = [{ method: "CHEQUE" }, { clearanceDate: null }];
        }
    }

    const [receipts, total] = await Promise.all([
        prisma.saleReceipt.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: {
                [sortBy as string]: sortOrder as "asc" | "desc",
            },
            include: {
                customer: {
                    select: {
                        name: true,
                        phone: true,
                        email: true,
                        city: true,
                    },
                },
                sale: {
                    select: {
                        saleNo: true,
                        voucherId: true,
                        amount: true,
                        status: true,
                    },
                },
            },
        }),
        prisma.saleReceipt.count({ where: whereClause }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.saleReceipt.aggregate({
        where: whereClause,
        _sum: {
            amount: true,
            charges: true,
        },
        _count: true,
    });

    // Payment method breakdown
    const methodBreakdown = await prisma.saleReceipt.groupBy({
        by: ["method"],
        where: whereClause,
        _sum: { amount: true },
        _count: true,
    });

    const response = new CustomResponse(
        200,
        "Sale receipts retrieved successfully",
        {
            receipts,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit)),
            },
            summary: {
                totalAmount: Number(summary._sum.amount) || 0,
                totalCharges: Number(summary._sum.charges) || 0,
                count: summary._count,
                averageReceiptValue:
                    summary._count > 0
                        ? Number(summary._sum.amount) / summary._count
                        : 0,
            },
            methodBreakdown: methodBreakdown.map((mb: any) => ({
                method: mb.method,
                amount: mb._sum.amount || 0,
                count: mb._count,
            })),
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 *                  ##############################################
 *                  ##############################################
 * ==========================================================================================
 */

export const getSaleReceiptById = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const receipt = await prisma.saleReceipt.findFirst({
        where: {
            id,
            userId,
        },
        include: {
            customer: {
                select: {
                    name: true,
                    phone: true,
                    email: true,
                    address: true,
                    city: true,
                    state: true,
                    pincode: true,
                },
            },
            sale: {
                select: {
                    saleNo: true,
                    voucherId: true,
                    date: true,
                    amount: true,
                    paidAmount: true,
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
                    type: true,
                },
            },
        },
    });

    if (!receipt) {
        throw new CustomError(404, "Sale receipt not found");
    }

    const response = new CustomResponse(
        200,
        "Sale receipt retrieved successfully",
        {
            receipt,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 *                  ##############################################
 *                  ##############################################
 * ==========================================================================================
 */

export const updateSaleReceipt = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updateData = req.body;

    if (!userId) return;
    if (!id) return;

    // Get existing receipt
    const existingReceipt = await prisma.saleReceipt.findFirst({
        where: { id, userId },
        include: {
            customer: { select: { name: true } },
            sale: {
                select: {
                    saleNo: true,
                    paidAmount: true,
                    amount: true,
                    remainingAmount: true,
                },
            },
        },
    });

    if (!existingReceipt) {
        throw new CustomError(404, "Sale receipt not found");
    }

    // Handle amount changes - requires sale and ledger adjustment
    let needsAdjustment = false;
    let amountDifference = 0;

    if (
        updateData.amount &&
        Number(updateData.amount) !== Number(existingReceipt.amount)
    ) {
        needsAdjustment = true;
        amountDifference =
            Number(updateData.amount) - Number(existingReceipt.amount);

        // Check if new amount is valid for allocated sale
        if (existingReceipt.saleId && existingReceipt.sale) {
            const currentSalePaidWithoutThisReceipt =
                Number(existingReceipt.sale.paidAmount) -
                Number(existingReceipt.amount);
            const newSalePaidAmount =
                currentSalePaidWithoutThisReceipt + Number(updateData.amount);

            if (newSalePaidAmount > Number(existingReceipt.sale.amount)) {
                throw new CustomError(
                    400,
                    `Updated amount would exceed sale total. Max allowed: ${Number(existingReceipt.sale.amount) - currentSalePaidWithoutThisReceipt}`
                );
            }
        }
    }

    // Convert dates if provided
    if (updateData.date) {
        updateData.date = new Date(updateData.date);
    }
    if (updateData.chequeDate) {
        updateData.chequeDate = new Date(updateData.chequeDate);
    }
    if (updateData.clearanceDate) {
        updateData.clearanceDate = new Date(updateData.clearanceDate);
    }

    // Update receipt in transaction
    const updatedReceipt = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
            // Update receipt record
            const updated = await tx.saleReceipt.update({
                where: { id },
                data: {
                    ...updateData,
                    updatedAt: new Date(),
                },
                include: {
                    customer: {
                        select: { name: true, phone: true, email: true },
                    },
                    sale: {
                        select: {
                            saleNo: true,
                            amount: true,
                            paidAmount: true,
                        },
                    },
                },
            });

            // Update sale if amount changed and receipt is allocated
            if (needsAdjustment && existingReceipt.saleId) {
                const newPaidAmount =
                    Number(existingReceipt.sale!.paidAmount) + amountDifference;
                const newRemainingAmount =
                    Number(existingReceipt.sale!.amount) - newPaidAmount;

                // Determine new status
                let newStatus = "PENDING";
                if (newRemainingAmount <= 0) {
                    newStatus = "PAID";
                } else if (newPaidAmount > 0) {
                    newStatus = "PARTIALLY_PAID";
                }

                await tx.sale.update({
                    where: { id: existingReceipt.saleId },
                    data: {
                        paidAmount: newPaidAmount,
                        remainingAmount: Math.max(0, newRemainingAmount),
                        status: newStatus as any,
                        updatedAt: new Date(),
                    },
                });
            }

            // Create ledger adjustment if amount changed
            if (needsAdjustment) {
                await LedgerService.createAdjustmentEntry({
                    customerId: existingReceipt.customerId,
                    amount: -amountDifference, // Negative because this is a credit adjustment
                    description: `Receipt ${existingReceipt.receiptNo} amount adjustment`,
                    reason: `Updated from ${existingReceipt.amount} to ${updateData.amount}`,
                    userId,
                });
            }

            return updated;
        }
    );

    // Calculate changes for event
    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== (existingReceipt as any)[key]) {
            changes[key] = {
                oldValue: (existingReceipt as any)[key],
                newValue: updateData[key],
            };
        }
    });

    // Audit log
    logger.audit(
        "UPDATE",
        "SaleReceipt",
        id,
        userId,
        existingReceipt,
        updatedReceipt,
        {
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        }
    );

    // Publish receipt updated event
    const receiptUpdatedPublisher = new SaleReceiptUpdatedPublisher(
        kafkaWrapper.producer
    );
    await receiptUpdatedPublisher.publish({
        id: updatedReceipt.id,
        voucherId: updatedReceipt.voucherId,
        receiptNo: updatedReceipt.receiptNo,
        updatedAt: updatedReceipt.updatedAt.toISOString(),
        changes,
        updatedBy: userId,
        amountChanged: needsAdjustment,
        amountDifference,
        customerName: updatedReceipt.customer.name,
        currentAmount: Number(updatedReceipt.amount),
        saleNo: updatedReceipt.sale?.saleNo,
        clearanceStatusChanged: changes.clearanceDate ? true : false,
    });

    logger.info("Sale receipt updated successfully", LogCategory.ACCOUNTS, {
        receiptId: id,
        receiptNo: updatedReceipt.receiptNo,
        userId,
        changesCount: Object.keys(changes).length,
        amountChanged: needsAdjustment,
    });

    const response = new CustomResponse(
        200,
        "Sale receipt updated successfully",
        {
            receipt: updatedReceipt,
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 *                  ##############################################
 *                  ##############################################
 * ==========================================================================================
 */

export const deleteSaleReceipt = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!userId) return;
    if (!id) return;

    const receipt = await prisma.saleReceipt.findFirst({
        where: { id, userId },
        include: {
            customer: { select: { name: true } },
            sale: {
                select: {
                    saleNo: true,
                    amount: true,
                    paidAmount: true,
                    remainingAmount: true,
                },
            },
        },
    });

    if (!receipt) {
        throw new CustomError(404, "Sale receipt not found");
    }

    // Check if receipt can be deleted (business rules)
    if (receipt.clearanceDate && receipt.method === "CHEQUE") {
        throw new CustomError(400, "Cannot delete a cleared cheque receipt");
    }

    // Delete receipt in transaction
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Update sale if receipt was allocated
        if (receipt.saleId) {
            const newPaidAmount =
                Number(receipt.sale!.paidAmount) - Number(receipt.amount);
            const newRemainingAmount =
                Number(receipt.sale!.amount) - newPaidAmount;

            // Determine new status
            let newStatus = "PENDING";
            if (newRemainingAmount <= 0) {
                newStatus = "PAID";
            } else if (newPaidAmount > 0) {
                newStatus = "PARTIALLY_PAID";
            }

            await tx.sale.update({
                where: { id: receipt.saleId },
                data: {
                    paidAmount: newPaidAmount,
                    remainingAmount: Math.max(0, newRemainingAmount),
                    status: newStatus as any,
                    updatedAt: new Date(),
                },
            });
        }

        // Reverse ledger entry
        await LedgerService.createAdjustmentEntry({
            customerId: receipt.customerId,
            amount: Number(receipt.amount), // Positive to reverse the credit
            description: `Receipt ${receipt.receiptNo} deletion`,
            reason: reason || "Receipt deleted",
            userId,
        });

        // Delete the receipt
        await tx.saleReceipt.delete({
            where: { id },
        });
    });

    // Audit log
    logger.audit("DELETE", "SaleReceipt", id, userId, receipt, null, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        reason,
    });

    // Publish receipt deleted event
    const receiptDeletedPublisher = new SaleReceiptDeletedPublisher(
        kafkaWrapper.producer
    );
    await receiptDeletedPublisher.publish({
        id: receipt.id,
        voucherId: receipt.voucherId,
        receiptNo: receipt.receiptNo,
        customerId: receipt.customerId,
        customerName: receipt.customer.name,
        saleId: receipt.saleId || undefined,
        saleNo: receipt.sale?.saleNo,
        amount: Number(receipt.amount),
        method: receipt.method,
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
        reason: reason || "No reason provided",
        wasCleared: !!receipt.clearanceDate,
    });

    logger.info("Sale receipt deleted successfully", LogCategory.ACCOUNTS, {
        receiptId: id,
        receiptNo: receipt.receiptNo,
        amount: Number(receipt.amount),
        reason,
        userId,
    });

    const response = new CustomResponse(
        200,
        "Sale receipt deleted successfully"
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 *                  ##############################################
 *                  ##############################################
 * ==========================================================================================
 */

export const markChequeClearance = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { clearanceDate, charges = 0, notes } = req.body;

    if (!userId) return;

    const receipt = await prisma.saleReceipt.findFirst({
        where: { id, userId, method: "CHEQUE" },
        include: { customer: { select: { name: true } } },
    });

    if (!receipt) {
        throw new CustomError(404, "Cheque receipt not found");
    }

    if (receipt.clearanceDate) {
        throw new CustomError(400, "Cheque is already marked as cleared");
    }

    const updatedReceipt = await prisma.saleReceipt.update({
        where: { id },
        data: {
            clearanceDate: clearanceDate ? new Date(clearanceDate) : new Date(),
            charges: Number(charges),
            description:
                receipt.description +
                (notes ? `\nClearance notes: ${notes}` : ""),
            updatedAt: new Date(),
        },
        include: {
            customer: { select: { name: true } },
            sale: { select: { saleNo: true } },
        },
    });

    // Create ledger entry for bank charges if any
    if (Number(charges) > 0) {
        await LedgerService.createAdjustmentEntry({
            customerId: receipt.customerId,
            amount: Number(charges), // Debit for charges
            description: `Bank charges for cheque ${receipt.chequeNo}`,
            reason: "Cheque clearance charges",
            userId,
        });
    }

    logger.info("Cheque clearance marked", LogCategory.ACCOUNTS, {
        receiptId: id,
        receiptNo: receipt.receiptNo,
        chequeNo: receipt.chequeNo,
        charges: Number(charges),
        userId,
    });

    const response = new CustomResponse(
        200,
        "Cheque clearance marked successfully",
        {
            receipt: updatedReceipt,
        }
    );
    res.status(response.statusCode).json(response);
});

export const getSaleReceiptAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { startDate, endDate, method, customerId } = req.query;

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const whereClause: any = {
        userId,
        date: { gte: start, lte: end },
    };

    if (method) {
        whereClause.method = method;
    }

    if (customerId) {
        whereClause.customerId = customerId;
    }

    const [receiptsStats, methodBreakdown, dailyTrends, pendingCheques] =
        await Promise.all([
            // Overall statistics
            prisma.saleReceipt.aggregate({
                where: whereClause,
                _sum: { amount: true, charges: true },
                _count: true,
                _avg: { amount: true },
            }),

            // Payment method breakdown
            prisma.saleReceipt.groupBy({
                by: ["method"],
                where: whereClause,
                _sum: { amount: true },
                _count: true,
                orderBy: { _sum: { amount: "desc" } },
            }),

            // Daily collection trends
            prisma.saleReceipt.groupBy({
                by: ["date"],
                where: whereClause,
                _sum: { amount: true },
                _count: true,
                orderBy: { date: "asc" },
            }),

            // Pending cheque clearances
            prisma.saleReceipt.findMany({
                where: {
                    userId,
                    method: "CHEQUE",
                    clearanceDate: null,
                    date: { gte: start, lte: end },
                },
                include: {
                    customer: { select: { name: true } },
                },
                orderBy: { date: "asc" },
            }),
        ]);

    // Calculate collection efficiency
    const totalSalesInPeriod = await prisma.sale.aggregate({
        where: {
            userId,
            date: { gte: start, lte: end },
            status: { not: "CANCELLED" },
        },
        _sum: { amount: true },
    });

    const collectionEfficiency = totalSalesInPeriod._sum.amount
        ? ((Number(receiptsStats._sum.amount) || 0) /
              Number(totalSalesInPeriod._sum.amount)) *
          100
        : 0;

    const response = new CustomResponse(
        200,
        "Sale receipt analytics retrieved successfully",
        {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            overview: {
                totalCollected: Number(receiptsStats._sum.amount) || 0,
                totalCharges: Number(receiptsStats._sum.charges) || 0,
                receiptCount: receiptsStats._count,
                averageReceiptValue: Number(receiptsStats._avg.amount) || 0,
                collectionEfficiency:
                    Math.round(collectionEfficiency * 100) / 100,
            },
            methodBreakdown: methodBreakdown.map(
                (mb: (typeof methodBreakdown)[0]) => ({
                    method: mb.method,
                    amount: mb._sum.amount || 0,
                    count: mb._count,
                    percentage: receiptsStats._sum.amount
                        ? (Number(mb._sum.amount || 0) /
                              Number(receiptsStats._sum.amount)) *
                          100
                        : 0,
                })
            ),
            dailyTrends: dailyTrends.map((trend: (typeof dailyTrends)[0]) => ({
                date: trend.date.toISOString().split("T")[0],
                amount: trend._sum.amount || 0,
                count: trend._count,
            })),
            pendingCheques: {
                count: pendingCheques.length,
                totalAmount: pendingCheques.reduce(
                    (sum: number, cheque: (typeof pendingCheques)[0]) =>
                        sum + Number(cheque.amount),
                    0
                ),
                details: pendingCheques.map(
                    (cheque: (typeof pendingCheques)[0]) => ({
                        id: cheque.id,
                        receiptNo: cheque.receiptNo,
                        customerName: cheque.customer.name,
                        amount: Number(cheque.amount),
                        chequeNo: cheque.chequeNo,
                        chequeDate: cheque.chequeDate,
                        daysOutstanding: Math.floor(
                            (new Date().getTime() - cheque.date.getTime()) /
                                (1000 * 60 * 60 * 24)
                        ),
                    })
                ),
            },
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ==========================================================================================
 *                  ##############################################
 *                  ##############################################
 * ==========================================================================================
 */

export const getReceiptSummary = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { startDate, endDate, customerId } = req.query;

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const whereClause: any = {
        userId,
        date: { gte: start, lte: end },
    };

    if (customerId) {
        whereClause.customerId = customerId;
    }

    const summary = await prisma.saleReceipt.aggregate({
        where: whereClause,
        _sum: { amount: true, charges: true },
        _count: true,
    });

    const methodBreakdown = await prisma.saleReceipt.groupBy({
        by: ["method"],
        where: whereClause,
        _sum: { amount: true },
        _count: true,
    });

    const response = new CustomResponse(200, "Receipt summary retrieved", {
        period: { startDate: start, endDate: end },
        totalAmount: summary._sum.amount || 0,
        totalCharges: summary._sum.charges || 0,
        receiptCount: summary._count,
        methodBreakdown,
    });
    res.status(response.statusCode).json(response);
});
