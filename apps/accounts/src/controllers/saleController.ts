// apps/accounts/src/controllers/saleController.ts
import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
    generateSaleVoucherId,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import {
    SaleCreatedPublisher,
    SaleUpdatedPublisher,
    SaleCancelledPublisher,
    SalePaidPublisher,
    SaleOverduePublisher,
} from "../events/publishers/salePublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { LedgerService } from "../services/ledgerService";
import { generateVoucherId } from "@repo/common-backend/utils";
import { InventoryService } from "../services/inventoryService";

export const createSale = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return;
    }

    const {
        customerId,
        saleNo,
        date,
        items, // JSON array of sale items
        taxAmount = 0,
        discountAmount = 0,
        roundOffAmount = 0,
        salesPerson,
        deliveryDate,
        deliveryAddress,
        transportation,
        vehicleNo,
        reference,
        terms,
        notes,
    } = req.body;

    // check availability

    const stockCheck = await InventoryService.checkStockAvailability(
        items,
        userId
    );

    logger.info("Creating sale", LogCategory.ACCOUNTS, {
        userId,
        customerId,
        saleNo,
        itemsCount: items?.length || 0,
    });

    // Validate customer exists and belongs to user
    const customer = await prisma.customer.findFirst({
        where: { id: customerId, userId, isActive: true },
        select: { id: true, name: true, creditLimit: true },
    });

    if (!customer) {
        throw new CustomError(404, "Customer not found or inactive");
    }

    // Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
        throw new CustomError(400, "Sale items are required");
    }

    // Calculate total amount from items
    let calculatedAmount = 0;
    const validatedItems = items.map((item: any, index: number) => {
        if (!item.itemName || !item.price || !item.quantity) {
            throw new CustomError(
                400,
                `Item ${index + 1}: itemName, price, and quantity are required`
            );
        }

        const itemTotal = Number(item.price) * Number(item.quantity);
        calculatedAmount += itemTotal;

        return {
            itemName: item.itemName,
            itemType: item.itemType || "FABRIC",
            design: item.design,
            color: item.color,
            price: Number(item.price),
            quantity: Number(item.quantity),
            unit: item.unit || "MTR",
            total: itemTotal,
            hsnCode: item.hsnCode,
            taxRate: item.taxRate || 0,
            discount: item.discount || 0,
        };
    });

    // Apply discounts and taxes
    const subtotal = calculatedAmount;
    const finalAmount =
        subtotal +
        Number(taxAmount) -
        Number(discountAmount) +
        Number(roundOffAmount);
    const remainingAmount = finalAmount; // Initially full amount is pending

    // Check if sale exceeds customer's credit limit
    const currentBalance = await LedgerService.getCustomerBalance(customerId);
    const newBalance = currentBalance.balance + finalAmount;

    if (
        newBalance > Number(customer.creditLimit) &&
        Number(customer.creditLimit) > 0
    ) {
        logger.warn(
            "Sale would exceed customer credit limit",
            LogCategory.ACCOUNTS,
            {
                customerId,
                customerName: customer.name,
                currentBalance: currentBalance.balance,
                saleAmount: finalAmount,
                newBalance,
                creditLimit: Number(customer.creditLimit),
            }
        );

        // You might want to allow this with a warning, or block it completely
        // For now, we'll allow but log the warning
    }

    // Check for duplicate sale number for this customer
    const existingSale = await prisma.sale.findFirst({
        where: {
            saleNo,
            customerId,
            userId,
        },
    });

    if (existingSale) {
        throw new CustomError(
            409,
            "Sale number already exists for this customer"
        );
    }

    // Generate voucher ID
    const saleDate = date ? new Date(date) : new Date();
    const voucherId = generateSaleVoucherId(customer.name, saleDate, saleNo);

    // Create sale transaction
    const sale = await prisma.$transaction(async (tx) => {
        // Create sale record
        const newSale = await tx.sale.create({
            data: {
                voucherId,
                saleNo,
                date: saleDate,
                amount: finalAmount,
                paidAmount: 0,
                remainingAmount: finalAmount,
                status: "PENDING",
                items: validatedItems,
                taxAmount: Number(taxAmount),
                discountAmount: Number(discountAmount),
                roundOffAmount: Number(roundOffAmount),
                salesPerson,
                deliveryDate: deliveryDate ? new Date(deliveryDate) : null,
                deliveryAddress,
                transportation,
                vehicleNo,
                reference,
                terms,
                notes,
                customerId,
                userId,
            },
            include: {
                customer: {
                    select: { name: true, phone: true, email: true },
                },
            },
        });

        // Create ledger entry - Customer owes us money (Debit)
        await LedgerService.createSaleEntry({
            saleId: newSale.id,
            customerId,
            amount: finalAmount,
            description: `Sale ${saleNo} - ${customer.name}`,
            userId,
            date: saleDate,
        });

        return newSale;
    });

    // Audit log
    logger.audit("CREATE", "Sale", sale.id, userId, null, sale, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish sale created event
    const saleCreatedPublisher = new SaleCreatedPublisher(
        kafkaWrapper.producer
    );
    await saleCreatedPublisher.publish({
        id: sale.id,
        voucherId: sale.voucherId,
        saleNo: sale.saleNo,
        customerId: sale.customerId,
        customerName: sale.customer.name,
        customerPhone: sale.customer.phone,
        customerEmail: sale.customer.email,
        date: sale.date.toISOString(),
        amount: Number(sale.amount),
        paidAmount: Number(sale.paidAmount),
        remainingAmount: Number(sale.remainingAmount),
        status: sale.status,
        items: validatedItems,
        taxAmount: Number(sale.taxAmount),
        discountAmount: Number(sale.discountAmount),
        salesPerson: sale.salesPerson,
        deliveryDate: sale.deliveryDate?.toISOString(),
        userId,
        createdBy: userId,
        createdAt: sale.createdAt.toISOString(),
        creditLimitExceeded: newBalance > Number(customer.creditLimit),
        businessMetrics: {
            itemCount: validatedItems.length,
            averageItemValue: subtotal / validatedItems.length,
            paymentStatus: "PENDING",
        },
    });

    logger.info("Sale created successfully", LogCategory.ACCOUNTS, {
        saleId: sale.id,
        saleNo: sale.saleNo,
        customerId,
        amount: finalAmount,
        userId,
    });

    const response = new CustomResponse(201, "Sale created successfully", {
        sale,
    });
    res.status(response.statusCode).json(response);
});

export const getSales = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const {
        page = 1,
        limit = 10,
        search,
        customerId,
        status,
        startDate,
        endDate,
        sortBy = "date",
        sortOrder = "desc",
        minAmount,
        maxAmount,
        salesPerson,
    } = req.query;

    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    // Build where clause
    const whereClause: any = {
        userId,
    };

    if (search) {
        whereClause.OR = [
            { saleNo: { contains: search as string, mode: "insensitive" } },
            { voucherId: { contains: search as string, mode: "insensitive" } },
            { reference: { contains: search as string, mode: "insensitive" } },
            {
                customer: {
                    name: { contains: search as string, mode: "insensitive" },
                },
            },
        ];
    }

    if (customerId) {
        whereClause.customerId = customerId;
    }

    if (status) {
        whereClause.status = status;
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

    if (salesPerson) {
        whereClause.salesPerson = {
            contains: salesPerson as string,
            mode: "insensitive",
        };
    }

    const [sales, total] = await Promise.all([
        prisma.sale.findMany({
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
                _count: {
                    select: {
                        saleReceipts: true,
                    },
                },
            },
        }),
        prisma.sale.count({ where: whereClause }),
    ]);

    // Calculate summary statistics
    const summary = await prisma.sale.aggregate({
        where: whereClause,
        _sum: {
            amount: true,
            paidAmount: true,
            remainingAmount: true,
        },
        _count: true,
    });

    const response = new CustomResponse(200, "Sales retrieved successfully", {
        sales,
        pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            pages: Math.ceil(total / Number(limit)),
        },
        summary: {
            totalSales: Number(summary._sum.amount) || 0,
            totalPaid: Number(summary._sum.paidAmount) || 0,
            totalOutstanding: Number(summary._sum.remainingAmount) || 0,
            count: summary._count,
            averageSaleValue:
                summary._count > 0
                    ? Number(summary._sum.amount) / summary._count
                    : 0,
        },
    });
    res.status(response.statusCode).json(response);
});

/**
 * ===============================================================================================
 *      ##################################################################################
 *      ##################################################################################
 * ================================================================================================
 */

export const getSaleById = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const sale = await prisma.sale.findFirst({
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
                    gstNumber: true,
                },
            },
            saleReceipts: {
                orderBy: { date: "desc" },
                select: {
                    id: true,
                    receiptNo: true,
                    voucherId: true,
                    amount: true,
                    date: true,
                    method: true,
                    reference: true,
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
                    type: true,
                },
            },
        },
    });

    if (!sale) {
        throw new CustomError(404, "Sale not found");
    }

    const response = new CustomResponse(200, "Sale retrieved successfully", {
        sale,
    });
    res.status(response.statusCode).json(response);
});

/**
 * ===============================================================================================
 *      ##################################################################################
 *      ##################################################################################
 * ================================================================================================
 */

export const updateSale = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updateData = req.body;

    if (!userId) return;

    // Get existing sale
    const existingSale = await prisma.sale.findFirst({
        where: { id, userId },
        include: { customer: { select: { name: true } } },
    });

    if (!existingSale) {
        throw new CustomError(404, "Sale not found");
    }

    // Don't allow updates to paid or cancelled sales without specific reason
    if (existingSale.status === "PAID") {
        throw new CustomError(400, "Cannot update a fully paid sale");
    }

    if (existingSale.status === "CANCELLED") {
        throw new CustomError(400, "Cannot update a cancelled sale");
    }

    // Handle amount changes - requires ledger adjustment
    let needsLedgerAdjustment = false;
    let amountDifference = 0;

    if (
        updateData.amount &&
        Number(updateData.amount) !== Number(existingSale.amount)
    ) {
        needsLedgerAdjustment = true;
        amountDifference =
            Number(updateData.amount) - Number(existingSale.amount);

        // Update remaining amount proportionally
        const paymentRatio =
            Number(existingSale.paidAmount) / Number(existingSale.amount);
        updateData.remainingAmount =
            Number(updateData.amount) -
            Number(updateData.amount) * paymentRatio;
    }

    // Convert date if provided
    if (updateData.date) {
        updateData.date = new Date(updateData.date);
    }
    if (updateData.deliveryDate) {
        updateData.deliveryDate = new Date(updateData.deliveryDate);
    }

    // Update sale in transaction
    const updatedSale = await prisma.$transaction(async (tx) => {
        // Update sale record
        const updated = await tx.sale.update({
            where: { id },
            data: {
                ...updateData,
                updatedAt: new Date(),
            },
            include: {
                customer: {
                    select: { name: true, phone: true, email: true },
                },
            },
        });

        // Create ledger adjustment if amount changed
        if (needsLedgerAdjustment) {
            await LedgerService.createAdjustmentEntry({
                customerId: existingSale.customerId,
                amount: amountDifference,
                description: `Sale ${existingSale.saleNo} amount adjustment`,
                reason: `Updated from ${existingSale.amount} to ${updateData.amount}`,
                userId,
            });
        }

        return updated;
    });

    // Calculate changes for event
    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== (existingSale as any)[key]) {
            changes[key] = {
                oldValue: (existingSale as any)[key],
                newValue: updateData[key],
            };
        }
    });

    // Audit log
    logger.audit("UPDATE", "Sale", id, userId, existingSale, updatedSale, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish sale updated event
    const saleUpdatedPublisher = new SaleUpdatedPublisher(
        kafkaWrapper.producer
    );
    await saleUpdatedPublisher.publish({
        id: updatedSale.id,
        voucherId: updatedSale.voucherId,
        saleNo: updatedSale.saleNo,
        updatedAt: updatedSale.updatedAt.toISOString(),
        changes,
        updatedBy: userId,
        amountChanged: needsLedgerAdjustment,
        amountDifference,
        statusChanged: changes.status ? true : false,
        customerName: updatedSale.customer.name,
        currentAmount: Number(updatedSale.amount),
        currentStatus: updatedSale.status,
    });

    logger.info("Sale updated successfully", LogCategory.ACCOUNTS, {
        saleId: id,
        saleNo: updatedSale.saleNo,
        userId,
        changesCount: Object.keys(changes).length,
        amountChanged: needsLedgerAdjustment,
    });

    const response = new CustomResponse(200, "Sale updated successfully", {
        sale: updatedSale,
    });
    res.status(response.statusCode).json(response);
});

/**
 * ===============================================================================================
 *      ##################################################################################
 *      ##################################################################################
 * ================================================================================================
 */

export const cancelSale = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!userId) return;

    const sale = await prisma.sale.findFirst({
        where: { id, userId },
        include: { customer: { select: { name: true } } },
    });

    if (!sale) {
        throw new CustomError(404, "Sale not found");
    }

    if (sale.status === "CANCELLED") {
        throw new CustomError(400, "Sale is already cancelled");
    }

    if (Number(sale.paidAmount) > 0) {
        throw new CustomError(
            400,
            "Cannot cancel sale with payments. Please process refunds first."
        );
    }

    // Cancel sale in transaction
    const cancelledSale = await prisma.$transaction(async (tx) => {
        // Update sale status
        const updated = await tx.sale.update({
            where: { id },
            data: {
                status: "CANCELLED",
                notes: sale.notes
                    ? `${sale.notes}\n\nCANCELLED: ${reason}`
                    : `CANCELLED: ${reason}`,
                updatedAt: new Date(),
            },
            include: {
                customer: {
                    select: { name: true, phone: true, email: true },
                },
            },
        });

        // Reverse the ledger entry
        await LedgerService.createAdjustmentEntry({
            customerId: sale.customerId,
            amount: -Number(sale.amount), // Negative to reverse the debit
            description: `Sale ${sale.saleNo} cancellation`,
            reason: reason || "Sale cancelled",
            userId,
        });

        return updated;
    });

    // Audit log
    logger.audit("UPDATE", "Sale", id, userId, sale, cancelledSale, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
        action: "CANCEL",
        reason,
    });

    // Publish sale cancelled event
    const saleCancelledPublisher = new SaleCancelledPublisher(
        kafkaWrapper.producer
    );
    await saleCancelledPublisher.publish({
        id: cancelledSale.id,
        voucherId: cancelledSale.voucherId,
        saleNo: cancelledSale.saleNo,
        customerId: cancelledSale.customerId,
        customerName: cancelledSale.customer.name,
        amount: Number(cancelledSale.amount),
        cancelledAt: cancelledSale.updatedAt.toISOString(),
        cancelledBy: userId,
        reason: reason || "No reason provided",
        hadPayments: Number(sale.paidAmount) > 0,
        refundRequired: Number(sale.paidAmount),
    });

    logger.info("Sale cancelled successfully", LogCategory.ACCOUNTS, {
        saleId: id,
        saleNo: sale.saleNo,
        amount: Number(sale.amount),
        reason,
        userId,
    });

    const response = new CustomResponse(200, "Sale cancelled successfully", {
        sale: cancelledSale,
    });
    res.status(response.statusCode).json(response);
});

/**
 * ===============================================================================================
 *      ##################################################################################
 *      ##################################################################################
 * ================================================================================================
 */

export const getSaleAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { startDate, endDate, customerId, salesPerson } = req.query;

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const whereClause: any = {
        userId,
        date: { gte: start, lte: end },
        status: { not: "CANCELLED" },
    };

    if (customerId) {
        whereClause.customerId = customerId;
    }

    if (salesPerson) {
        whereClause.salesPerson = {
            contains: salesPerson as string,
            mode: "insensitive",
        };
    }

    const [salesStats, topCustomers, topItems, dailyTrends] = await Promise.all(
        [
            // Overall sales statistics
            prisma.sale.aggregate({
                where: whereClause,
                _sum: { amount: true, paidAmount: true, remainingAmount: true },
                _count: true,
                _avg: { amount: true },
            }),

            // Top customers by sales value
            prisma.sale.groupBy({
                by: ["customerId"],
                where: whereClause,
                _sum: { amount: true, remainingAmount: true },
                _count: true,
                orderBy: { _sum: { amount: "desc" } },
                take: 10,
            }),

            // Top selling items analysis
            prisma.sale.findMany({
                where: whereClause,
                select: { items: true, amount: true },
            }),

            // Daily sales trends
            prisma.sale.groupBy({
                by: ["date"],
                where: whereClause,
                _sum: { amount: true },
                _count: true,
                orderBy: { date: "asc" },
            }),
        ]
    );

    // Get customer details for top customers
    const customerIds = topCustomers.map((tc) => tc.customerId);
    const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, city: true },
    });

    const topCustomersWithDetails = topCustomers.map((tc) => {
        const customer = customers.find((c) => c.id === tc.customerId);
        return {
            customerId: tc.customerId,
            customerName: customer?.name || "Unknown",
            city: customer?.city,
            totalSales: tc._sum.amount || 0,
            outstandingAmount: tc._sum.remainingAmount || 0,
            saleCount: tc._count,
            collectionRate: tc._sum.amount
                ? ((tc._sum.amount - (tc._sum.remainingAmount || 0)) /
                      tc._sum.amount) *
                  100
                : 0,
        };
    });

    // Analyze top selling items from JSON data
    const itemAnalysis: Record<
        string,
        { count: number; totalValue: number; totalQuantity: number }
    > = {};

    topItems.forEach((sale) => {
        if (sale.items && Array.isArray(sale.items)) {
            (sale.items as any[]).forEach((item) => {
                const key = `${item.itemName}_${item.color || ""}_${item.design || ""}`;
                if (!itemAnalysis[key]) {
                    itemAnalysis[key] = {
                        count: 0,
                        totalValue: 0,
                        totalQuantity: 0,
                    };
                }
                itemAnalysis[key].count += 1;
                itemAnalysis[key].totalValue += Number(item.total || 0);
                itemAnalysis[key].totalQuantity += Number(item.quantity || 0);
            });
        }
    });

    const topSellingItems = Object.entries(itemAnalysis)
        .sort(([, a], [, b]) => b.totalValue - a.totalValue)
        .slice(0, 10)
        .map(([itemKey, data]) => {
            const [itemName, color, design] = itemKey.split("_");
            return {
                itemName,
                color: color || null,
                design: design || null,
                salesCount: data.count,
                totalValue: data.totalValue,
                totalQuantity: data.totalQuantity,
                averagePrice:
                    data.totalQuantity > 0
                        ? data.totalValue / data.totalQuantity
                        : 0,
            };
        });

    const response = new CustomResponse(
        200,
        "Sales analytics retrieved successfully",
        {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            overview: {
                totalSales: Number(salesStats._sum.amount) || 0,
                totalPaid: Number(salesStats._sum.paidAmount) || 0,
                totalOutstanding: Number(salesStats._sum.remainingAmount) || 0,
                saleCount: salesStats._count,
                averageSaleValue: Number(salesStats._avg.amount) || 0,
                collectionRate: salesStats._sum.amount
                    ? ((Number(salesStats._sum.paidAmount) || 0) /
                          Number(salesStats._sum.amount)) *
                      100
                    : 0,
            },
            topCustomers: topCustomersWithDetails,
            topSellingItems,
            dailyTrends: dailyTrends.map((trend) => ({
                date: trend.date.toISOString().split("T")[0],
                sales: trend._sum.amount || 0,
                count: trend._count,
                averageValue:
                    trend._count > 0
                        ? (trend._sum.amount || 0) / trend._count
                        : 0,
            })),
        }
    );
    res.status(response.statusCode).json(response);
});

/**
 * ===============================================================================================
 *      ##################################################################################
 *      ##################################################################################
 * ================================================================================================
 */

export const getOverdueSales = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { days = 30, sortBy = "date", sortOrder = "asc" } = req.query;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - Number(days));

    const overdueSales = await prisma.sale.findMany({
        where: {
            userId,
            status: { in: ["PENDING", "PARTIALLY_PAID"] },
            date: { lt: cutoffDate },
            remainingAmount: { gt: 0 },
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
        },
        orderBy: {
            [sortBy as string]: sortOrder as "asc" | "desc",
        },
    });

    // Calculate aging buckets
    const agingBuckets = {
        days_1_30: { count: 0, amount: 0 },
        days_31_60: { count: 0, amount: 0 },
        days_61_90: { count: 0, amount: 0 },
        days_90_plus: { count: 0, amount: 0 },
    };

    const now = new Date();
    overdueSales.forEach((sale) => {
        const daysOverdue = Math.floor(
            (now.getTime() - sale.date.getTime()) / (1000 * 60 * 60 * 24)
        );
        const amount = Number(sale.remainingAmount);

        if (daysOverdue <= 30) {
            agingBuckets.days_1_30.count++;
            agingBuckets.days_1_30.amount += amount;
        } else if (daysOverdue <= 60) {
            agingBuckets.days_31_60.count++;
            agingBuckets.days_31_60.amount += amount;
        } else if (daysOverdue <= 90) {
            agingBuckets.days_61_90.count++;
            agingBuckets.days_61_90.amount += amount;
        } else {
            agingBuckets.days_90_plus.count++;
            agingBuckets.days_90_plus.amount += amount;
        }
    });

    const totalOverdue = overdueSales.reduce(
        (sum, sale) => sum + Number(sale.remainingAmount),
        0
    );

    const response = new CustomResponse(
        200,
        "Overdue sales retrieved successfully",
        {
            overdueSales: overdueSales.map((sale) => ({
                ...sale,
                daysOverdue: Math.floor(
                    (now.getTime() - sale.date.getTime()) /
                        (1000 * 60 * 60 * 24)
                ),
            })),
            summary: {
                totalCount: overdueSales.length,
                totalAmount: totalOverdue,
                agingBuckets,
            },
        }
    );
    res.status(response.statusCode).json(response);
});
