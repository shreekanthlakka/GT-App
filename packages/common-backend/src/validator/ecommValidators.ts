// packages/common-backend/src/middlewares/ecommerceValidation.ts

import { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import { CustomError } from "../utils/index";
import {
    EcommerceSchemas,
    PreferencesSchema,
    UpdateEcommerceUserSchema,
} from "@repo/common/ecommSchemas";

// Extend Request interface for ecommerce parsed data
declare global {
    namespace Express {
        interface Request {
            parsedEcomQuery?: any;
            parsedEcomBody?: any;
            parsedEcomParams?: any;
        }
    }
}

// Helper function to format Zod errors
const formatZodErrors = (error: ZodError) => {
    return error.issues.map((issue) => ({
        field: issue.path.join(".") || "root",
        message: issue.message,
    }));
};

// ========================================
// GENERIC ECOMMERCE VALIDATORS
// ========================================

export const validateEcommerceUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            id: z.string().cuid("Invalid ecommerce user ID"),
        });
        req.parsedEcomParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Ecommerce user ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateOrderId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid order ID") });
        req.parsedEcomParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Order ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateReviewId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid review ID") });
        req.parsedEcomParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Review ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateAddressId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid address ID") });
        req.parsedEcomParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Address ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// AUTHENTICATION VALIDATORS
// ========================================

export const validateEcommerceRegister = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody =
            await EcommerceSchemas.CreateEcommerceUser.parseAsync(req.body);
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Ecommerce user registration validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateEcommerceLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.EcommerceLogin.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Ecommerce login validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateSocialLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.SocialLogin.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Social login validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateEcommerceChangePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.ChangePassword.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Change password validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateForgotPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.ForgotPassword.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Forgot password validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateResetPassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.ResetPassword.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Reset password validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateVerifyEmail = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.VerifyEmail.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Email verification validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateVerifyPhone = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.VerifyPhone.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Phone verification validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// USER PROFILE VALIDATORS
// ========================================

export const validateUpdateEcommerceProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody =
            await EcommerceSchemas.UpdateEcommerceUser.parseAsync(req.body);
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Profile update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// ADDRESS VALIDATORS
// ========================================

export const validateCreateAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.CreateAddress.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Address creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.UpdateAddress.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Address update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateSetDefaultAddress = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody =
            await EcommerceSchemas.SetDefaultAddress.parseAsync(req.body);
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Set default address validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// SHOPPING CART VALIDATORS
// ========================================

export const validateAddToCart = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.AddToCart.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Add to cart validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateCartItem = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.UpdateCartItem.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Cart item update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateBulkUpdateCart = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.BulkUpdateCart.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Bulk cart update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// WISHLIST VALIDATORS
// ========================================

export const validateAddToWishlist = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.AddToWishlist.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Add to wishlist validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateBulkWishlist = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.BulkWishlist.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Bulk wishlist validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// ORDER VALIDATORS
// ========================================

export const validateCreateOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.CreateOrder.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Order creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.UpdateOrder.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Order update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateCancelOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.CancelOrder.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Order cancellation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateReturnOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.ReturnOrder.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Order return validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// PAYMENT VALIDATORS
// ========================================

export const validateCreateOrderPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody =
            await EcommerceSchemas.CreateOrderPayment.parseAsync(req.body);
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Order payment creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdatePaymentStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody =
            await EcommerceSchemas.UpdatePaymentStatus.parseAsync(req.body);
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Payment status update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// REVIEW VALIDATORS
// ========================================

export const validateCreateReview = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.CreateReview.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Review creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateReview = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.UpdateReview.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Review update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// QUERY VALIDATORS
// ========================================

export const validateEcommerceUserQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomQuery =
            await EcommerceSchemas.EcommerceUserQuery.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Ecommerce user query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateOrderQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomQuery = await EcommerceSchemas.OrderQuery.parseAsync(
            req.query
        );
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Order query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateReviewQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomQuery = await EcommerceSchemas.ReviewQuery.parseAsync(
            req.query
        );
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Review query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateEcommerceAnalyticsQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomQuery =
            await EcommerceSchemas.EcommerceAnalyticsQuery.parseAsync(
                req.query
            );
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Analytics query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// BULK OPERATION VALIDATORS
// ========================================

export const validateBulkOrderUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.BulkOrderUpdate.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Bulk order update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateBulkUserUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedEcomBody = await EcommerceSchemas.BulkUserUpdate.parseAsync(
            req.body
        );
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Bulk user update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// PRODUCT INTERACTION VALIDATORS
// ========================================

export const validateInventoryItemId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            id: z.string().cuid("Invalid inventory item ID"),
        });
        req.parsedEcomParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Inventory item ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// ADVANCED VALIDATION HELPERS
// ========================================

export const validateStockAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            items: z
                .array(
                    z.object({
                        inventoryItemId: z.string().cuid("Invalid product ID"),
                        quantity: z
                            .number()
                            .min(1, "Quantity must be at least 1"),
                    })
                )
                .min(1, "At least one item is required"),
        });

        req.parsedEcomBody = await schema.parseAsync(req.body);
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Stock availability validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateCouponCode = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            couponCode: z
                .string()
                .min(3, "Coupon code must be at least 3 characters"),
            orderValue: z
                .number()
                .min(0, "Order value cannot be negative")
                .optional(),
        });

        req.parsedEcomBody = await schema.parseAsync(req.body);
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Coupon validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateShippingCalculation = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            pincode: z
                .string()
                .regex(/^\d{6}$/, "Valid 6-digit pincode required"),
            weight: z.number().min(0.1, "Weight must be greater than 0"),
            value: z.number().min(1, "Order value must be greater than 0"),
            items: z
                .array(
                    z.object({
                        inventoryItemId: z.string().cuid(),
                        quantity: z.number().min(1),
                    })
                )
                .min(1),
        });

        req.parsedEcomBody = await schema.parseAsync(req.body);
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Shipping calculation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// NOTIFICATION PREFERENCE VALIDATORS
// ========================================

export const validateNotificationPreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            preferences: z.object({
                orderUpdates: z.boolean().default(true),
                promotions: z.boolean().default(true),
                newArrivals: z.boolean().default(false),
                priceAlerts: z.boolean().default(false),
                whatsapp: z.boolean().default(true),
                sms: z.boolean().default(true),
                email: z.boolean().default(true),
                push: z.boolean().default(true),
            }),
        });

        req.parsedEcomBody = await schema.parseAsync(req.body);
        req.body = req.parsedEcomBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Notification preferences validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const parsed = await UpdateEcommerceUserSchema.parseAsync(req.body);
        req.body = parsed;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Profile update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validatePreferences = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const parsed = await PreferencesSchema.parseAsync(req.body);
        req.body = parsed;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Preferences validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// EXPORT ALL VALIDATORS
// ========================================

export { formatZodErrors };
