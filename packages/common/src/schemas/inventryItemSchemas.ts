// ========================================
// INVENTORY ITEM SCHEMAS
// ========================================
import { z } from "zod";
import { PaginationSchema } from "./baseSchemas";

export const CreateInventoryItemSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    description: z.string().optional(),
    sku: z.string().optional(),
    barcode: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    subCategory: z.string().optional(),
    brand: z.string().optional(),
    sellingPrice: z.number().min(0, "Selling price must be positive"),
    costPrice: z.number().min(0).optional(),
    mrp: z.number().min(0).optional(),
    currentStock: z.number().min(0).default(0),
    minimumStock: z.number().min(0).default(0),
    maximumStock: z.number().min(0).optional(),
    reorderLevel: z.number().min(0).optional(),
    unit: z.string().default("PCS"),

    // Textile specific fields
    fabric: z.string().optional(),
    gsm: z.number().min(0).optional(),
    width: z.number().min(0).optional(),
    color: z.string().optional(),
    design: z.string().optional(),
    pattern: z.string().optional(),
    weaveType: z.string().optional(),

    // Product details
    images: z.array(z.string().url()).default([]),
    attributes: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .default({}),

    // Tax and compliance
    hsnCode: z.string().optional(),
    taxRate: z.number().min(0).max(100).optional(),

    // Storage and supplier info
    location: z.string().optional(),
    supplier: z.string().optional(),
    leadTime: z.number().min(0).optional(),
    lastPurchaseDate: z.string().datetime().optional(),
    lastPurchasePrice: z.number().min(0).optional(),
});

export const UpdateInventoryItemSchema = CreateInventoryItemSchema.partial();

export const InventoryItemQuerySchema = PaginationSchema.extend({
    name: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    fabric: z.string().optional(),
    color: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    lowStock: z.coerce.boolean().optional(),
    outOfStock: z.coerce.boolean().optional(),
});

export const StockMovementSchema = z.object({
    inventoryItemId: z.string().cuid("Invalid inventory item ID"),
    type: z.enum([
        "IN",
        "OUT",
        "ADJUSTMENT",
        "TRANSFER",
        "RETURN",
        "DAMAGE",
        "SAMPLE",
        "WASTAGE",
    ]),
    quantity: z.number().int().min(1, "Quantity must be at least 1"),
    reason: z.string().optional(),
    reference: z.string().optional(),
    batchNumber: z.string().optional(),
    unitPrice: z.number().min(0).optional(),
    totalValue: z.number().min(0).optional(),
    notes: z.string().optional(),
});

export type CreateInventoryItemType = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItemType = z.infer<typeof UpdateInventoryItemSchema>;
export type InventoryItemQueryType = z.infer<typeof InventoryItemQuerySchema>;
export type StockMovementType = z.infer<typeof StockMovementSchema>;
