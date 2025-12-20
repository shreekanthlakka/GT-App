// packages/common/src/schemas/authSchemas.ts

import { z } from "zod";

export const UserRoleSchema = z.enum([
    "OWNER",
    "MANAGER",
    "STAFF",
    "VIEWER",
    "ACCOUNTANT",
]);

export const RegisterSchema = z.object({
    email: z.string().email("Invalid email format"),
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role: UserRoleSchema.default("OWNER"),
});

export const LoginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(1, "Password is required"),
});

export const ChangePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(6, "New password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export const ForgotPasswordSchema = z.object({
    email: z.string().email("Invalid email format"),
});

export const ResetPasswordSchema = z
    .object({
        token: z.string().min(1, "Reset token is required"),
        newPassword: z
            .string()
            .min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string().min(6, "Confirm password is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export const RefreshTokenSchema = z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
});

export const UpdateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().optional(),
});

export const TwoFactorSetupSchema = z.object({
    secret: z.string().min(1, "2FA secret is required"),
    token: z.string().length(6, "Token must be 6 digits"),
});

export const TwoFactorVerifySchema = z.object({
    token: z.string().length(6, "Token must be 6 digits"),
});

export type RegisterType = z.infer<typeof RegisterSchema>;
export type LoginType = z.infer<typeof LoginSchema>;
export type ChangePasswordType = z.infer<typeof ChangePasswordSchema>;
export type ForgotPasswordType = z.infer<typeof ForgotPasswordSchema>;
export type ResetPasswordType = z.infer<typeof ResetPasswordSchema>;
export type RefreshTokenType = z.infer<typeof RefreshTokenSchema>;
export type UpdateProfileType = z.infer<typeof UpdateProfileSchema>;
export type TwoFactorSetupType = z.infer<typeof TwoFactorSetupSchema>;
export type TwoFactorVerifyType = z.infer<typeof TwoFactorVerifySchema>;
