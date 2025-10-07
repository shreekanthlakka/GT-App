// packages/common-backend/src/middlewares/validation.ts (Complete Version)

import { Request, Response, NextFunction } from "express";
import { ZodError, z } from "zod";
import { CustomError } from "../utils/index";
import {
    AuthSchemas,
    BusinessSchemas,
    QuerySchemas,
    InventorySchemas,
    OCRSchemas,
    NotificationSchemas,
    ReportSchemas,
    ShopSchemas,
    IdParamSchema,
    PaginationSchema,
    DateRangeSchema,
    GetNotificationsSchema,
    UpdateNotificationSchema,
    BulkUpdateNotificationSchema,
    SearchNotificationSchema,
    NotificationStatsSchema,
    UpdateTemplateSchema,
    CreateTemplateSchema,
    GetTemplatesSchema,
    TestTemplateSchema,
    DuplicateTemplateSchema,
    BulkUpdateTemplates,
    ExportTemplateSchema,
    DashboardStatsSchema,
    ChannelPerformanceSchema,
    CostAnalyticsSchema,
    FailureAnalysisSchema,
    DeliveryTrendsSchema,
    RecentActivitySchema,
    TopTemplatesSchema,
    CreateSaleReceiptSchema,
    UpdateSaleReceiptSchema,
    DeleteSaleReceiptSchema,
    MarkChequeClearanceSchema,
    AdjustStockSchema,
    ReduceStockSchema,
    AddStockSchema,
    LookupSchema,
    POSSearchSchema,
    StockMovementHistorySchema,
    LowStockQuerySchema,
} from "@repo/common/schemas";

// Extend Request interface to include parsed data
declare global {
    namespace Express {
        interface Request {
            parsedQuery?: any;
            parsedBody?: any;
            parsedParams?: any;
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
// GENERIC VALIDATORS
// ========================================

export const validateIdParam = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedParams = IdParamSchema.parse(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(400, "Invalid ID parameter", errors as any);
        }
        next(error);
    }
};

export const validatePagination = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await PaginationSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Pagination validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateDateRange = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await DateRangeSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Date range validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// AUTHENTICATION VALIDATORS
// ========================================

export const validateRegister = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await AuthSchemas.CreateUser.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Registration validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateLogin = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await AuthSchemas.Login.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Login validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateChangePassword = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await AuthSchemas.ChangePassword.parseAsync(req.body);
        req.body = req.parsedBody;
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

export const validateUpdateProfile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await AuthSchemas.UpdateUser.parseAsync(req.body);
        req.body = req.parsedBody;
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
// CUSTOMER VALIDATORS
// ========================================

export const validateCreateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BusinessSchemas.CreateCustomer.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Customer creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BusinessSchemas.UpdateCustomer.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Customer update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateCustomerQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await QuerySchemas.CustomerQuery.parseAsync(
            req.query
        );
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Customer query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateCustomerId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid customer ID") });
        req.parsedParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Customer ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// PARTY VALIDATORS
// ========================================

export const validateCreateParty = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BusinessSchemas.CreateParty.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Party creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateParty = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BusinessSchemas.UpdateParty.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Party update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validatePartyQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await QuerySchemas.PartyQuery.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Party query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validatePartyId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid party ID") });
        req.parsedParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Party ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// SALE VALIDATORS
// ========================================

export const validateCreateSale = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BusinessSchemas.CreateSale.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Sale creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateSale = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BusinessSchemas.UpdateSale.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Sale update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateSaleQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await QuerySchemas.SaleQuery.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Sale query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateSaleId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid sale ID") });
        req.parsedParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Sale ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// SALE RECEIPT VALIDATORS (Middleware)
// ========================================

export const validateCreateSaleReceipt = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await CreateSaleReceiptSchema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Sale receipt creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateSaleReceipt = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await UpdateSaleReceiptSchema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Sale receipt update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// export const validateGetSaleReceipts = async (
//     req: Request,
//     res: Response,
//     next: NextFunction
// ) => {
//     try {
//         req.parsedQuery = await GetSaleReceiptsSchema.parseAsync(req.query);
//         req.query = req.parsedQuery as any;
//         next();
//     } catch (error) {
//         if (error instanceof ZodError) {
//             const errors = formatZodErrors(error);
//             throw new CustomError(
//                 400,
//                 "Get sale receipts validation failed",
//                 errors as any
//             );
//         }
//         next(error);
//     }
// };

export const validateChequeClearance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await MarkChequeClearanceSchema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Cheque clearance validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateDeleteSaleReceipt = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await DeleteSaleReceiptSchema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Sale receipt deletion validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// INVOICE VALIDATORS
// ========================================

export const validateCreateInvoice = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BusinessSchemas.CreateInvoice.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Invoice creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateInvoice = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BusinessSchemas.UpdateInvoice.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Invoice update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateInvoiceQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await QuerySchemas.InvoiceQuery.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Invoice query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateInvoiceId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid invoice ID") });
        req.parsedParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Invoice ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// PAYMENT VALIDATORS
// ========================================

export const validateCreatePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BusinessSchemas.CreatePayment.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Payment creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdatePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BusinessSchemas.UpdatePayment.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Payment update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validatePaymentQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await QuerySchemas.PaymentQuery.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Payment query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validatePaymentId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid payment ID") });
        req.parsedParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Payment ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// PRODUCT VALIDATORS
// ========================================

export const validateCreateInventoryItem = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await InventorySchemas.CreateInventoryItem.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "InventoryItem creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateUpdateInventoryItem = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await InventorySchemas.UpdateInventoryItem.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "InventoryItem update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateInventoryItemQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await QuerySchemas.InventoryItemQuery.parseAsync(
            req.query
        );
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "InventoryItem query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateProductId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid product ID") });
        req.parsedParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Product ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateStockMovement = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await InventorySchemas.CreateStockMovement.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Stock movement validation failed",
                errors as any
            );
        }
        next(error);
    }
};

/**
 * Validate add stock request
 */
export const validateAddStock = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await AddStockSchema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Add stock validation failed",
                errors as any
            );
        }
        next(error);
    }
};

/**
 * Validate reduce stock request
 */
export const validateReduceStock = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await ReduceStockSchema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Reduce stock validation failed",
                errors as any
            );
        }
        next(error);
    }
};

/**
 * Validate adjust stock request
 */
export const validateAdjustStock = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await AdjustStockSchema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Adjust stock validation failed",
                errors as any
            );
        }
        next(error);
    }
};

/**
 * Validate POS search query
 */
export const validatePOSSearch = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await POSSearchSchema.parseAsync(req.query);
        req.query = req.parsedQuery as any;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Search validation failed",
                errors as any
            );
        }
        next(error);
    }
};

/**
 * Validate lookup query
 */
export const validateLookup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await LookupSchema.parseAsync(req.query);
        req.query = req.parsedQuery as any;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Lookup validation failed",
                errors as any
            );
        }
        next(error);
    }
};

/**
 * Validate low stock query
 */
export const validateLowStockQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await LowStockQuerySchema.parseAsync(req.query);
        req.query = req.parsedQuery as any;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Low stock query validation failed",
                errors as any
            );
        }
        next(error);
    }
};

/**
 * Validate stock movement history query
 */
export const validateStockMovementHistory = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await StockMovementHistorySchema.parseAsync(
            req.query
        );
        req.query = req.parsedQuery as any;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Stock movement history query validation failed",
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
        // Add order schema to BusinessSchemas or create separately
        const schema = z.object({
            orderNo: z.string().min(1, "Order number is required"),
            customerId: z.string().cuid("Invalid customer ID"),
            totalAmount: z.number().min(0, "Total amount cannot be negative"),
            items: z
                .array(
                    z.object({
                        productId: z.string().cuid("Invalid product ID"),
                        quantity: z
                            .number()
                            .min(1, "Quantity must be at least 1"),
                        price: z.number().min(0, "Price cannot be negative"),
                    })
                )
                .min(1, "At least one item is required"),
            shippingAddress: z
                .object({
                    name: z.string(),
                    phone: z.string(),
                    address: z.string(),
                    city: z.string(),
                    state: z.string(),
                    pincode: z.string(),
                })
                .optional(),
            notes: z.string().optional(),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
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

export const validateOrderId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid order ID") });
        req.parsedParams = await schema.parseAsync(req.params);
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

// ========================================
// NOTIFICATION VALIDATORS
// ========================================

export const validateCreateNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody =
            await NotificationSchemas.CreateNotification.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Notification creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateCreateReminder = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await NotificationSchemas.CreateReminder.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Reminder creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateGetNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await GetNotificationsSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Get notifications validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateUpdateNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await UpdateNotificationSchema.parseAsync(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Update notification validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateBulkUpdateNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BulkUpdateNotificationSchema.parseAsync(
            req.body
        );
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Bulk update notifications validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateSearchNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await SearchNotificationSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Search notifications validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateNotificationStats = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await NotificationStatsSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Notification stats validation failed",
                errors
            );
        }
        next(error);
    }
};

// ========================================
// REPORT VALIDATORS
// ========================================

export const validateGenerateReport = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await ReportSchemas.GenerateReport.parseAsync(
            req.body
        );
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Report generation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// SHOP OPERATION VALIDATORS
// ========================================

export const validateShopTiming = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await ShopSchemas.ShopTiming.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Shop timing validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateCashCount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await ShopSchemas.CashCount.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Cash count validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// OCR VALIDATORS
// ========================================

export const validateCreateOCRJob = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await OCRSchemas.CreateOCRJob.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "OCR job creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// USER VALIDATORS
// ========================================

export const validateUserId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid user ID") });
        req.parsedParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "User ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// LEDGER VALIDATORS
// ========================================

export const validateLedgerAdjustment = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z
            .object({
                customerId: z.string().cuid("Invalid customer ID").optional(),
                partyId: z.string().cuid("Invalid party ID").optional(),
                amount: z
                    .number()
                    .refine((val) => val !== 0, "Amount cannot be zero"),
                description: z.string().min(1, "Description is required"),
                reason: z.string().min(1, "Reason is required"),
                date: z.string().datetime().optional(),
            })
            .refine(
                (data) => data.customerId || data.partyId,
                "Either customer ID or party ID is required"
            );

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Ledger adjustment validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateOpeningBalance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z
            .object({
                customerId: z.string().cuid("Invalid customer ID").optional(),
                partyId: z.string().cuid("Invalid party ID").optional(),
                amount: z.number(),
                description: z.string().min(1, "Description is required"),
                date: z.string().datetime().optional(),
            })
            .refine(
                (data) => data.customerId || data.partyId,
                "Either customer ID or party ID is required"
            );

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Opening balance validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// CREDIT LIMIT VALIDATORS
// ========================================

export const validateCreditLimitUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z
            .object({
                customerId: z.string().cuid("Invalid customer ID").optional(),
                partyId: z.string().cuid("Invalid party ID").optional(),
                newLimit: z.number().min(0, "Credit limit cannot be negative"),
                reason: z.string().min(1, "Reason is required"),
            })
            .refine(
                (data) => data.customerId || data.partyId,
                "Either customer ID or party ID is required"
            );

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Credit limit update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// RECEIPT VALIDATORS
// ========================================

export const validateCreateReceipt = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            receiptNo: z.string().min(1, "Receipt number is required"),
            date: z.string().datetime(),
            amount: z.number().min(0.01, "Amount must be greater than 0"),
            description: z.string().optional(),
            partyId: z.string().cuid("Invalid party ID").optional(),
            paymentId: z.string().cuid("Invalid payment ID").optional(),
            invoiceId: z.string().cuid("Invalid invoice ID").optional(),
            imageUrl: z.string().url().optional(),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Receipt creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateReceiptId = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({ id: z.string().cuid("Invalid receipt ID") });
        req.parsedParams = await schema.parseAsync(req.params);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Receipt ID validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// BACKUP & SYSTEM VALIDATORS
// ========================================

export const validateCreateBackup = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            type: z.enum(["FULL", "INCREMENTAL", "SCHEMA"]),
            description: z.string().optional(),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Backup creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateBackupSchedule = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
            time: z
                .string()
                .regex(
                    /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
                    "Invalid time format"
                ),
            type: z.enum(["FULL", "INCREMENTAL"]),
            enabled: z.boolean().default(true),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Backup schedule validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// SYSTEM CONFIG VALIDATORS
// ========================================

export const validateSystemConfig = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            key: z.string().min(1, "Config key is required"),
            value: z.any(),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "System config validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// TEXTILE SPECIFIC VALIDATORS
// ========================================

export const validateTextileProduct = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            name: z.string().min(1, "Product name is required"),
            category: z.string().min(1, "Category is required"),
            fabric: z.string().min(1, "Fabric type is required"),
            gsm: z.number().min(1).optional(),
            width: z.number().min(1).optional(),
            color: z.string().optional(),
            design: z.string().optional(),
            pattern: z.string().optional(),
            price: z.number().min(0, "Price cannot be negative"),
            stock: z.number().min(0).default(0),
            minStock: z.number().min(0).default(0),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Textile product validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateFabricQuality = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            productId: z.string().cuid("Invalid product ID"),
            qualityCheck: z.object({
                gsm: z.number().min(1),
                width: z.number().min(1),
                colorFastness: z.enum(["EXCELLENT", "GOOD", "AVERAGE", "POOR"]),
                shrinkage: z.number().min(0).max(100),
                defects: z.array(z.string()).default([]),
                grade: z.enum(["A+", "A", "B", "C", "REJECT"]),
            }),
            inspectorNotes: z.string().optional(),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Fabric quality validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// SEASONAL & FESTIVAL VALIDATORS
// ========================================

export const validateSeasonalDiscount = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            season: z.enum([
                "SUMMER",
                "WINTER",
                "MONSOON",
                "FESTIVAL",
                "WEDDING",
            ]),
            discountType: z.enum(["PERCENTAGE", "FIXED"]),
            discountValue: z.number().min(0),
            startDate: z.string().datetime(),
            endDate: z.string().datetime(),
            applicableProducts: z.array(z.string().cuid()).optional(),
            applicableCategories: z.array(z.string()).optional(),
            minimumPurchase: z.number().min(0).optional(),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Seasonal discount validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateFestivalOffer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            festivalName: z.string().min(1, "Festival name is required"),
            offerTitle: z.string().min(1, "Offer title is required"),
            description: z.string().optional(),
            discountPercentage: z.number().min(0).max(100),
            validFrom: z.string().datetime(),
            validTo: z.string().datetime(),
            targetCustomers: z
                .enum(["ALL", "VIP", "REGULAR", "NEW"])
                .default("ALL"),
            maxUsagePerCustomer: z.number().min(1).default(1),
            isActive: z.boolean().default(true),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Festival offer validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// CUSTOMER LOYALTY VALIDATORS
// ========================================

export const validateLoyaltyPoints = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            customerId: z.string().cuid("Invalid customer ID"),
            points: z.number().int(),
            type: z.enum(["EARNED", "REDEEMED", "EXPIRED", "ADJUSTMENT"]),
            reason: z.string().min(1, "Reason is required"),
            referenceId: z.string().optional(),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Loyalty points validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// ANALYTICS & REPORTING VALIDATORS
// ========================================

export const validateAnalyticsQuery = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            metric: z.enum([
                "SALES_TREND",
                "CUSTOMER_SEGMENTATION",
                "PRODUCT_PERFORMANCE",
                "INVENTORY_TURNOVER",
                "PROFIT_ANALYSIS",
            ]),
            period: z.enum([
                "DAILY",
                "WEEKLY",
                "MONTHLY",
                "QUARTERLY",
                "YEARLY",
            ]),
            startDate: z.string().datetime(),
            endDate: z.string().datetime(),
            groupBy: z.array(z.string()).optional(),
            filters: z.record(z.string(), z.any()).optional(),
        });

        req.parsedQuery = await schema.parseAsync(req.query);
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
// FILE UPLOAD VALIDATORS
// ========================================

export const validateFileUpload = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            fileType: z.enum(["IMAGE", "DOCUMENT", "EXCEL", "CSV"]),
            purpose: z.enum([
                "PRODUCT_IMAGE",
                "OCR_DOCUMENT",
                "BULK_IMPORT",
                "BACKUP",
            ]),
            maxSize: z.number().optional().default(10485760), // 10MB default
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "File upload validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// BULK OPERATIONS VALIDATORS
// ========================================

export const validateBulkCustomerCreate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            customers: z
                .array(
                    z.object({
                        name: z.string().min(1, "Customer name is required"),
                        phone: z.string().optional(),
                        email: z.string().email().optional().or(z.literal("")),
                        address: z.string().optional(),
                        city: z.string().optional(),
                        state: z.string().optional(),
                        creditLimit: z.number().min(0).default(0),
                    })
                )
                .min(1, "At least one customer is required")
                .max(100, "Maximum 100 customers allowed"),
            validateDuplicates: z.boolean().default(true),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Bulk customer creation validation failed",
                errors as any
            );
        }
        next(error);
    }
};

export const validateBulkProductUpdate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const schema = z.object({
            updates: z
                .array(
                    z.object({
                        productId: z.string().cuid("Invalid product ID"),
                        price: z.number().min(0).optional(),
                        stock: z.number().min(0).optional(),
                        minStock: z.number().min(0).optional(),
                        isActive: z.boolean().optional(),
                    })
                )
                .min(1, "At least one update is required")
                .max(500, "Maximum 500 updates allowed"),
            updateReason: z.string().min(1, "Update reason is required"),
        });

        req.parsedBody = await schema.parseAsync(req.body);
        req.body = req.parsedBody;
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Bulk product update validation failed",
                errors as any
            );
        }
        next(error);
    }
};

// ========================================
// Template VALIDATORS
// ========================================

export const validateCreateTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await CreateTemplateSchema.parseAsync(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Template creation validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateUpdateTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await UpdateTemplateSchema.parseAsync(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Template update validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateGetTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await GetTemplatesSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Get templates validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateTestTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await TestTemplateSchema.parseAsync(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Test template validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateDuplicateTemplate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await DuplicateTemplateSchema.parseAsync(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Duplicate template validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateBulkUpdateTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedBody = await BulkUpdateTemplates.parseAsync(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Bulk update templates validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateExportTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await ExportTemplateSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Export templates validation failed",
                errors
            );
        }
        next(error);
    }
};

// ========================================
// Dashboard VALIDATORS
// ========================================

export const validateDashboardStats = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await DashboardStatsSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Dashboard stats validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateChannelPerformance = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await ChannelPerformanceSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Channel performance validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateCostAnalytics = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await CostAnalyticsSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Cost analytics validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateFailureAnalysis = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await FailureAnalysisSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Failure analysis validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateDeliveryTrends = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await DeliveryTrendsSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Delivery trends validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateRecentActivity = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await RecentActivitySchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Recent activity validation failed",
                errors
            );
        }
        next(error);
    }
};

export const validateTopTemplates = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        req.parsedQuery = await TopTemplatesSchema.parseAsync(req.query);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            const errors = formatZodErrors(error);
            throw new CustomError(
                400,
                "Top templates validation failed",
                errors
            );
        }
        next(error);
    }
};

// ========================================
// EXPORT ALL VALIDATORS
// ========================================

export { formatZodErrors };
