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
    const totalWithNewAmount = currentOutstanding + additionalAmount; // Works!
    const availableCredit = creditLimit - currentOutstanding; // Works!

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
export const updateProductStock = async (
    productId: string,
    quantity: number,
    operation: "REDUCE" | "ADD",
    userId: string,
    reference?: string
): Promise<void> => {
    const product = await prisma.product.findUnique({
        where: { id: productId },
        select: { stock: true, name: true },
    });

    if (!product) {
        throw new Error("Product not found");
    }

    const newStock =
        operation === "REDUCE"
            ? product.stock - quantity
            : product.stock + quantity;

    if (newStock < 0) {
        throw new Error(`Insufficient stock for ${product.name}`);
    }

    // Update product stock
    await prisma.product.update({
        where: { id: productId },
        data: { stock: newStock },
    });

    // Create stock movement record
    await prisma.stockMovement.create({
        data: {
            productId,
            type: operation === "REDUCE" ? "OUT" : "IN",
            quantity: operation === "REDUCE" ? -quantity : quantity,
            previousStock: product.stock,
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
    type: "SALE" | "INVOICE" | "PAYMENT" | "RECEIPT",
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
        case "PAYMENT":
            count = await prisma.payment.count({
                where: {
                    userId,
                    createdAt: {
                        gte: getStartOfDay(),
                        lte: getEndOfDay(),
                    },
                },
            });
            break;
        case "RECEIPT":
            count = await prisma.receipt.count({
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
