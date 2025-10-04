// packages/common/src/schemas/customer.schemas.ts
import { z } from "zod";
import { PaginationSchema } from "./baseSchemas";

export const CreateCustomerSchema = z.object({
    name: z.string().min(1, "Customer name is required"),
    phone: z.string().optional(),
    email: z.string().email().optional().or(z.literal("")),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    pincode: z.string().optional(),
    gstNumber: z.string().optional(),
    creditLimit: z.number().min(0).default(0),
    dateOfBirth: z.string().datetime().optional(),
    anniversary: z.string().datetime().optional(),
    preferredContact: z.enum(["email", "phone", "whatsapp"]).optional(),
    tags: z.array(z.string()).default([]),
    notes: z.string().optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

// export const CustomerQuerySchema = z.object({
//     page: z.coerce.number().min(1).default(1),
//     limit: z.coerce.number().min(1).max(100).default(10),
//     search: z.string().optional(),
//     sortBy: z.string().optional(),
//     sortOrder: z.enum(["asc", "desc"]).default("desc"),
//     isActive: z.boolean().optional(),
//     city: z.string().optional(),
//     state: z.string().optional(),
//     tags: z.array(z.string()).optional(),
// });

export const CustomerQuerySchema = PaginationSchema.extend({
    name: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    city: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    tags: z.string().optional(), // comma separated tags
});

export type CreateCustomerType = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerType = z.infer<typeof UpdateCustomerSchema>;
export type CustomerQueryType = z.infer<typeof CustomerQuerySchema>;
