// packages/common/schemas/index.ts
import { z } from "zod";

// ========================================
// BASE SCHEMAS
// ========================================

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
