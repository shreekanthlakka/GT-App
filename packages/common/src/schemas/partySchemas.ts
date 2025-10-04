// packages/common/src/schemas/party.schemas.ts
import { z } from "zod";
import { PaginationSchema } from "./baseSchemas";

export const CreatePartySchema = z.object({
    name: z.string().min(1, "Party name is required"),
    gstNo: z.string().optional(),
    panNo: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    contactPerson: z.string().optional(),
    bankDetails: z
        .object({
            bankName: z.string().optional(),
            accountNo: z.string().optional(),
            ifsc: z.string().optional(),
            branch: z.string().optional(),
        })
        .optional(),
    category: z.string().optional(),
    paymentTerms: z.number().optional(),
    creditLimit: z.number().min(0).default(0),
    taxId: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    notes: z.string().optional(),
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
