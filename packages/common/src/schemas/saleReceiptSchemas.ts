// ========================================
// SALE RECEIPT SCHEMAS
// ========================================

import { z } from "zod";

import { PaginationSchema } from "./baseSchemas";
import { PaymentMethodSchema } from "./invoicePaymentSchemas";
import { SaleItemSchema } from "./saleSchemas";

export const CreateSaleReceiptSchema = z.object({
    receiptNo: z.string().min(1, "Receipt number is required"),
    date: z.string().datetime("Invalid date format"),
    amount: z.number().min(0.01, "Amount must be positive"),
    method: PaymentMethodSchema,
    description: z.string().optional(),
    reference: z.string().optional(),
    imageUrl: z.string().url().optional(),

    // Banking details
    bankName: z.string().optional(),
    chequeNo: z.string().optional(),
    chequeDate: z.string().datetime().optional(),
    clearanceDate: z.string().datetime().optional(),
    charges: z.number().min(0).optional(),

    customerId: z.string().cuid("Invalid customer ID"),
    saleId: z.string().cuid().optional(),
});

export const UpdateSaleReceiptSchema = CreateSaleReceiptSchema.partial().omit({
    customerId: true,
});

export const SaleReceiptQuerySchema = PaginationSchema.extend({
    customerId: z.string().cuid().optional(),
    saleId: z.string().cuid().optional(),
    method: PaymentMethodSchema.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    amountFrom: z.coerce.number().optional(),
    amountTo: z.coerce.number().optional(),
});

export const MarkChequeClearanceSchema = z.object({
    clearanceDate: z.string().datetime().optional(),
    charges: z.number().min(0).optional(),
    notes: z.string().optional(),
});

export const DeleteSaleReceiptSchema = z.object({
    reason: z.string().min(5, "Reason must be at least 5 characters"),
});

export type CreateSaleReceiptType = z.infer<typeof CreateSaleReceiptSchema>;
export type UpdateSaleReceiptType = z.infer<typeof UpdateSaleReceiptSchema>;
export type MarkChequeClearanceType = z.infer<typeof MarkChequeClearanceSchema>;
export type DeleteSaleReceiptType = z.infer<typeof DeleteSaleReceiptSchema>;
export type SaleReceiptQueryType = z.infer<typeof SaleReceiptQuerySchema>;
