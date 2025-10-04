// packages/common/schemas/ecommerceSchemas.ts

import { z } from "zod";

// ========================================
// ENUMS FOR ECOMMERCE
// ========================================

export const EcommerceEnums = {
    Gender: z.enum(["MALE", "FEMALE", "OTHER"]),
    AddressType: z.enum(["HOME", "OFFICE", "OTHER"]),
    SignupSource: z.enum(["WEBSITE", "MOBILE_APP", "SOCIAL", "REFERRAL"]),
    OrderStatus: z.enum([
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "RETURNED",
        "REFUNDED",
    ]),
    OrderSource: z.enum(["ONLINE", "PHONE", "WALK_IN", "ECOMMERCE"]),
    OrderPriority: z.enum(["HIGH", "NORMAL", "LOW"]),
    PaymentGatewayStatus: z.enum([
        "SUCCESS",
        "FAILURE",
        "PENDING",
        "CANCELLED",
    ]),
    ReviewRating: z.enum(["1", "2", "3", "4", "5"]),
};

// ========================================
// BASE SCHEMAS
// ========================================

export const AddressSchema = z.object({
    type: EcommerceEnums.AddressType,
    name: z.string().min(1, "Name is required"),
    phone: z.string().min(10, "Valid phone number required").max(15),
    address: z.string().min(10, "Complete address is required"),
    city: z.string().min(1, "City is required"),
    state: z.string().min(1, "State is required"),
    pincode: z.string().regex(/^\d{6}$/, "Valid 6-digit pincode required"),
    isDefault: z.boolean().default(false),
    landmark: z.string().optional(),
    instructions: z.string().optional(),
});

export const PreferencesSchema = z.object({
    newsletter: z.boolean().default(true),
    sms: z.boolean().default(true),
    whatsapp: z.boolean().default(true),
    push: z.boolean().default(true),
    language: z.string().default("en"),
    currency: z.string().default("INR"),
    notifications: z
        .object({
            orderUpdates: z.boolean().default(true),
            promotions: z.boolean().default(true),
            newArrivals: z.boolean().default(false),
            priceAlerts: z.boolean().default(false),
        })
        .optional(),
});

// ========================================
// ECOMMERCE USER SCHEMAS
// ========================================

export const CreateEcommerceUserSchema = z.object({
    email: z.string().email("Valid email is required"),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            "Password must contain uppercase, lowercase, and number"
        ),
    name: z.string().min(2, "Name must be at least 2 characters"),
    phone: z.string().min(10, "Valid phone number required").max(15).optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: EcommerceEnums.Gender.optional(),
    referralCode: z.string().optional(),
    signupSource: EcommerceEnums.SignupSource.default("WEBSITE"),
    preferences: PreferencesSchema.optional(),
});

export const UpdateEcommerceUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters").optional(),
    phone: z.string().min(10, "Valid phone number required").max(15).optional(),
    dateOfBirth: z.string().datetime().optional(),
    gender: EcommerceEnums.Gender.optional(),
    avatar: z.string().url().optional(),
    preferences: PreferencesSchema.optional(),
});

export const EcommerceLoginSchema = z.object({
    email: z.string().email("Valid email is required"),
    password: z.string().min(1, "Password is required"),
    rememberMe: z.boolean().default(false),
    deviceInfo: z
        .object({
            type: z.enum(["mobile", "desktop", "tablet"]).optional(),
            os: z.string().optional(),
            browser: z.string().optional(),
            version: z.string().optional(),
        })
        .optional(),
});

export const SocialLoginSchema = z.object({
    provider: z.enum(["google", "facebook"]),
    providerId: z.string(),
    email: z.string().email(),
    name: z.string().min(1),
    avatar: z.string().url().optional(),
    deviceInfo: z
        .object({
            type: z.enum(["mobile", "desktop", "tablet"]).optional(),
            os: z.string().optional(),
            browser: z.string().optional(),
        })
        .optional(),
});

export const ChangePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Password must contain uppercase, lowercase, and number"
            ),
        confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export const ForgotPasswordSchema = z.object({
    email: z.string().email("Valid email is required"),
});

export const ResetPasswordSchema = z
    .object({
        token: z.string().min(1, "Reset token is required"),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters")
            .regex(
                /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                "Password must contain uppercase, lowercase, and number"
            ),
        confirmPassword: z.string().min(1, "Confirm password is required"),
    })
    .refine((data) => data.password === data.confirmPassword, {
        message: "Passwords don't match",
        path: ["confirmPassword"],
    });

export const VerifyEmailSchema = z.object({
    token: z.string().min(1, "Verification token is required"),
});

export const VerifyPhoneSchema = z.object({
    phone: z.string().min(10, "Valid phone number required"),
    otp: z.string().length(6, "OTP must be 6 digits"),
});

export type CreateEcommerceUserType = z.infer<typeof CreateEcommerceUserSchema>;
export type EcommerceLoginType = z.infer<typeof EcommerceLoginSchema>;

// ========================================
// ADDRESS SCHEMAS
// ========================================

export const CreateAddressSchema = AddressSchema;

export const UpdateAddressSchema = AddressSchema.partial();

export const SetDefaultAddressSchema = z.object({
    addressId: z.string().cuid("Invalid address ID"),
});

// ========================================
// CART SCHEMAS
// ========================================

export const AddToCartSchema = z.object({
    inventoryItemId: z.string().cuid("Invalid product ID"),
    quantity: z
        .number()
        .min(1, "Quantity must be at least 1")
        .max(99, "Maximum quantity is 99"),
});

export const UpdateCartItemSchema = z.object({
    quantity: z
        .number()
        .min(1, "Quantity must be at least 1")
        .max(99, "Maximum quantity is 99"),
});

export const BulkUpdateCartSchema = z.object({
    items: z
        .array(
            z.object({
                inventoryItemId: z.string().cuid("Invalid product ID"),
                quantity: z
                    .number()
                    .min(1, "Quantity must be at least 1")
                    .max(99, "Maximum quantity is 99"),
            })
        )
        .min(1, "At least one item is required"),
});

// ========================================
// WISHLIST SCHEMAS
// ========================================

export const AddToWishlistSchema = z.object({
    inventoryItemId: z.string().cuid("Invalid product ID"),
});

export const BulkWishlistSchema = z.object({
    inventoryItemIds: z
        .array(z.string().cuid("Invalid product ID"))
        .min(1, "At least one product is required")
        .max(50, "Maximum 50 items allowed"),
});

// ========================================
// ORDER SCHEMAS
// ========================================

export const CreateOrderSchema = z.object({
    items: z
        .array(
            z.object({
                inventoryItemId: z.string().cuid("Invalid product ID"),
                quantity: z.number().min(1, "Quantity must be at least 1"),
                price: z.number().min(0, "Price cannot be negative"),
                discount: z
                    .number()
                    .min(0, "Discount cannot be negative")
                    .default(0),
            })
        )
        .min(1, "At least one item is required"),

    shippingAddress: AddressSchema.omit({ isDefault: true }),
    billingAddress: AddressSchema.omit({ isDefault: true }).optional(),

    paymentMethod: z.enum(["CARD", "UPI", "WALLET", "COD", "NET_BANKING"]),
    shippingAmount: z
        .number()
        .min(0, "Shipping amount cannot be negative")
        .default(0),
    discountAmount: z
        .number()
        .min(0, "Discount amount cannot be negative")
        .default(0),
    taxAmount: z.number().min(0, "Tax amount cannot be negative").default(0),

    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),
    priority: EcommerceEnums.OrderPriority.default("NORMAL"),

    // Coupon and offers
    couponCode: z.string().optional(),
    giftMessage: z
        .string()
        .max(200, "Gift message cannot exceed 200 characters")
        .optional(),

    // Delivery preferences
    deliveryInstructions: z
        .string()
        .max(300, "Instructions cannot exceed 300 characters")
        .optional(),
    preferredDeliveryTime: z
        .enum(["MORNING", "AFTERNOON", "EVENING", "ANYTIME"])
        .default("ANYTIME"),
});

export const UpdateOrderSchema = z.object({
    status: EcommerceEnums.OrderStatus.optional(),
    trackingNumber: z.string().optional(),
    expectedDelivery: z.string().datetime().optional(),
    actualDelivery: z.string().datetime().optional(),
    notes: z.string().max(500, "Notes cannot exceed 500 characters").optional(),

    // Internal fields
    priority: EcommerceEnums.OrderPriority.optional(),
    internalNotes: z
        .string()
        .max(1000, "Internal notes cannot exceed 1000 characters")
        .optional(),
});

export const CancelOrderSchema = z.object({
    reason: z.enum([
        "CUSTOMER_REQUEST",
        "OUT_OF_STOCK",
        "PAYMENT_FAILED",
        "ADDRESS_ISSUE",
        "QUALITY_ISSUE",
        "DELIVERY_DELAY",
        "OTHER",
    ]),
    comments: z
        .string()
        .max(500, "Comments cannot exceed 500 characters")
        .optional(),
});

export const ReturnOrderSchema = z.object({
    items: z
        .array(
            z.object({
                orderItemId: z.string().cuid("Invalid order item ID"),
                quantity: z.number().min(1, "Quantity must be at least 1"),
                reason: z.enum([
                    "DEFECTIVE",
                    "WRONG_ITEM",
                    "SIZE_ISSUE",
                    "COLOR_DIFFERENCE",
                    "QUALITY_ISSUE",
                    "DAMAGED",
                    "NOT_AS_DESCRIBED",
                    "OTHER",
                ]),
                comments: z
                    .string()
                    .max(300, "Comments cannot exceed 300 characters")
                    .optional(),
            })
        )
        .min(1, "At least one item is required"),

    returnMethod: z.enum(["PICKUP", "DROP_OFF", "COURIER"]),
    refundMethod: z.enum(["ORIGINAL_PAYMENT", "WALLET", "BANK_TRANSFER"]),

    images: z
        .array(z.string().url())
        .max(5, "Maximum 5 images allowed")
        .optional(),
    overallComments: z
        .string()
        .max(500, "Comments cannot exceed 500 characters")
        .optional(),
});

// ========================================
// PAYMENT SCHEMAS
// ========================================

export const CreateOrderPaymentSchema = z.object({
    orderId: z.string().cuid("Invalid order ID"),
    amount: z.number().min(0.01, "Amount must be greater than 0"),
    method: z.enum(["CARD", "UPI", "WALLET", "NET_BANKING", "COD"]),

    // Gateway details
    gatewayProvider: z
        .enum(["RAZORPAY", "STRIPE", "PAYU", "CASHFREE"])
        .optional(),
    gatewayOrderId: z.string().optional(),

    // Card/UPI specific
    cardDetails: z
        .object({
            last4: z.string().length(4).optional(),
            brand: z.string().optional(),
            network: z.string().optional(),
        })
        .optional(),

    upiDetails: z
        .object({
            vpa: z.string().optional(),
            app: z.string().optional(),
        })
        .optional(),
});

export const UpdatePaymentStatusSchema = z.object({
    status: z.enum(["PENDING", "COMPLETED", "FAILED", "CANCELLED", "REFUNDED"]),
    gatewayPaymentId: z.string().optional(),
    gatewayResponse: z
        .record(z.string(), z.union([z.string(), z.number(), z.boolean()]))
        .optional(),
    failureReason: z.string().optional(),
});

// ========================================
// REVIEW SCHEMAS
// ========================================

export const CreateReviewSchema = z.object({
    inventoryItemId: z.string().cuid("Invalid product ID"),
    orderId: z.string().cuid("Invalid order ID").optional(),
    rating: EcommerceEnums.ReviewRating,
    title: z.string().max(100, "Title cannot exceed 100 characters").optional(),
    comment: z
        .string()
        .max(1000, "Comment cannot exceed 1000 characters")
        .optional(),
    images: z
        .array(z.string().url())
        .max(5, "Maximum 5 images allowed")
        .optional(),

    // Review aspects for textile products
    aspects: z
        .object({
            quality: EcommerceEnums.ReviewRating.optional(),
            value: EcommerceEnums.ReviewRating.optional(),
            design: EcommerceEnums.ReviewRating.optional(),
            comfort: EcommerceEnums.ReviewRating.optional(),
            durability: EcommerceEnums.ReviewRating.optional(),
        })
        .optional(),
});

export const UpdateReviewSchema = z.object({
    rating: EcommerceEnums.ReviewRating.optional(),
    title: z.string().max(100, "Title cannot exceed 100 characters").optional(),
    comment: z
        .string()
        .max(1000, "Comment cannot exceed 1000 characters")
        .optional(),
    images: z
        .array(z.string().url())
        .max(5, "Maximum 5 images allowed")
        .optional(),

    aspects: z
        .object({
            quality: EcommerceEnums.ReviewRating.optional(),
            value: EcommerceEnums.ReviewRating.optional(),
            design: EcommerceEnums.ReviewRating.optional(),
            comfort: EcommerceEnums.ReviewRating.optional(),
            durability: EcommerceEnums.ReviewRating.optional(),
        })
        .optional(),
});

// ========================================
// QUERY SCHEMAS
// ========================================

export const EcommerceUserQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    search: z.string().optional(),
    isActive: z.coerce.boolean().optional(),
    isBlocked: z.coerce.boolean().optional(),
    emailVerified: z.coerce.boolean().optional(),
    signupSource: EcommerceEnums.SignupSource.optional(),
    sortBy: z
        .enum(["createdAt", "name", "email", "lastLoginAt"])
        .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
});

export const OrderQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: EcommerceEnums.OrderStatus.optional(),
    source: EcommerceEnums.OrderSource.optional(),
    priority: EcommerceEnums.OrderPriority.optional(),
    customerId: z.string().cuid().optional(),
    ecommerceUserId: z.string().cuid().optional(),
    search: z.string().optional(), // Search by order number or customer name
    sortBy: z
        .enum(["date", "totalAmount", "status", "priority"])
        .default("date"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    dateFrom: z.string().datetime().optional(),
    dateTo: z.string().datetime().optional(),
    amountFrom: z.coerce.number().min(0).optional(),
    amountTo: z.coerce.number().min(0).optional(),
});

export const ReviewQuerySchema = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    inventoryItemId: z.string().cuid().optional(),
    ecommerceUserId: z.string().cuid().optional(),
    rating: EcommerceEnums.ReviewRating.optional(),
    isVerified: z.coerce.boolean().optional(),
    isApproved: z.coerce.boolean().optional(),
    sortBy: z
        .enum(["createdAt", "rating", "helpfulVotes"])
        .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).default("desc"),
    withImages: z.coerce.boolean().optional(),
});

// ========================================
// ANALYTICS SCHEMAS
// ========================================

export const EcommerceAnalyticsQuerySchema = z.object({
    metric: z.enum([
        "USER_REGISTRATIONS",
        "ORDER_TRENDS",
        "REVENUE_ANALYSIS",
        "CONVERSION_RATES",
        "CART_ABANDONMENT",
        "PRODUCT_PERFORMANCE",
        "CUSTOMER_LIFETIME_VALUE",
        "REVIEW_ANALYTICS",
    ]),
    period: z.enum(["DAILY", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY"]),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    groupBy: z.array(z.string()).optional(),
    filters: z.record(z.string(), z.any()).optional(),
    compareWithPrevious: z.coerce.boolean().default(false),
});

// ========================================
// BULK OPERATION SCHEMAS
// ========================================

export const BulkOrderUpdateSchema = z.object({
    orderIds: z
        .array(z.string().cuid())
        .min(1, "At least one order is required")
        .max(100, "Maximum 100 orders allowed"),
    updates: z.object({
        status: EcommerceEnums.OrderStatus.optional(),
        priority: EcommerceEnums.OrderPriority.optional(),
        trackingNumber: z.string().optional(),
        expectedDelivery: z.string().datetime().optional(),
        internalNotes: z.string().max(500).optional(),
    }),
    reason: z.string().min(1, "Reason is required"),
});

export const BulkUserUpdateSchema = z.object({
    userIds: z
        .array(z.string().cuid())
        .min(1, "At least one user is required")
        .max(100, "Maximum 100 users allowed"),
    action: z.enum(["BLOCK", "UNBLOCK", "VERIFY_EMAIL", "SEND_NOTIFICATION"]),
    reason: z.string().min(1, "Reason is required"),
    data: z.record(z.string(), z.any()).optional(),
});

// ========================================
// EXPORT GROUPED SCHEMAS
// ========================================

export const EcommerceSchemas = {
    // User Management
    CreateEcommerceUser: CreateEcommerceUserSchema,
    UpdateEcommerceUser: UpdateEcommerceUserSchema,
    EcommerceLogin: EcommerceLoginSchema,
    SocialLogin: SocialLoginSchema,
    ChangePassword: ChangePasswordSchema,
    ForgotPassword: ForgotPasswordSchema,
    ResetPassword: ResetPasswordSchema,
    VerifyEmail: VerifyEmailSchema,
    VerifyPhone: VerifyPhoneSchema,

    // Address Management
    CreateAddress: CreateAddressSchema,
    UpdateAddress: UpdateAddressSchema,
    SetDefaultAddress: SetDefaultAddressSchema,

    // Shopping
    AddToCart: AddToCartSchema,
    UpdateCartItem: UpdateCartItemSchema,
    BulkUpdateCart: BulkUpdateCartSchema,
    AddToWishlist: AddToWishlistSchema,
    BulkWishlist: BulkWishlistSchema,

    // Orders
    CreateOrder: CreateOrderSchema,
    UpdateOrder: UpdateOrderSchema,
    CancelOrder: CancelOrderSchema,
    ReturnOrder: ReturnOrderSchema,

    // Payments
    CreateOrderPayment: CreateOrderPaymentSchema,
    UpdatePaymentStatus: UpdatePaymentStatusSchema,

    // Reviews
    CreateReview: CreateReviewSchema,
    UpdateReview: UpdateReviewSchema,

    // Queries
    EcommerceUserQuery: EcommerceUserQuerySchema,
    OrderQuery: OrderQuerySchema,
    ReviewQuery: ReviewQuerySchema,
    EcommerceAnalyticsQuery: EcommerceAnalyticsQuerySchema,

    // Bulk Operations
    BulkOrderUpdate: BulkOrderUpdateSchema,
    BulkUserUpdate: BulkUserUpdateSchema,
};

export default EcommerceSchemas;
