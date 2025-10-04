// ========================================
// INVOICE SCHEMAS
// ========================================

import { z } from "zod";
import { PaginationSchema } from "./baseSchemas";

export const InvoiceItemSchema = z.object({
    description: z.string().min(1, "Description is required"),
    quantity: z.number().min(0.01, "Quantity must be positive"),
    rate: z.number().min(0, "Rate must be positive"),
    amount: z.number().min(0, "Amount must be positive"),
    hsnCode: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),
});

export const CreateInvoiceSchema = z.object({
    invoiceNo: z.string().min(1, "Invoice number is required"),
    date: z.string().datetime("Invalid date format"),
    dueDate: z.string().datetime().optional(),
    amount: z.number().min(0, "Amount must be positive"),
    items: z.array(InvoiceItemSchema).optional(),
    description: z.string().optional(),
    taxAmount: z.number().min(0).optional(),
    discountAmount: z.number().min(0).default(0),
    roundOffAmount: z.number().default(0),
    notes: z.string().optional(),

    // Additional invoice fields
    poNumber: z.string().optional(),
    transportMode: z.string().optional(),
    vehicleNo: z.string().optional(),
    deliveryNote: z.string().optional(),
    supplierRef: z.string().optional(),
    otherRef: z.string().optional(),
    buyersOrderNo: z.string().optional(),
    dispatchedThrough: z.string().optional(),
    destination: z.string().optional(),

    partyId: z.string().cuid("Invalid party ID"),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial().omit({
    partyId: true,
});

export const InvoiceQuerySchema = PaginationSchema.extend({
    invoiceNo: z.string().optional(),
    partyId: z.string().cuid().optional(),
    status: z
        .enum(["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"])
        .optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    dueDateFrom: z.string().datetime().optional(),
    dueDateTo: z.string().datetime().optional(),
    amountFrom: z.coerce.number().optional(),
    amountTo: z.coerce.number().optional(),
});

export type CreateInvoiceType = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoiceType = z.infer<typeof UpdateInvoiceSchema>;
export type InvoiceQueryType = z.infer<typeof InvoiceQuerySchema>;
