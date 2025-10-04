// ========================================
// NOTIFICATION SCHEMAS
// ========================================

import { z } from "zod";

export const NotificationTypeSchema = z.enum([
    "PAYMENT_REMINDER",
    "PAYMENT_CONFIRMATION",
    "INVOICE_CREATED",
    "INVOICE_OVERDUE",
    "SALE_CREATED",
    "ORDER_CONFIRMATION",
    "ORDER_STATUS_UPDATE",
    "STOCK_ALERT",
    "LOW_STOCK_ALERT",
    "REORDER_ALERT",
    "CUSTOM",
    "WELCOME",
    "BIRTHDAY",
    "ANNIVERSARY",
    "PROMOTIONAL",
    "SYSTEM_ALERT",
    "BACKUP_COMPLETED",
    "BACKUP_FAILED",
]);

export const NotificationChannelSchema = z.enum([
    "WHATSAPP",
    "SMS",
    "EMAIL",
    "PUSH",
    "IN_APP",
]);

export const NotificationStatusSchema = z.enum([
    "PENDING",
    "SENT",
    "DELIVERED",
    "READ",
    "FAILED",
    "CANCELLED",
]);

export const ReminderTypeSchema = z.enum([
    "PAYMENT_DUE",
    "OVERDUE_PAYMENT",
    "FOLLOW_UP",
    "CUSTOM",
    "BIRTHDAY",
    "ANNIVERSARY",
    "STOCK_REORDER",
    "TAX_FILING",
]);

export const CreateNotificationSchema = z.object({
    title: z.string().min(1, "Title is required"),
    message: z.string().min(1, "Message is required"),
    type: NotificationTypeSchema,
    channel: NotificationChannelSchema,

    recipientType: z.enum(["CUSTOMER", "PARTY", "USER"]),
    recipientId: z.string().cuid("Invalid recipient ID"),
    recipientName: z.string().min(1, "Recipient name is required"),
    recipientContact: z.string().optional(),

    templateName: z.string().optional(),
    templateData: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),

    // Relations
    partyId: z.string().cuid().optional(),
    customerId: z.string().cuid().optional(),
    invoiceId: z.string().cuid().optional(),
    saleId: z.string().cuid().optional(),
    paymentId: z.string().cuid().optional(),
    receiptId: z.string().cuid().optional(),
    orderId: z.string().cuid().optional(),
});

export const SendWhatsAppSchema = z.object({
    phone: z.string().min(10, "Valid phone number required"),
    message: z.string().min(1, "Message is required"),
    templateName: z.string().optional(),
    templateData: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
});

export const SendEmailSchema = z.object({
    email: z.string().email("Valid email required"),
    subject: z.string().min(1, "Subject is required"),
    body: z.string().min(1, "Email body is required"),
    html: z.boolean().default(false),
    attachments: z
        .array(
            z.object({
                filename: z.string(),
                path: z.string(),
                contentType: z.string().optional(),
            })
        )
        .optional(),
});

export const SendSMSSchema = z.object({
    phone: z.string().min(10, "Valid phone number required"),
    message: z.string().min(1, "Message is required"),
});

export const CreateReminderSchema = z.object({
    message: z.string().min(1, "Message is required"),
    type: ReminderTypeSchema,
    scheduledAt: z.string().datetime("Invalid scheduled date"),
    channel: z.enum(["whatsapp", "sms", "email"]),
    metadata: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
    customerId: z.string().cuid("Invalid customer ID"),
});

export const UpdateNotificationSchema = z.object({
    status: z
        .enum(["PENDING", "SENT", "DELIVERED", "READ", "FAILED", "CANCELLED"])
        .optional(),
    failureReason: z.string().optional(),
});

export const BulkUpdateNotificationSchema = z.object({
    ids: z
        .array(z.string().cuid())
        .min(1, "At least one notification ID is required"),
    action: z.enum(["mark_as_read", "cancel", "reset_for_retry"]),
    status: z
        .enum(["PENDING", "SENT", "DELIVERED", "READ", "FAILED", "CANCELLED"])
        .optional(),
});

export const SearchNotificationSchema = z.object({
    q: z.string().min(1, "Search query is required"),
    status: z
        .enum(["PENDING", "SENT", "DELIVERED", "READ", "FAILED", "CANCELLED"])
        .optional(),
    channel: z.enum(["EMAIL", "SMS", "WHATSAPP", "PUSH", "IN_APP"]).optional(),
    type: z.string().optional(),
    page: z.string().transform(Number).optional().default(1),
    limit: z.string().transform(Number).optional().default(50),
});

export const NotificationStatsSchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    groupBy: z.enum(["day", "week", "month"]).optional().default("day"),
});

export const GetNotificationsSchema = z.object({
    page: z.string().transform(Number).optional().default(1),
    limit: z.string().transform(Number).optional().default(50),
    channel: z.enum(["EMAIL", "SMS", "WHATSAPP", "PUSH", "IN_APP"]).optional(),
    status: z
        .enum(["PENDING", "SENT", "DELIVERED", "READ", "FAILED", "CANCELLED"])
        .optional(),
    type: z.string().optional(),
    recipientType: z.enum(["CUSTOMER", "PARTY", "USER"]).optional(),
    recipientId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    sortBy: z
        .enum(["createdAt", "sentAt", "status", "type"])
        .optional()
        .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export type GetNotificationsType = z.infer<typeof GetNotificationsSchema>;
export type BulkUpdateNotificationType = z.infer<
    typeof BulkUpdateNotificationSchema
>;
export type UpdateNotificationType = z.infer<typeof UpdateNotificationSchema>;
export type CreateReminderType = z.infer<typeof CreateReminderSchema>;
export type SearchNotificationType = z.infer<typeof SearchNotificationSchema>;
export type NotificationStatsType = z.infer<typeof NotificationStatsSchema>;
export type CreateNotificationType = z.infer<typeof CreateNotificationSchema>;
export type SendWhatsAppType = z.infer<typeof SendWhatsAppSchema>;
export type SendEmailType = z.infer<typeof SendEmailSchema>;
export type SendSMSType = z.infer<typeof SendSMSSchema>;
