// package/common/src/schemas/index.ts

export * from "./authSchemas";
export * from "./customerSchemas";
export * from "./partySchemas";
export * from "./inventryItemSchemas";
export * from "./saleSchemas";
export * from "./invoiceSchemas";
export * from "./invoicePaymentSchemas";
export * from "./ocrSchemas";
export * from "./notificationSchemas";
export * from "./templateSchemas";
export * from "./dashboardSchemas";
export * from "./saleReceiptSchemas";

export { LoginSchema } from "./authSchemas";

// Common validation schemas
import { z } from "zod";
import {
    CreateCustomerSchema,
    CustomerQuerySchema,
    UpdateCustomerSchema,
} from "./customerSchemas";
import {
    ChangePasswordSchema,
    LoginSchema,
    RegisterSchema,
    UpdateProfileSchema,
} from "./authSchemas";
import {
    CreatePartySchema,
    PartyQuerySchema,
    UpdatePartySchema,
} from "./partySchemas";
import {
    CreateInvoiceSchema,
    InvoiceQuerySchema,
    UpdateInvoiceSchema,
} from "./invoiceSchemas";
import {
    CreateSaleSchema,
    SaleQuerySchema,
    UpdateSaleSchema,
} from "./saleSchemas";
import {
    CreateInvoicePaymentSchema,
    GenerateReportSchema,
    InvoicePaymentQuerySchema,
    UpdateInvoicePaymentSchema,
} from "./invoicePaymentSchemas";

import {
    CreateInventoryItemSchema,
    InventoryItemQuerySchema,
    StockMovementSchema,
    UpdateInventoryItemSchema,
} from "./inventryItemSchemas";

import {
    CreateNotificationSchema,
    CreateReminderSchema,
} from "./notificationSchemas";
import { CreateOCRJobSchema } from "./ocrSchemas";

export const PaginationSchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const DateRangeSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
});

export const IdParamSchema = z.object({
    id: z.string().cuid("Invalid ID format"),
});

// ========================================
// 🏪 SHOP OPERATIONS SCHEMAS
// ========================================

export const ShopTimingSchema = z.object({
    openTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    closeTime: z
        .string()
        .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format"),
    isHoliday: z.boolean().default(false),
    date: z.string().datetime(),
});

export const CashCountSchema = z.object({
    denomination: z.object({
        notes: z.object({
            "2000": z.number().min(0).default(0),
            "500": z.number().min(0).default(0),
            "200": z.number().min(0).default(0),
            "100": z.number().min(0).default(0),
            "50": z.number().min(0).default(0),
            "20": z.number().min(0).default(0),
            "10": z.number().min(0).default(0),
        }),
        coins: z.object({
            "10": z.number().min(0).default(0),
            "5": z.number().min(0).default(0),
            "2": z.number().min(0).default(0),
            "1": z.number().min(0).default(0),
        }),
    }),
    totalCash: z.number().min(0),
    expectedCash: z.number().min(0),
    variance: z.number(),
    notes: z.string().optional(),
});

export const PaymentStatusSchema = z.enum([
    "PENDING",
    "PARTIALLY_PAID",
    "PAID",
    "OVERDUE",
    "CANCELLED",
    "RETURNED",
]);
export type PaymentStatusType = z.infer<typeof PaymentStatusSchema>;
export type PaymentStatusFilter = PaymentStatusType | "";

export type PaginationType = z.infer<typeof PaginationSchema>;
export type DateRangeType = z.infer<typeof DateRangeSchema>;
export type IdParamType = z.infer<typeof IdParamSchema>;
export type ShopTimingType = z.infer<typeof ShopTimingSchema>;
export type CashCountType = z.infer<typeof CashCountSchema>;

// Export grouped schemas for easy imports
export const AuthSchemas = {
    CreateUser: RegisterSchema,
    UpdateUser: UpdateProfileSchema,
    Login: LoginSchema,
    ChangePassword: ChangePasswordSchema,
} as const;

export const BusinessSchemas = {
    CreateCustomer: CreateCustomerSchema,
    UpdateCustomer: UpdateCustomerSchema,
    CreateParty: CreatePartySchema,
    UpdateParty: UpdatePartySchema,
    CreateInvoice: CreateInvoiceSchema,
    UpdateInvoice: UpdateInvoiceSchema,
    CreateSale: CreateSaleSchema,
    UpdateSale: UpdateSaleSchema,
    CreatePayment: CreateInvoicePaymentSchema,
    UpdatePayment: UpdateInvoicePaymentSchema,
} as const;

export const InventorySchemas = {
    CreateInventoryItem: CreateInventoryItemSchema,
    UpdateInventoryItem: UpdateInventoryItemSchema,
    // CreateTextileProduct: TextileProductSchema,
    CreateStockMovement: StockMovementSchema,
} as const;

export const QuerySchemas = {
    Pagination: PaginationSchema,
    DateRange: DateRangeSchema,
    CustomerQuery: CustomerQuerySchema,
    InvoiceQuery: InvoiceQuerySchema,
    SaleQuery: SaleQuerySchema,
    PaymentQuery: InvoicePaymentQuerySchema,
    InventoryItemQuery: InventoryItemQuerySchema,
    PartyQuery: PartyQuerySchema,
} as const;

export const NotificationSchemas = {
    CreateNotification: CreateNotificationSchema,
    CreateReminder: CreateReminderSchema,
} as const;

export const ReportSchemas = {
    GenerateReport: GenerateReportSchema,
} as const;

export const ShopSchemas = {
    ShopTiming: ShopTimingSchema,
    CashCount: CashCountSchema,
} as const;

export const OCRSchemas = {
    CreateOCRJob: CreateOCRJobSchema,
} as const;
