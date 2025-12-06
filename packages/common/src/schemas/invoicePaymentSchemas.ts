// ========================================
// INVOICE PAYMENT SCHEMAS
// ========================================

import { z } from "zod";
import { DateRangeSchema, PaginationSchema } from "./baseSchemas";

export const PaymentMethodSchema = z.enum([
    "CASH",
    "BANK_TRANSFER",
    "CHEQUE",
    "UPI",
    "CARD",
    "ONLINE",
    "OTHER",
]);

export const CreateInvoicePaymentSchema = z.object({
    amount: z.number().min(0.01, "Amount must be positive"),
    date: z.string().datetime("Invalid date format"),
    method: PaymentMethodSchema.optional(),
    reference: z.string().optional(),
    description: z.string().optional(),

    // Banking details
    bankName: z.string().optional(),
    chequeNo: z.string().optional(),
    chequeDate: z.string().datetime().optional(),
    clearanceDate: z.string().datetime().optional(),
    charges: z.number().min(0).optional(),

    partyId: z.string().cuid("Invalid party ID"),
    invoiceId: z.string().cuid().optional(),
});

export const UpdateInvoicePaymentSchema =
    CreateInvoicePaymentSchema.partial().omit({ partyId: true });

export const InvoicePaymentQuerySchema = PaginationSchema.extend({
    partyId: z.string().cuid().optional(),
    invoiceId: z.string().cuid().optional(),
    method: PaymentMethodSchema.optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    amountFrom: z.coerce.number().optional(),
    amountTo: z.coerce.number().optional(),
    status: z
        .enum(["PENDING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED"])
        .optional(),
});

// ========================================
// 📊 REPORT SCHEMAS
// ========================================

export const ReportTypeSchema = z.enum([
    "DAILY_SALES",
    "MONTHLY_SALES",
    "CUSTOMER_OUTSTANDING",
    "PARTY_OUTSTANDING",
    "INVENTORY_REPORT",
    "PROFIT_LOSS",
    "GST_REPORT",
    "CASH_BOOK",
]);

export const GenerateReportSchema = z.object({
    type: ReportTypeSchema,
    ...DateRangeSchema.shape,
    format: z.enum(["PDF", "EXCEL", "JSON"]).default("PDF"),
    includeDetails: z.boolean().default(true),
    filters: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
});

export type CreateInvoicePaymentType = z.infer<
    typeof CreateInvoicePaymentSchema
>;
export type UpdateInvoicePaymentType = z.infer<
    typeof UpdateInvoicePaymentSchema
>;
export type InvoicePaymentQueryType = z.infer<typeof InvoicePaymentQuerySchema>;
export type GenerateReportType = z.infer<typeof GenerateReportSchema>;
