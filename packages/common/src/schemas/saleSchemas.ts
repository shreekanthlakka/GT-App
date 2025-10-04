// ========================================
// SALE SCHEMAS
// ========================================

import { z } from "zod";

import { PaginationSchema } from "./baseSchemas";

export const SaleItemSchema = z.object({
    inventoryItemId: z.string().cuid().optional(),
    itemName: z.string().min(1, "Item name is required"),
    itemType: z.string().optional(),
    design: z.string().optional(),
    color: z.string().optional(),
    price: z.number().min(0, "Price must be positive"),
    quantity: z.number().min(0.01, "Quantity must be positive"),
    total: z.number().min(0, "Total must be positive"),
    hsnCode: z.string().optional(),
    unit: z.string().default("PCS"),
});

export const CreateSaleSchema = z.object({
    saleNo: z.string().min(1, "Sale number is required"),
    date: z.string().datetime("Invalid date format"),
    amount: z.number().min(0, "Amount must be positive"),
    items: z.array(SaleItemSchema).min(1, "At least one item is required"),
    taxAmount: z.number().min(0).optional(),
    discountAmount: z.number().min(0).default(0),
    roundOffAmount: z.number().default(0),

    // Additional sale details
    salesPerson: z.string().optional(),
    deliveryDate: z.string().datetime().optional(),
    deliveryAddress: z.string().optional(),
    transportation: z.string().optional(),
    vehicleNo: z.string().optional(),
    reference: z.string().optional(),
    terms: z.string().optional(),
    notes: z.string().optional(),

    customerId: z.string().cuid("Invalid customer ID"),
});

export const UpdateSaleSchema = CreateSaleSchema.partial().omit({
    customerId: true,
});

export const SaleQuerySchema = PaginationSchema.extend({
    saleNo: z.string().optional(),
    customerId: z.string().cuid().optional(),
    status: z
        .enum([
            "PENDING",
            "PARTIALLY_PAID",
            "PAID",
            "OVERDUE",
            "CANCELLED",
            "RETURNED",
        ])
        .optional(),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    amountFrom: z.coerce.number().optional(),
    amountTo: z.coerce.number().optional(),
    salesPerson: z.string().optional(),
});

export type CreateSaleType = z.infer<typeof CreateSaleSchema>;
export type UpdateSaleType = z.infer<typeof UpdateSaleSchema>;
export type SaleQueryType = z.infer<typeof SaleQuerySchema>;
export type SaleItemType = z.infer<typeof SaleItemSchema>;
