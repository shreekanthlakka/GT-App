// packages/common-backend/src/utils/business.ts
import { prisma } from "@repo/db/prisma";
import { getEndOfDay, getStartOfDay } from "./index";

/**
 * Calculate GST amount based on base amount and GST rate
 */
export const calculateGST = (
    baseAmount: number,
    gstRate: number
): {
    gstAmount: number;
    totalAmount: number;
} => {
    const gstAmount = (baseAmount * gstRate) / 100;
    const totalAmount = baseAmount + gstAmount;

    return {
        gstAmount: Math.round(gstAmount * 100) / 100,
        totalAmount: Math.round(totalAmount * 100) / 100,
    };
};

/**
 * Calculate remaining amount for invoices/sales
 */
export const calculateRemainingAmount = (
    totalAmount: number,
    paidAmount: number
): number => {
    return Math.round((totalAmount - paidAmount) * 100) / 100;
};

/**
 * Check if customer's credit limit is exceeded
 */
export const checkCreditLimit = async (
    customerId: string,
    additionalAmount: number
): Promise<{
    exceeded: boolean;
    currentOutstanding: number;
    creditLimit: number;
    availableCredit: number;
}> => {
    const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { creditLimit: true },
    });

    if (!customer) {
        throw new Error("Customer not found");
    }

    // Calculate current outstanding amount from sales
    const outstandingSales = await prisma.sale.aggregate({
        where: {
            customerId,
            status: {
                in: ["PENDING", "PARTIALLY_PAID", "OVERDUE"],
            },
        },
        _sum: {
            remainingAmount: true,
        },
    });

    // const currentOutstanding = outstandingSales._sum.remainingAmount || 0;
    // const totalWithNewAmount = currentOutstanding + additionalAmount;
    // const availableCredit = customer.creditLimit - currentOutstanding;

    // ✅ Convert Decimal to number for calculations
    const currentOutstanding = Number(
        outstandingSales._sum.remainingAmount || 0
    );
    const creditLimit = Number(customer.creditLimit);
    const totalWithNewAmount = currentOutstanding + additionalAmount;
    const availableCredit = creditLimit - currentOutstanding;

    return {
        exceeded: totalWithNewAmount > Number(customer.creditLimit),
        currentOutstanding,
        creditLimit: Number(customer.creditLimit),
        availableCredit: Math.max(0, availableCredit),
    };
};

/**
 * Update stock levels after sale/return
 */
export const updateInventoryItemStock = async (
    inventoryItemId: string,
    quantity: number,
    operation: "REDUCE" | "ADD",
    userId: string,
    reference?: string
): Promise<void> => {
    const product = await prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId },
        select: { currentStock: true, name: true },
    });

    if (!product) {
        throw new Error("Product not found");
    }

    const newStock =
        operation === "REDUCE"
            ? product.currentStock - quantity
            : product.currentStock + quantity;

    if (newStock < 0) {
        throw new Error(`Insufficient stock for ${product.name}`);
    }

    // Update product stock
    await prisma.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { currentStock: newStock },
    });

    // Create stock movement record
    await prisma.stockMovement.create({
        data: {
            inventoryItemId,
            type: operation === "REDUCE" ? "OUT" : "IN",
            quantity: operation === "REDUCE" ? -quantity : quantity,
            previousStock: product.currentStock,
            newStock,
            reason: operation === "REDUCE" ? "Sale" : "Return",
            reference,
            userId,
        },
    });
};

/**
 * Generate sequential number for vouchers
 */
export const getNextSequenceNumber = async (
    type: "SALE" | "INVOICE" | "INVOICE-PAYMENT" | "SALE-RECEIPT",
    userId: string
): Promise<number> => {
    // This is a simple implementation. In production, you might want to use Redis or a separate sequence table
    const today = new Date();
    const datePrefix = `${today.getFullYear()}-${today.getMonth() + 1}-${today.getDate()}`;

    let count = 0;

    switch (type) {
        case "SALE":
            count = await prisma.sale.count({
                where: {
                    userId,
                    createdAt: {
                        gte: getStartOfDay(),
                        lte: getEndOfDay(),
                    },
                },
            });
            break;
        case "INVOICE":
            count = await prisma.invoice.count({
                where: {
                    userId,
                    createdAt: {
                        gte: getStartOfDay(),
                        lte: getEndOfDay(),
                    },
                },
            });
            break;
        case "INVOICE-PAYMENT":
            count = await prisma.invoicePayment.count({
                where: {
                    userId,
                    createdAt: {
                        gte: getStartOfDay(),
                        lte: getEndOfDay(),
                    },
                },
            });
            break;
        case "SALE-RECEIPT":
            count = await prisma.saleReceipt.count({
                where: {
                    userId,
                    createdAt: {
                        gte: getStartOfDay(),
                        lte: getEndOfDay(),
                    },
                },
            });
            break;
    }

    return count + 1;
};
