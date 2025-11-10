import { prisma } from "@repo/db/prisma";
import {
    asyncHandler,
    CustomError,
    CustomResponse,
} from "@repo/common-backend/utils";
import { logger, LogCategory } from "@repo/common-backend/logger";
import {
    CustomerCreatedPublisher,
    CustomerUpdatedPublisher,
    CustomerDeletedPublisher,
} from "../events/publishers/customerPublishers";
import { kafkaWrapper } from "@repo/common-backend/kafka";
import { LedgerService } from "../services/ledgerService";

export const createCustomer = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    if (!userId) {
        return;
    }
    const {
        name,
        phone,
        email,
        address,
        city,
        state,
        pincode,
        gstNumber,
        creditLimit = 0,
        dateOfBirth,
        anniversary,
        preferredContact,
        tags = [],
        notes,
    } = req.body;

    logger.info("Creating customer", LogCategory.ACCOUNTS, {
        userId,
        customerName: name,
        phone,
        email,
    });

    // Check for duplicate phone/email for this user
    const whereClause: any[] = [{ userId }];
    if (phone) {
        whereClause.push({ phone });
    }
    if (email) {
        whereClause.push({ email });
    }

    if (phone || email) {
        const existingCustomer = await prisma.customer.findFirst({
            where: {
                AND: [
                    { userId },
                    {
                        OR: whereClause.slice(1), // Exclude userId from OR clause
                    },
                ],
                isActive: true,
            },
        });

        if (existingCustomer) {
            throw new CustomError(
                409,
                "Customer with this phone/email already exists"
            );
        }
    }

    // Create customer
    const customer = await prisma.customer.create({
        data: {
            name,
            phone,
            email,
            address,
            city,
            state,
            pincode,
            gstNumber,
            creditLimit,
            dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
            anniversary: anniversary ? new Date(anniversary) : null,
            preferredContact,
            tags,
            notes,
            userId,
        },
    });

    // Create opening balance if creditLimit is provided
    if (creditLimit > 0) {
        await LedgerService.createOpeningBalance({
            customerId: customer.id,
            amount: 0, // Starting with zero balance
            creditLimit,
            userId,
            description: `Opening balance for ${customer.name}`,
        });
    }

    // Audit log
    logger.audit("CREATE", "Customer", customer.id, userId, null, customer, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish customer created event
    const customerCreatedPublisher = new CustomerCreatedPublisher(
        kafkaWrapper.producer
    );
    await customerCreatedPublisher.publish({
        id: customer.id,
        userId,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        gstNumber: customer.gstNumber,
        creditLimit: Number(customer.creditLimit),
        dateOfBirth: customer.dateOfBirth?.toISOString(),
        anniversary: customer.anniversary?.toISOString(),
        preferredContact: customer.preferredContact,
        tags: customer.tags,
        notes: customer.notes,
        createdBy: userId,
        createdAt: customer.createdAt.toISOString(),
    });

    logger.info("Customer created successfully", LogCategory.ACCOUNTS, {
        customerId: customer.id,
        customerName: customer.name,
        userId,
    });

    const response = new CustomResponse(201, "Customer created successfully", {
        customer,
    });
    res.status(response.statusCode).json(response);
});

export const getCustomers = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const {
        page = 1,
        limit = 10,
        search,
        city,
        state,
        tags,
        isActive = true,
        sortBy = "name",
        sortOrder = "asc",
        hasOutstanding = false,
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
            { phone: { contains: search as string, mode: "insensitive" } },
            { email: { contains: search as string, mode: "insensitive" } },
            { gstNumber: { contains: search as string, mode: "insensitive" } },
        ];
    }

    if (city) {
        whereClause.city = { contains: city as string, mode: "insensitive" };
    }

    if (state) {
        whereClause.state = { contains: state as string, mode: "insensitive" };
    }

    if (tags) {
        whereClause.tags = {
            hasSome: Array.isArray(tags) ? tags : [tags],
        };
    }

    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            where: whereClause,
            skip,
            take,
            orderBy: {
                [sortBy as string]: sortOrder as "asc" | "desc",
            },
            include: {
                _count: {
                    select: {
                        sales: { where: { status: { not: "CANCELLED" } } },
                        saleReceipts: true,
                    },
                },
            },
        }),
        prisma.customer.count({ where: whereClause }),
    ]);

    // Get balances for each customer
    const customersWithBalances = await Promise.all(
        customers.map(async (customer) => {
            const balance = await LedgerService.getCustomerBalance(customer.id);
            return {
                ...customer,
                balance: balance.balance,
                totalSales: balance.totalSales,
                totalPayments: balance.totalPayments,
                lastTransactionDate: balance.lastEntryDate,
                hasOutstanding: balance.balance > 0,
            };
        })
    );

    // Filter by outstanding if requested
    const filteredCustomers =
        hasOutstanding === "true"
            ? customersWithBalances.filter((c) => c.hasOutstanding)
            : customersWithBalances;

    const response = new CustomResponse(
        200,
        "Customers retrieved successfully",
        {
            customers: filteredCustomers,
            pagination: {
                total:
                    hasOutstanding === "true"
                        ? filteredCustomers.length
                        : total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(
                    (hasOutstanding === "true"
                        ? filteredCustomers.length
                        : total) / Number(limit)
                ),
            },
        }
    );
    res.status(response.statusCode).json(response);
});

export const getCustomerById = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
        where: {
            id,
            userId,
        },
        include: {
            sales: {
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    saleNo: true,
                    voucherId: true,
                    date: true,
                    amount: true,
                    remainingAmount: true,
                    status: true,
                },
            },
            saleReceipts: {
                take: 10,
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    receiptNo: true,
                    voucherId: true,
                    amount: true,
                    date: true,
                    method: true,
                },
            },
            _count: {
                select: {
                    sales: { where: { status: { not: "CANCELLED" } } },
                    saleReceipts: true,
                },
            },
        },
    });

    if (!customer) {
        throw new CustomError(404, "Customer not found");
    }

    // Get ledger balance
    const balance = await LedgerService.getCustomerBalance(customer.id);

    const response = new CustomResponse(
        200,
        "Customer retrieved successfully",
        {
            customer: {
                ...customer,
                balance: balance.balance,
                totalSales: balance.totalSales,
                totalPayments: balance.totalPayments,
                lastTransactionDate: balance.lastEntryDate,
            },
        }
    );
    res.status(response.statusCode).json(response);
});

export const updateCustomer = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const updateData = req.body;

    if (!userId || !id) return;
    // Get existing customer
    const existingCustomer = await prisma.customer.findFirst({
        where: { id, userId },
    });

    if (!existingCustomer) {
        throw new CustomError(404, "Customer not found");
    }

    // Check for duplicate phone/email if being updated
    if (updateData.phone || updateData.email) {
        const duplicateConditions: any[] = [];

        if (updateData.phone && updateData.phone !== existingCustomer.phone) {
            duplicateConditions.push({ phone: updateData.phone });
        }

        if (updateData.email && updateData.email !== existingCustomer.email) {
            duplicateConditions.push({ email: updateData.email });
        }

        if (duplicateConditions.length > 0) {
            const duplicate = await prisma.customer.findFirst({
                where: {
                    userId,
                    id: { not: id },
                    OR: duplicateConditions,
                    isActive: true,
                },
            });

            if (duplicate) {
                throw new CustomError(
                    409,
                    "Customer with this phone/email already exists"
                );
            }
        }
    }

    // Convert date strings to Date objects
    if (updateData.dateOfBirth) {
        updateData.dateOfBirth = new Date(updateData.dateOfBirth);
    }
    if (updateData.anniversary) {
        updateData.anniversary = new Date(updateData.anniversary);
    }

    // Update customer
    const updatedCustomer = await prisma.customer.update({
        where: { id },
        data: {
            ...updateData,
            updatedAt: new Date(),
        },
    });

    // Log credit limit change if changed
    if (
        updateData.creditLimit &&
        updateData.creditLimit !== existingCustomer.creditLimit
    ) {
        await LedgerService.logCreditLimitChange({
            customerId: id,
            oldLimit: Number(existingCustomer.creditLimit),
            newLimit: Number(updateData.creditLimit),
            userId,
            reason: "Manual update via customer management",
        });
    }

    // Calculate changes for event
    const changes: Record<string, { oldValue: any; newValue: any }> = {};
    Object.keys(updateData).forEach((key) => {
        if (updateData[key] !== (existingCustomer as any)[key]) {
            changes[key] = {
                oldValue: (existingCustomer as any)[key],
                newValue: updateData[key],
            };
        }
    });

    // Audit log
    logger.audit(
        "UPDATE",
        "Customer",
        id,
        userId,
        existingCustomer,
        updatedCustomer,
        {
            ipAddress: req.ip,
            userAgent: req.headers["user-agent"],
        }
    );

    // Publish customer updated event
    const customerUpdatedPublisher = new CustomerUpdatedPublisher(
        kafkaWrapper.producer
    );
    await customerUpdatedPublisher.publish({
        id: updatedCustomer.id,
        updatedAt: updatedCustomer.updatedAt.toISOString(),
        changes,
        updatedBy: userId,
        contactChanged: !!(changes.phone || changes.email || changes.address),
        creditLimitChanged: !!changes.creditLimit,
        tagsChanged: !!changes.tags,
        preferencesChanged: !!changes.preferredContact,
    });

    logger.info("Customer updated successfully", LogCategory.ACCOUNTS, {
        customerId: id,
        customerName: updatedCustomer.name,
        userId,
        changesCount: Object.keys(changes).length,
    });

    const response = new CustomResponse(200, "Customer updated successfully", {
        customer: updatedCustomer,
    });
    res.status(response.statusCode).json(response);
});

export const deleteCustomer = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId || !id) return;

    const customer = await prisma.customer.findFirst({
        where: { id, userId },
        include: {
            _count: {
                select: {
                    sales: { where: { status: { not: "CANCELLED" } } },
                    saleReceipts: true,
                },
            },
        },
    });

    if (!customer) {
        throw new CustomError(404, "Customer not found");
    }

    // Check if customer has transactions
    const hasTransactions =
        customer._count.sales > 0 || customer._count.saleReceipts > 0;

    if (hasTransactions) {
        // Soft delete - deactivate instead of hard delete
        const updatedCustomer = await prisma.customer.update({
            where: { id },
            data: {
                isActive: false,
                updatedAt: new Date(),
            },
        });

        logger.info(
            "Customer deactivated (has transactions)",
            LogCategory.ACCOUNTS,
            {
                customerId: id,
                customerName: customer.name,
                userId,
                salesCount: customer._count.sales,
                receiptsCount: customer._count.saleReceipts,
            }
        );

        const response = new CustomResponse(
            200,
            "Customer deactivated successfully (has existing transactions)",
            {
                customer: updatedCustomer,
            }
        );
        return res.status(response.statusCode).json(response);
    }

    // Hard delete if no transactions
    await prisma.customer.delete({
        where: { id },
    });

    // Audit log
    logger.audit("DELETE", "Customer", id, userId, customer, null, {
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"],
    });

    // Publish customer deleted event
    const customerDeletedPublisher = new CustomerDeletedPublisher(
        kafkaWrapper.producer
    );
    await customerDeletedPublisher.publish({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        deletedAt: new Date().toISOString(),
        deletedBy: userId,
        hasOutstandingBalance: false,
        finalBalance: 0,
        reason: "Manual deletion via customer management",
    });

    logger.info("Customer deleted successfully", LogCategory.ACCOUNTS, {
        customerId: id,
        customerName: customer.name,
        userId,
    });

    const response = new CustomResponse(200, "Customer deleted successfully");
    res.status(response.statusCode).json(response);
});

export const getCustomerLedger = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { startDate, endDate, limit = 50, offset = 0 } = req.query;

    if (!userId || !id) {
        throw new CustomError(400, "params are required");
    }

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
        where: { id, userId },
        select: { id: true, name: true },
    });

    if (!customer) {
        throw new CustomError(404, "Customer not found");
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

    const ledgerStatement = await LedgerService.getCustomerLedger(id, query);

    const response = new CustomResponse(
        200,
        "Customer ledger retrieved successfully",
        {
            customer: { id: customer.id, name: customer.name },
            ledger: ledgerStatement,
        }
    );
    res.status(response.statusCode).json(response);
});

export const getCustomerStatement = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { id } = req.params;
    const { startDate, endDate, format = "json" } = req.query;

    if (!userId || !id) {
        throw new CustomError(400, "params missing");
    }

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
        where: { id, userId },
        select: { id: true, name: true, email: true, phone: true },
    });

    if (!customer) {
        throw new CustomError(404, "Customer not found");
    }

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const ledgerStatement = await LedgerService.getCustomerLedger(id, {
        dateRange: { gte: start, lte: end },
        limit: 1000,
    });

    // Get outstanding sales
    const outstandingSales = await prisma.sale.findMany({
        where: {
            customerId: id,
            status: { in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"] },
        },
        select: {
            id: true,
            saleNo: true,
            voucherId: true,
            date: true,
            amount: true,
            remainingAmount: true,
            status: true,
        },
        orderBy: { date: "asc" },
    });

    const statement = {
        customer,
        period: {
            startDate: start.toISOString(),
            endDate: end.toISOString(),
        },
        ledger: ledgerStatement,
        outstandingSales,
        summary: {
            totalSales: ledgerStatement.totalDebit,
            totalPayments: ledgerStatement.totalCredit,
            currentBalance: ledgerStatement.closingBalance,
            overdueAmount: outstandingSales
                .filter((sale) => sale.status === "OVERDUE")
                .reduce((sum, sale) => sum + Number(sale.remainingAmount), 0),
        },
    };

    const response = new CustomResponse(
        200,
        "Customer statement generated successfully",
        {
            statement,
        }
    );
    res.status(response.statusCode).json(response);
});

export const getCustomerAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { startDate, endDate, city, tags } = req.query;

    const start = startDate
        ? new Date(startDate as string)
        : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate as string) : new Date();

    const whereClause: any = {
        userId,
        date: { gte: start, lte: end },
        status: { not: "CANCELLED" },
    };

    if (city) {
        whereClause.customer = {
            city: { contains: city as string, mode: "insensitive" },
        };
    }

    // Get overall customer statistics
    const [salesStats, receiptStats, customerStats, topCustomers] =
        await Promise.all([
            // Sales to customers
            prisma.sale.aggregate({
                where: whereClause,
                _sum: { amount: true, remainingAmount: true },
                _count: true,
                _avg: { amount: true },
            }),

            // Receipts from customers
            prisma.saleReceipt.aggregate({
                where: {
                    userId,
                    date: { gte: start, lte: end },
                },
                _sum: { amount: true },
                _count: true,
            }),

            // Customer demographics
            prisma.customer.findMany({
                where: {
                    userId,
                    isActive: true,
                    ...(city
                        ? {
                              city: {
                                  contains: city as string,
                                  mode: "insensitive",
                              },
                          }
                        : {}),
                    ...(tags
                        ? {
                              tags: {
                                  hasSome: Array.isArray(tags)
                                      ? (tags as string[])
                                      : [tags as string],
                              },
                          }
                        : {}),
                },
                select: {
                    city: true,
                    tags: true,
                    creditLimit: true,
                    createdAt: true,
                },
            }),

            // Top customers by sales
            prisma.sale.groupBy({
                by: ["customerId"],
                where: whereClause,
                _sum: { amount: true, remainingAmount: true },
                _count: true,
                orderBy: { _sum: { amount: "desc" } },
                take: 10,
            }),
        ]);

    // Get customer details
    const customerIds = topCustomers.map((tc) => tc.customerId);
    const customers = await prisma.customer.findMany({
        where: { id: { in: customerIds } },
        select: { id: true, name: true, city: true, tags: true },
    });

    const topCustomersWithDetails = topCustomers.map((tc) => {
        const customer = customers.find((c) => c.id === tc.customerId);
        return {
            customerId: tc.customerId,
            customerName: customer?.name || "Unknown",
            city: customer?.city,
            tags: customer?.tags,
            totalSales: tc._sum.amount || 0,
            outstandingAmount: tc._sum.remainingAmount || 0,
            saleCount: tc._count,
            collectionRate: tc._sum.amount
                ? ((Number(tc._sum.amount) -
                      Number(tc._sum.remainingAmount || 0)) /
                      Number(tc._sum.amount)) *
                  100
                : 0,
        };
    });

    // Geographic analysis
    const cityBreakdown = customerStats.reduce(
        (acc: Record<string, number>, customer) => {
            const city = customer.city || "Unknown";
            acc[city] = (acc[city] || 0) + 1;
            return acc;
        },
        {}
    );

    // Customer segmentation by sales volume
    const customerSegmentation = await Promise.all([
        // High value customers (>50k)
        prisma.sale.groupBy({
            by: ["customerId"],
            where: whereClause,
            having: { amount: { _sum: { gt: 50000 } } },
            _count: true,
        }),
        // Medium value customers (10k-50k)
        prisma.sale.groupBy({
            by: ["customerId"],
            where: whereClause,
            having: {
                amount: {
                    _sum: { gte: 10000, lte: 50000 },
                },
            },
            _count: true,
        }),
    ]);

    // Customer acquisition trends
    const acquisitionTrends = customerStats.reduce(
        (acc: Record<string, number>, customer) => {
            const monthKey = customer.createdAt.toISOString().substring(0, 7); // YYYY-MM
            acc[monthKey] = (acc[monthKey] || 0) + 1;
            return acc;
        },
        {}
    );

    const response = new CustomResponse(
        200,
        "Customer analytics retrieved successfully",
        {
            period: {
                startDate: start.toISOString(),
                endDate: end.toISOString(),
            },
            overview: {
                totalCustomers: customerStats.length,
                totalSales: salesStats._sum.amount || 0,
                totalReceived: receiptStats._sum.amount || 0,
                totalOutstanding: salesStats._sum.remainingAmount || 0,
                averageSaleValue: salesStats._avg.amount || 0,
                collectionRate: salesStats._sum.amount
                    ? (Number(receiptStats._sum.amount || 0) /
                          Number(salesStats._sum.amount)) *
                      100
                    : 0,
            },
            topCustomers: topCustomersWithDetails,
            demographics: {
                cityBreakdown,
                acquisitionTrends: Object.entries(acquisitionTrends)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([month, count]) => ({ month, newCustomers: count })),
            },
            segmentation: {
                highValue: customerSegmentation[0]?.length || 0,
                mediumValue: customerSegmentation[1]?.length || 0,
                lowValue: Math.max(
                    0,
                    customerStats.length -
                        (customerSegmentation[0]?.length || 0) -
                        (customerSegmentation[1]?.length || 0)
                ),
            },
        }
    );
    res.status(response.statusCode).json(response);
});

export const getCustomerLifetimeValue = asyncHandler(async (req, res) => {
    const userId = req.user?.userId;
    const { customerId, months = 12 } = req.query;

    if (!customerId) {
        throw new CustomError(400, "Customer ID is required");
    }

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
        where: { id: customerId as string, userId },
        select: { id: true, name: true, createdAt: true },
    });

    if (!customer) {
        throw new CustomError(404, "Customer not found");
    }

    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - Number(months));

    // Get customer's sales and payment history
    const [salesHistory, receiptHistory] = await Promise.all([
        prisma.sale.findMany({
            where: {
                customerId: customerId as string,
                date: { gte: startDate, lte: endDate },
                status: { not: "CANCELLED" },
            },
            select: {
                date: true,
                amount: true,
                remainingAmount: true,
                items: true,
            },
            orderBy: { date: "asc" },
        }),

        prisma.saleReceipt.findMany({
            where: {
                customerId: customerId as string,
                date: { gte: startDate, lte: endDate },
            },
            select: {
                date: true,
                amount: true,
                method: true,
            },
            orderBy: { date: "asc" },
        }),
    ]);

    // Calculate lifetime metrics
    const totalSales = salesHistory.reduce(
        (sum, sale) => sum + Number(sale.amount),
        0
    );
    const totalReceipts = receiptHistory.reduce(
        (sum, receipt) => sum + Number(receipt.amount),
        0
    );
    const totalOutstanding = salesHistory.reduce(
        (sum, sale) => sum + Number(sale.remainingAmount),
        0
    );

    // Calculate customer behavior patterns
    const purchaseFrequency = salesHistory.length / Number(months);
    const averageOrderValue =
        salesHistory.length > 0 ? totalSales / salesHistory.length : 0;
    const paymentFrequency = receiptHistory.length / Number(months);

    // Monthly trends
    const monthlyData: Record<
        string,
        { sales: number; receipts: number; orders: number }
    > = {};

    salesHistory.forEach((sale) => {
        const monthKey = sale.date.toISOString().substring(0, 7);
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { sales: 0, receipts: 0, orders: 0 };
        }
        monthlyData[monthKey].sales += Number(sale.amount);
        monthlyData[monthKey].orders += 1;
    });

    receiptHistory.forEach((receipt) => {
        const monthKey = receipt.date.toISOString().substring(0, 7);
        if (!monthlyData[monthKey]) {
            monthlyData[monthKey] = { sales: 0, receipts: 0, orders: 0 };
        }
        monthlyData[monthKey].receipts += Number(receipt.amount);
    });

    const monthlyTrends = Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
            month,
            sales: data.sales,
            receipts: data.receipts,
            orders: data.orders,
            averageOrderValue: data.orders > 0 ? data.sales / data.orders : 0,
        }));

    // Calculate customer lifetime value (CLV) prediction
    const averageMonthlyValue =
        monthlyTrends.length > 0
            ? monthlyTrends.reduce((sum, month) => sum + month.sales, 0) /
              monthlyTrends.length
            : 0;

    const customerLifespan = Math.max(
        1,
        (new Date().getTime() - customer.createdAt.getTime()) /
            (1000 * 60 * 60 * 24 * 30.44)
    ); // months
    const predictedCLV = averageMonthlyValue * 36; // Predict 3 years

    const response = new CustomResponse(
        200,
        "Customer lifetime value retrieved successfully",
        {
            customer: {
                id: customer.id,
                name: customer.name,
                customerSince: customer.createdAt.toISOString(),
                lifespanMonths: Math.round(customerLifespan * 100) / 100,
            },
            period: {
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
                months: Number(months),
            },
            lifetimeMetrics: {
                totalSales: totalSales,
                totalReceipts: totalReceipts,
                totalOutstanding: totalOutstanding,
                netLifetimeValue: totalReceipts,
                collectionRate:
                    totalSales > 0 ? (totalReceipts / totalSales) * 100 : 0,
            },
            behaviorPatterns: {
                purchaseFrequency: Math.round(purchaseFrequency * 100) / 100, // purchases per month
                averageOrderValue: Math.round(averageOrderValue * 100) / 100,
                paymentFrequency: Math.round(paymentFrequency * 100) / 100, // payments per month
                totalTransactions: salesHistory.length + receiptHistory.length,
            },
            predictions: {
                predictedLifetimeValue: Math.round(predictedCLV * 100) / 100,
                averageMonthlyValue:
                    Math.round(averageMonthlyValue * 100) / 100,
                customerSegment:
                    averageMonthlyValue > 10000
                        ? "High Value"
                        : averageMonthlyValue > 2000
                          ? "Medium Value"
                          : "Low Value",
            },
            monthlyTrends,
        }
    );
    res.status(response.statusCode).json(response);
});
