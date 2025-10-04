import { z } from "zod";

export const CreateTemplateSchema = z.object({
    name: z
        .string()
        .min(1, "Template name is required")
        .max(100, "Template name too long"),
    channel: z.enum(["EMAIL", "SMS", "WHATSAPP", "PUSH", "IN_APP"]),
    type: z.enum([
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
    ]),
    subject: z.string().optional(),
    content: z.string().min(1, "Template content is required"),
    variables: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional()
        .default({}),
    metadata: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
    isActive: z.boolean().optional().default(true),
    category: z.string().optional(),
    description: z.string().optional(),
});

export const UpdateTemplateSchema = z.object({
    name: z.string().min(1).max(100).optional(),
    channel: z.enum(["EMAIL", "SMS", "WHATSAPP", "PUSH", "IN_APP"]).optional(),
    type: z
        .enum([
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
        ])
        .optional(),
    subject: z.string().optional(),
    content: z.string().min(1).optional(),
    variables: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
    metadata: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
    isActive: z.boolean().optional(),
    category: z.string().optional(),
    description: z.string().optional(),
});

export const GetTemplatesSchema = z.object({
    page: z.string().transform(Number).optional().default(1),
    limit: z.string().transform(Number).optional().default(50),
    channel: z.enum(["EMAIL", "SMS", "WHATSAPP", "PUSH", "IN_APP"]).optional(),
    type: z.string().optional(),
    isActive: z.enum(["true", "false"]).optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    sortBy: z
        .enum(["name", "createdAt", "updatedAt", "type"])
        .optional()
        .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
});

export const TestTemplateSchema = z.object({
    templateData: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional()
        .default({}),
    recipient: z
        .object({
            email: z.string().email().optional(),
            phone: z.string().optional(),
            name: z.string().optional(),
        })
        .optional(),
});

export const DuplicateTemplateSchema = z.object({
    name: z.string().min(1, "New template name is required").max(100),
});

export const BulkUpdateTemplates = z.object({
    templateIds: z
        .array(z.string().cuid())
        .min(1, "At least one template ID is required"),
    action: z.enum(["activate", "deactivate", "update_category"]),
    data: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
});

export const ExportTemplateSchema = z.object({
    format: z.enum(["json", "csv"]).optional().default("json"),
    templateIds: z.string().optional(),
});

export type CreateTemplateType = z.infer<typeof CreateTemplateSchema>;
