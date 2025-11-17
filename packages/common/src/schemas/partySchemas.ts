// packages/common/src/schemas/party.schemas.ts
import { z } from "zod";
import { PaginationSchema } from "./baseSchemas";

export const CreatePartySchema = z.object({
    name: z.string().min(1, "Party name is required"),
    gstNo: z.string().optional().nullable(),
    panNo: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().or(z.literal("")).nullable(),
    address: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    pincode: z.string().optional().nullable(),
    contactPerson: z.string().optional().nullable(),
    bankDetails: z
        .object({
            bankName: z.string().optional().nullable(),
            accountNo: z.string().optional().nullable(),
            ifsc: z.string().optional().nullable(),
            branch: z.string().optional().nullable(),
        })
        .optional()
        .nullable(),
    category: z.string().optional().nullable(),
    paymentTerms: z.number().optional().nullable(),
    creditLimit: z.number().min(0).default(0),
    taxId: z.string().optional().nullable(),
    website: z.string().url().optional().or(z.literal("")).nullable(),
    notes: z.string().optional().nullable(),
    isActive: z.boolean().optional().nullable(),
});

export const UpdatePartySchema = CreatePartySchema.partial();

// export const PartyQuerySchema = z.object({
//     page: z.coerce.number().min(1).default(1),
//     limit: z.coerce.number().min(1).max(100).default(10),
//     search: z.string().optional(),
//     sortBy: z.string().optional(),
//     sortOrder: z.enum(["asc", "desc"]).default("desc"),
//     isActive: z.boolean().optional(),
//     category: z.string().optional(),
//     city: z.string().optional(),
//     state: z.string().optional(),
// });

export const PartyQuerySchema = PaginationSchema.extend({
    name: z.string().optional(),
    gstNo: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    category: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
});

export type CreatePartyType = z.infer<typeof CreatePartySchema>;
export type UpdatePartyType = z.infer<typeof UpdatePartySchema>;
export type PartyQueryType = z.infer<typeof PartyQuerySchema>;
